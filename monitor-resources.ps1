# PowerShell monitoring script
Write-Host "📊 Resource Usage Monitoring" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

function Show-ContainerStats {
    Write-Host "`nContainer Resource Usage:" -ForegroundColor Yellow
    docker stats --no-stream --format "table {{.Container}}`t{{.CPUPerc}}`t{{.MemUsage}}`t{{.MemPerc}}"
}

function Show-DiskUsage {
    Write-Host "`n💾 Docker Volume Usage:" -ForegroundColor Yellow
    docker system df
}

# Main monitoring loop
while ($true) {
    Clear-Host
    Write-Host "🕒 $(Get-Date)" -ForegroundColor Cyan
    Write-Host "=============================" -ForegroundColor Green
    
    Show-ContainerStats
    Show-DiskUsage
    
    Write-Host "`nPress Ctrl+C to exit" -ForegroundColor Gray
    Start-Sleep -Seconds 5
}