#!/bin/bash

echo "📊 Resource Usage Monitoring"
echo "============================="

# Function to show CPU and memory for each container
show_container_stats() {
    echo "Container Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

# Function to show PostgreSQL specific stats
show_postgres_stats() {
    echo -e "\n🐘 PostgreSQL Performance:"
    docker exec webticket-postgres psql -U postgres -d webticket -c "
    SELECT 
        datname as database,
        numbackends as connections,
        xact_commit as commits,
        xact_rollback as rollbacks,
        blks_read as disk_reads,
        blks_hit as cache_hits,
        round((blks_hit::float/(blks_hit + blks_read + 1) * 100), 2) as cache_hit_ratio
    FROM pg_stat_database 
    WHERE datname = 'webticket';"
}

# Function to show disk usage
show_disk_usage() {
    echo -e "\n💾 Docker Volume Usage:"
    docker system df
}

# Main monitoring loop
while true; do
    clear
    echo "🕒 $(date)"
    echo "============================="
    
    show_container_stats
    show_postgres_stats 2>/dev/null || echo "PostgreSQL not accessible"
    show_disk_usage
    
    echo -e "\nPress Ctrl+C to exit"
    sleep 5
done