#!/bin/bash
# =============================================================================
# AI Quiz Platform - Docker Startup Script
# =============================================================================
# This script automates the deployment of the AI Quiz Platform with Docker
#
# Usage:
#   ./scripts/docker-startup.sh [command] [options]
#
# Commands:
#   start       - Start all services (default)
#   stop        - Stop all services
#   restart     - Restart all services
#   logs        - View logs from all services
#   status      - Check service status
#   migrate     - Run database migrations only
#   setup       - Initial setup (creates .env, runs migrations)
#   clean       - Stop and remove all data (WARNING: destroys all data!)
#   build       - Rebuild all Docker images
#   update      - Pull latest code and update containers
#
# Options:
#   --production  - Use production profile (includes nginx)
#   --nginx       - Include nginx reverse proxy
#   --verbose     - Verbose output
#
# Examples:
#   ./scripts/docker-startup.sh start
#   ./scripts/docker-startup.sh start --production
#   ./scripts/docker-startup.sh logs backend
#   ./scripts/docker-startup.sh setup
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Default values
COMMAND="start"
PROFILE=""
VERBOSE=false
SERVICE=""

# =============================================================================
# Helper Functions
# =============================================================================
print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║              AI Quiz Platform - Docker Deployment                ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi

    print_success "Docker and Docker Compose are installed"
}

check_env_file() {
    if [ ! -f "${PROJECT_ROOT}/.env" ]; then
        print_warning ".env file not found!"
        if [ -f "${PROJECT_ROOT}/.env.example" ]; then
            print_info "Creating .env from .env.example..."
            cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
            print_warning "Please edit .env file with your configuration before continuing!"
            print_info "File location: ${PROJECT_ROOT}/.env"
            exit 1
        else
            print_error ".env.example file not found! Cannot create .env file."
            exit 1
        fi
    fi
    print_success ".env file exists"
}

get_compose_command() {
    if docker compose version &> /dev/null; then
        echo "docker compose"
    else
        echo "docker-compose"
    fi
}

# =============================================================================
# Command Functions
# =============================================================================
cmd_start() {
    print_banner
    check_docker
    check_env_file

    local compose_cmd=$(get_compose_command)
    local profile_args=""

    if [ -n "$PROFILE" ]; then
        profile_args="--profile ${PROFILE}"
        print_info "Using profile: ${PROFILE}"
    fi

    print_info "Building and starting services..."
    
    # Build images
    print_info "Building Docker images..."
    ${compose_cmd} ${profile_args} build --parallel
    
    # Start services
    print_info "Starting services..."
    ${compose_cmd} ${profile_args} up -d --remove-orphans

    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 5

    # Run migrations if database is new
    if [ "$COMMAND" = "setup" ]; then
        cmd_migrate
    fi

    print_success "All services are running!"
    echo ""
    echo -e "${GREEN}Access your application:${NC}"
    echo "  - Frontend:    http://localhost:3010"
    echo "  - Backend API: http://localhost:4000/api"
    echo "  - API Docs:    http://localhost:4000/api/docs"
    echo "  - Health:      http://localhost:4000/api/health"
    
    if [ "$PROFILE" = "nginx" ] || [ "$PROFILE" = "production" ]; then
        echo "  - Nginx:       http://localhost (port 80)"
        echo "  - MinIO Console: http://localhost:9001"
    fi
    
    echo ""
    print_info "View logs with: ./scripts/docker-startup.sh logs"
}

cmd_stop() {
    print_banner
    local compose_cmd=$(get_compose_command)
    
    print_info "Stopping services..."
    ${compose_cmd} --profile nginx --profile production --profile migrate --profile setup down
    
    print_success "All services stopped"
}

cmd_restart() {
    print_banner
    cmd_stop
    sleep 2
    cmd_start
}

cmd_logs() {
    local compose_cmd=$(get_compose_command)
    local service=$1
    
    if [ -n "$service" ]; then
        ${compose_cmd} logs -f "$service"
    else
        ${compose_cmd} logs -f
    fi
}

cmd_status() {
    print_banner
    local compose_cmd=$(get_compose_command)
    
    echo -e "${BLUE}Service Status:${NC}"
    ${compose_cmd} ps
    
    echo ""
    echo -e "${BLUE}Resource Usage:${NC}"
    ${compose_cmd} top 2>/dev/null || print_warning "Resource usage not available"
}

cmd_migrate() {
    print_banner
    check_docker
    check_env_file
    
    local compose_cmd=$(get_compose_command)
    
    print_info "Running database migrations..."
    
    # Start database if not running
    if ! ${compose_cmd} ps | grep -q "ai-quiz-postgres"; then
        print_info "Starting database..."
        ${compose_cmd} up -d postgres
        sleep 5
    fi
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    until ${compose_cmd} exec -T postgres pg_isready -U "${DB_USERNAME:-aiquiz}" -d "${DB_DATABASE:-aiquiz}" > /dev/null 2>&1; do
        sleep 1
    done
    print_success "Database is ready"
    
    # Run migrations
    print_info "Executing migrations..."
    ${compose_cmd} --profile migrate run --rm migrate
    
    print_success "Migrations completed!"
}

cmd_setup() {
    print_banner
    print_info "Initial setup for AI Quiz Platform"
    
    check_docker
    
    # Check/create .env file
    if [ ! -f "${PROJECT_ROOT}/.env" ]; then
        if [ -f "${PROJECT_ROOT}/.env.example" ]; then
            print_info "Creating .env from .env.example..."
            cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
            print_warning "IMPORTANT: Please edit ${PROJECT_ROOT}/.env with your secure passwords!"
            
            # Generate secure passwords
            print_info "Generating secure passwords..."
            
            DB_PASSWORD=$(openssl rand -base64 32 2>/dev/null || tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
            REDIS_PASSWORD=$(openssl rand -base64 32 2>/dev/null || tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
            MINIO_PASSWORD=$(openssl rand -base64 32 2>/dev/null || tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 32)
            JWT_SECRET=$(openssl rand -hex 64 2>/dev/null || tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 128)
            
            # Update .env file
            sed -i.bak "s/change_this_to_secure_password_123/${DB_PASSWORD}/g" "${PROJECT_ROOT}/.env"
            sed -i.bak "s/change_this_redis_password_456/${REDIS_PASSWORD}/g" "${PROJECT_ROOT}/.env"
            sed -i.bak "s/change_this_minio_password_789/${MINIO_PASSWORD}/g" "${PROJECT_ROOT}/.env"
            sed -i.bak "s/change_this_to_a_very_long_random_secret_key_min_64_chars_long_for_security/${JWT_SECRET}/g" "${PROJECT_ROOT}/.env"
            rm -f "${PROJECT_ROOT}/.env.bak"
            
            print_success "Secure passwords generated and saved to .env"
            print_warning "Please review the .env file before continuing!"
            read -p "Press Enter to continue or Ctrl+C to abort..."
        fi
    fi
    
    # Source the .env file
    set -a
    source "${PROJECT_ROOT}/.env"
    set +a
    
    # Create necessary directories
    mkdir -p "${PROJECT_ROOT}/infrastructure/docker/nginx/conf.d"
    mkdir -p "${PROJECT_ROOT}/infrastructure/docker/postgres/init"
    
    COMMAND="setup"
    cmd_start
}

cmd_clean() {
    print_banner
    print_warning "WARNING: This will remove all containers and volumes!"
    print_warning "All data will be lost including database and uploaded files!"
    echo ""
    read -p "Are you sure? Type 'yes' to continue: " confirm
    
    if [ "$confirm" = "yes" ]; then
        local compose_cmd=$(get_compose_command)
        
        print_info "Stopping services..."
        ${compose_cmd} --profile nginx --profile production --profile migrate --profile setup down -v
        
        print_info "Removing volumes..."
        docker volume rm -f ai-quiz-postgres-data ai-quiz-redis-data ai-quiz-minio-data ai-quiz-backend-logs ai-quiz-nginx-cache 2>/dev/null || true
        
        print_success "All data cleaned!"
    else
        print_info "Clean operation cancelled"
    fi
}

cmd_build() {
    print_banner
    check_docker
    
    local compose_cmd=$(get_compose_command)
    local profile_args=""
    
    if [ -n "$PROFILE" ]; then
        profile_args="--profile ${PROFILE}"
    fi
    
    print_info "Rebuilding Docker images (no cache)..."
    ${compose_cmd} ${profile_args} build --no-cache --parallel
    
    print_success "Images rebuilt!"
}

cmd_update() {
    print_banner
    print_info "Updating AI Quiz Platform..."
    
    # Pull latest code
    if [ -d "${PROJECT_ROOT}/.git" ]; then
        print_info "Pulling latest code..."
        git -C "${PROJECT_ROOT}" pull
    fi
    
    # Rebuild and restart
    cmd_build
    cmd_restart
}

cmd_help() {
    cat << EOF
AI Quiz Platform - Docker Startup Script

Usage: $0 [command] [options]

Commands:
  start       Start all services (default)
  stop        Stop all services
  restart     Restart all services
  logs        View logs from all services
  status      Check service status
  migrate     Run database migrations only
  setup       Initial setup (creates .env, runs migrations)
  clean       Stop and remove all data (WARNING: destroys all data!)
  build       Rebuild all Docker images
  update      Pull latest code and update containers
  help        Show this help message

Options:
  --production  Use production profile (includes nginx)
  --nginx       Include nginx reverse proxy
  --verbose     Verbose output

Examples:
  $0 start                    # Start all services
  $0 start --production       # Start with nginx
  $0 logs backend             # View backend logs
  $0 setup                    # Initial setup
  $0 migrate                  # Run migrations only
  $0 clean                    # Clean all data

EOF
}

# =============================================================================
# Parse Arguments
# =============================================================================
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|logs|status|migrate|setup|clean|build|update|help)
                COMMAND="$1"
                ;;
            --production)
                PROFILE="production"
                ;;
            --nginx)
                PROFILE="nginx"
                ;;
            --verbose)
                VERBOSE=true
                set -x
                ;;
            --help|-h)
                cmd_help
                exit 0
                ;;
            *)
                SERVICE="$1"
                ;;
        esac
        shift
    done
}

# =============================================================================
# Main
# =============================================================================
main() {
    # Change to project root
    cd "${PROJECT_ROOT}"
    
    # Parse arguments
    parse_args "$@"
    
    # Execute command
    case $COMMAND in
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        logs)
            cmd_logs "$SERVICE"
            ;;
        status)
            cmd_status
            ;;
        migrate)
            cmd_migrate
            ;;
        setup)
            cmd_setup
            ;;
        clean)
            cmd_clean
            ;;
        build)
            cmd_build
            ;;
        update)
            cmd_update
            ;;
        help)
            cmd_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            cmd_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
