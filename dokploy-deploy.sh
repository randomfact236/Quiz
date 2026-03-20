#!/bin/bash
# =============================================================================
# AI Quiz Platform - Dokploy Deployment Script
# =============================================================================
# This script is designed for Dokploy auto-deploy
# It cleans ALL containers before deploying to prevent name conflicts
# =============================================================================

set -e

COMPOSE_FILE="docker-compose.prod.yml"

echo "[INFO] Cleaning up old containers..."
docker rm -f quiz-frontend quiz-backend quiz-postgres quiz-redis 2>/dev/null || true

echo "[INFO] Deploying with docker compose..."
docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

echo "[SUCCESS] Deployment complete!"
echo "[INFO] Checking container status..."
docker ps | grep quiz-
