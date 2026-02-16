#!/bin/bash
# =============================================================================
# AI Quiz Platform - Production Deployment Script
# =============================================================================
# Usage: ./deploy.sh [command]
# Commands:
#   deploy      - Full deployment (build + start)
#   build       - Build all Docker images
#   start       - Start all services
#   stop        - Stop all services
#   restart     - Restart all services
#   logs        - Show logs from all services
#   status      - Check service status
#   update      - Pull latest code and redeploy
#   backup      - Backup database
#   clean       - Clean up unused Docker resources
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_prerequisites() {
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "Environment file not found: $ENV_FILE"
        log_info "Creating from template..."
        if [ -f ".env.production.example" ]; then
            cp .env.production.example "$ENV_FILE"
            log_error "Please edit $ENV_FILE with your production values before deploying"
            exit 1
        else
            log_error "Template file not found. Please create $ENV_FILE manually"
            exit 1
        fi
    fi
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
}

# Get docker compose command
get_compose_cmd() {
    if docker compose version &> /dev/null; then
        echo "docker compose -f $COMPOSE_FILE --env-file $ENV_FILE"
    else
        echo "docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE"
    fi
}

# Build all images
cmd_build() {
    log_info "Building Docker images..."
    $(get_compose_cmd) build --no-cache
    log_success "Build completed"
}

# Start all services
cmd_start() {
    log_info "Starting services..."
    $(get_compose_cmd) up -d
    log_success "Services started"
    
    log_info "Waiting for health checks..."
    sleep 10
    cmd_status
}

# Stop all services
cmd_stop() {
    log_info "Stopping services..."
    $(get_compose_cmd) down
    log_success "Services stopped"
}

# Restart all services
cmd_restart() {
    log_info "Restarting services..."
    $(get_compose_cmd) restart
    log_success "Services restarted"
    
    log_info "Waiting for health checks..."
    sleep 10
    cmd_status
}

# Show logs
cmd_logs() {
    $(get_compose_cmd) logs -f --tail=100
}

# Check status
cmd_status() {
    log_info "Service Status:"
    $(get_compose_cmd) ps
    
    log_info "\nHealth Checks:"
    
    # Check backend health
    if curl -sf http://localhost:4000/api/health &> /dev/null; then
        log_success "Backend API: Healthy"
    else
        log_error "Backend API: Unhealthy"
    fi
    
    # Check frontend health
    if curl -sf http://localhost:3010/ &> /dev/null; then
        log_success "Frontend: Healthy"
    else
        log_error "Frontend: Unhealthy"
    fi
}

# Full deployment
cmd_deploy() {
    log_info "Starting full deployment..."
    check_prerequisites
    cmd_build
    cmd_start
    log_success "Deployment completed!"
    log_info "Frontend: http://localhost:3010"
    log_info "Backend API: http://localhost:4000/api"
}

# Update and redeploy
cmd_update() {
    log_info "Updating application..."
    
    # Backup database first
    cmd_backup
    
    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main
    
    # Rebuild and restart
    cmd_build
    cmd_restart
    
    log_success "Update completed!"
}

# Backup database
cmd_backup() {
    log_info "Creating database backup..."
    
    BACKUP_DIR="backups"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    # Get database credentials from env file
    source "$ENV_FILE"
    
    # Create backup
    docker exec quiz-postgres-prod pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_FILE"
    
    log_success "Backup created: $BACKUP_FILE"
    
    # Clean up old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "backup_*.sql" -mtime +7 -delete
    log_info "Old backups cleaned up"
}

# Clean up Docker resources
cmd_clean() {
    log_info "Cleaning up unused Docker resources..."
    docker system prune -af --volumes
    log_success "Cleanup completed"
}

# Show help
cmd_help() {
    echo "AI Quiz Platform - Deployment Script"
    echo ""
    echo "Usage: ./deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  deploy    - Full deployment (build + start)"
    echo "  build     - Build all Docker images"
    echo "  start     - Start all services"
    echo "  stop      - Stop all services"
    echo "  restart   - Restart all services"
    echo "  logs      - Show logs from all services"
    echo "  status    - Check service status and health"
    echo "  update    - Pull latest code and redeploy"
    echo "  backup    - Backup database"
    echo "  clean     - Clean up unused Docker resources"
    echo "  help      - Show this help message"
}

# Main
main() {
    case "${1:-deploy}" in
        deploy)
            cmd_deploy
            ;;
        build)
            cmd_build
            ;;
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
            cmd_logs
            ;;
        status)
            cmd_status
            ;;
        update)
            cmd_update
            ;;
        backup)
            cmd_backup
            ;;
        clean)
            cmd_clean
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            log_error "Unknown command: $1"
            cmd_help
            exit 1
            ;;
    esac
}

main "$@"
