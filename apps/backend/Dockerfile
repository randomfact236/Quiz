# =============================================================================
# AI Quiz Platform - Backend Dockerfile (NestJS 10)
# =============================================================================
# Multi-stage build for optimized production image
#
# Build Commands:
#   docker build -f apps/backend/Dockerfile -t ai-quiz-backend .
#   docker build -f apps/backend/Dockerfile --target development -t ai-quiz-backend:dev .
#
# Stages:
#   1. deps    - Install dependencies
#   2. builder - Build the application
#   3. production - Final optimized image
# =============================================================================

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install dependencies (production only for smaller image)
RUN npm ci --only=production --silent && \
    npm cache clean --force

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install all dependencies (including devDependencies for build)
RUN npm ci --silent && \
    npm cache clean --force

# Copy source code
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src/
COPY apps/backend/scripts ./apps/backend/scripts/
COPY libs ./libs/
COPY tsconfig.json ./

# Build the application
WORKDIR /app/apps/backend
RUN npm run build

# Generate Prisma client if needed (uncomment if using Prisma)
# RUN npx prisma generate

# =============================================================================
# Stage 3: Production
# =============================================================================
FROM node:20-alpine AS production

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies and security updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    curl \
    netcat-openbsd \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package*.json ./

# Copy TypeORM configuration and migrations
COPY --from=builder /app/apps/backend/src/database ./src/database

# Copy and set up entrypoint script
COPY --from=builder /app/apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:4000/api/health || exit 1

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application
CMD ["node", "dist/main.js"]

# =============================================================================
# Stage 4: Development (Optional - for local development with hot reload)
# =============================================================================
FROM node:20-alpine AS development

ENV NODE_ENV=development
ENV PORT=4000

RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/

# Install all dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY apps/backend/tsconfig*.json ./apps/backend/
COPY apps/backend/src ./apps/backend/src/
COPY apps/backend/scripts ./apps/backend/scripts/
COPY libs ./libs/
COPY tsconfig.json ./

WORKDIR /app/apps/backend

EXPOSE 4000

# Start in development mode with hot reload
CMD ["npm", "run", "start:dev"]
