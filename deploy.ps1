# Munda Market - Quick Deployment Script (PowerShell)
# This script helps you deploy all components of the Munda Market platform

Write-Host "🚀 Munda Market Deployment Script" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Check prerequisites
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Vercel CLI not found. Install with: npm i -g vercel" -ForegroundColor Yellow
}

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  Flutter not found (only needed for mobile app)" -ForegroundColor Yellow
}

Write-Host "✅ Prerequisites check complete" -ForegroundColor Green
Write-Host ""

# Menu
Write-Host "Select deployment target:" -ForegroundColor Cyan
Write-Host "1) Deploy Admin Console (Vercel)"
Write-Host "2) Deploy Buyer Portal (Vercel)"
Write-Host "3) Build Flutter App (Google Play)"
Write-Host "4) Deploy All Frontends"
Write-Host "5) Exit"
Write-Host ""
$choice = Read-Host "Enter choice [1-5]"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "📦 Deploying Admin Console to Vercel..." -ForegroundColor Cyan
        Set-Location admin-console
        vercel --prod
        Write-Host "✅ Admin Console deployed!" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "📦 Deploying Buyer Portal to Vercel..." -ForegroundColor Cyan
        Set-Location buyer-portal
        vercel --prod
        Write-Host "✅ Buyer Portal deployed!" -ForegroundColor Green
    }
    "3" {
        Write-Host ""
        Write-Host "📱 Building Flutter App..." -ForegroundColor Cyan
        Set-Location farmer-app
        flutter build appbundle --release
        Write-Host "✅ App Bundle created at: build/app/outputs/bundle/release/app-release.aab" -ForegroundColor Green
        Write-Host "📤 Upload this file to Google Play Console" -ForegroundColor Yellow
    }
    "4" {
        Write-Host ""
        Write-Host "📦 Deploying all frontends..." -ForegroundColor Cyan
        
        Write-Host "→ Admin Console..." -ForegroundColor White
        Set-Location admin-console
        vercel --prod
        Set-Location ..
        
        Write-Host "→ Buyer Portal..." -ForegroundColor White
        Set-Location buyer-portal
        vercel --prod
        Set-Location ..
        
        Write-Host "✅ All frontends deployed!" -ForegroundColor Green
    }
    "5" {
        Write-Host "👋 Goodbye!" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Invalid choice" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check Vercel dashboard for deployment URLs"
Write-Host "2. Update DNS records for custom domains"
Write-Host "3. Test all functionality"
Write-Host "4. Monitor logs for errors"
Write-Host ""
Write-Host "📚 See DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Yellow

