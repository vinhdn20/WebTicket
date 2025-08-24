@echo off
echo 🔧 Optimizing Docker setup for reduced CPU usage...

REM Stop all containers
echo Stopping existing containers...
docker-compose down

REM Remove unused images and containers
echo Cleaning up unused Docker resources...
docker system prune -f

REM Set resource limits in environment
set POSTGRES_CPU_LIMIT=0.5
set POSTGRES_MEMORY_LIMIT=512m
set BACKEND_CPU_LIMIT=1.0
set BACKEND_MEMORY_LIMIT=1g
set FRONTEND_CPU_LIMIT=0.5
set FRONTEND_MEMORY_LIMIT=512m
set NGINX_CPU_LIMIT=0.2
set NGINX_MEMORY_LIMIT=256m

REM Start with optimized settings
echo Starting containers with resource limits...
docker-compose up --build -d

echo ✅ Docker optimization complete!
echo Monitor CPU usage with: docker stats

pause