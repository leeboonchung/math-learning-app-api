# Test script for Vercel deployment (PowerShell)
# Usage: .\test-deployment.ps1 -VercelUrl "https://your-app.vercel.app"

param(
    [Parameter(Mandatory=$true)]
    [string]$VercelUrl
)

Write-Host "Testing Vercel deployment at: $VercelUrl" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

try {
    # Test health endpoint
    Write-Host "1. Testing health endpoint..." -ForegroundColor Yellow
    $healthResponse = Invoke-RestMethod -Uri "$VercelUrl/api/health" -Method GET
    Write-Host $($healthResponse | ConvertTo-Json) -ForegroundColor Cyan
    Write-Host ""

    # Test API docs
    Write-Host "2. Testing API documentation..." -ForegroundColor Yellow
    try {
        $docsResponse = Invoke-WebRequest -Uri "$VercelUrl/api-docs" -Method GET
        Write-Host "API docs status code: $($docsResponse.StatusCode)" -ForegroundColor Cyan
    } catch {
        Write-Host "API docs test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    # Test lessons endpoint (no auth required)
    Write-Host "3. Testing lessons endpoint..." -ForegroundColor Yellow
    try {
        $lessonsResponse = Invoke-RestMethod -Uri "$VercelUrl/api/lessons" -Method GET
        Write-Host $($lessonsResponse | ConvertTo-Json) -ForegroundColor Cyan
    } catch {
        Write-Host "Lessons endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""

    Write-Host "Deployment test completed!" -ForegroundColor Green
    Write-Host "Visit $VercelUrl/api-docs to see the full API documentation" -ForegroundColor Green

} catch {
    Write-Host "Error during testing: $($_.Exception.Message)" -ForegroundColor Red
}
