#!/bin/bash

# Munda Market - Quick Deployment Script
# This script helps you deploy all components of the Munda Market platform

echo "🚀 Munda Market Deployment Script"
echo "=================================="
echo ""

# Check prerequisites
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed. Aborting." >&2; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"; }
command -v flutter >/dev/null 2>&1 || { echo "⚠️  Flutter not found (only needed for mobile app)"; }

echo "✅ Prerequisites check complete"
echo ""

# Menu
echo "Select deployment target:"
echo "1) Deploy Admin Console (Vercel)"
echo "2) Deploy Buyer Portal (Vercel)"
echo "3) Build Flutter App (Google Play)"
echo "4) Deploy All Frontends"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
  1)
    echo ""
    echo "📦 Deploying Admin Console to Vercel..."
    cd admin-console
    vercel --prod
    echo "✅ Admin Console deployed!"
    ;;
  2)
    echo ""
    echo "📦 Deploying Buyer Portal to Vercel..."
    cd buyer-portal
    vercel --prod
    echo "✅ Buyer Portal deployed!"
    ;;
  3)
    echo ""
    echo "📱 Building Flutter App..."
    cd farmer-app
    flutter build appbundle --release
    echo "✅ App Bundle created at: build/app/outputs/bundle/release/app-release.aab"
    echo "📤 Upload this file to Google Play Console"
    ;;
  4)
    echo ""
    echo "📦 Deploying all frontends..."
    
    echo "→ Admin Console..."
    cd admin-console
    vercel --prod
    cd ..
    
    echo "→ Buyer Portal..."
    cd buyer-portal
    vercel --prod
    cd ..
    
    echo "✅ All frontends deployed!"
    ;;
  5)
    echo "👋 Goodbye!"
    exit 0
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check Vercel dashboard for deployment URLs"
echo "2. Update DNS records for custom domains"
echo "3. Test all functionality"
echo "4. Monitor logs for errors"
echo ""
echo "📚 See DEPLOYMENT_GUIDE.md for detailed instructions"

