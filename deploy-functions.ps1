# Deploy Edge Functions PowerShell Script
# Deploys both daily-reset and update-global-world-state Edge Functions

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deploying Edge Functions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Supabase CLI is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Install it from: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "Deploying daily-reset..." -ForegroundColor Yellow
supabase functions deploy daily-reset

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy daily-reset!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Deploying update-global-world-state..." -ForegroundColor Yellow
supabase functions deploy update-global-world-state

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy update-global-world-state!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Checking Edge Function Secrets..." -ForegroundColor Cyan
supabase secrets list

Write-Host ""
Write-Host "DONE! You can now test the Edge Functions in Supabase Dashboard." -ForegroundColor Green
