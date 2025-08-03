#!/usr/bin/env pwsh

Write-Host "Testing Fly.io Configuration" -ForegroundColor Green
Write-Host ""

# Check if fly.toml exists
if (Test-Path "fly.toml") {
    Write-Host "✅ fly.toml exists" -ForegroundColor Green
    
    # Read and parse the config
    $flyConfig = Get-Content "fly.toml"
    $appLine = $flyConfig | Where-Object { $_ -match '^app\s*=' }
    
    if ($appLine) {
        Write-Host "✅ App name found: $appLine" -ForegroundColor Green
        
        # Extract app name
        if ($appLine -match 'app\s*=\s*["\"]([^"\"]+)["\"]') {
            $appName = $matches[1]
            Write-Host "✅ Parsed app name: '$appName'" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not parse app name from: $appLine" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ No app name found in fly.toml" -ForegroundColor Red
    }
    
    # Show full config
    Write-Host ""
    Write-Host "Current fly.toml content:" -ForegroundColor Cyan
    Write-Host "------------------------" -ForegroundColor Cyan
    Get-Content "fly.toml" | ForEach-Object { Write-Host $_ -ForegroundColor White }
    
} else {
    Write-Host "❌ fly.toml not found in current directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor White
}

Write-Host ""
Write-Host "Recommended deployment command:" -ForegroundColor Cyan
Write-Host "flyctl deploy --remote-only --app prototypes --build-arg NEXT_PUBLIC_GOOGLE_CLIENT_ID=`"509405291776-3okmqhk0rlhiblo58nso00r5bbho1925.apps.googleusercontent.com`" --build-arg NEXT_PUBLIC_API_URL=`"https://grokapi.fly.dev/api`"" -ForegroundColor Yellow