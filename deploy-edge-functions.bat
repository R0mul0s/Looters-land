@echo off
REM Deploy Edge Functions Script
REM Run this after setting SUPABASE_SECRET_KEY

echo ========================================
echo Edge Functions Deployment
echo ========================================
echo.

REM Check if secret key is set
echo Step 1: Setting secret key...
echo Please replace YOUR_SECRET_KEY_HERE with actual secret key from Supabase Dashboard
echo.
set /p SECRET_KEY="Enter your Secret Key from Supabase Dashboard: "

if "%SECRET_KEY%"=="" (
    echo ERROR: Secret key cannot be empty!
    pause
    exit /b 1
)

echo.
echo Setting SUPABASE_SECRET_KEY environment variable...
supabase secrets set SUPABASE_SECRET_KEY=%SECRET_KEY%

if %errorlevel% neq 0 (
    echo ERROR: Failed to set secret key!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Deploying Edge Functions...
echo ========================================
echo.

echo Deploying daily-reset...
supabase functions deploy daily-reset

if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy daily-reset!
    pause
    exit /b 1
)

echo.
echo Deploying update-global-world-state...
supabase functions deploy update-global-world-state

if %errorlevel% neq 0 (
    echo ERROR: Failed to deploy update-global-world-state!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Verifying secrets...
supabase secrets list

echo.
echo DONE! Edge Functions are now deployed with secret key.
echo.
pause
