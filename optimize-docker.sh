#!/bin/bash

echo "🔧 Optimizing Docker setup for reduced CPU usage..."

# Stop all containers
echo "Stopping existing containers..."
docker-compose down

# Remove unused images and containers
echo "Cleaning up unused Docker resources..."
docker system prune -f

# Set resource limits in environment
export POSTGRES_CPU_LIMIT=0.5
export POSTGRES_MEMORY_LIMIT=512m
export BACKEND_CPU_LIMIT=1.0
export BACKEND_MEMORY_LIMIT=1g
export FRONTEND_CPU_LIMIT=0.5
export FRONTEND_MEMORY_LIMIT=512m
export NGINX_CPU_LIMIT=0.2
export NGINX_MEMORY_LIMIT=256m

# Start with optimized settings
echo "Starting containers with resource limits..."
docker-compose up --build -d

echo "✅ Docker optimization complete!"
echo "Monitor CPU usage with: docker stats"