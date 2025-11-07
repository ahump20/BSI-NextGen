#!/bin/bash
# Quick Deployment Script for Sandlot Sluggers Baseball Game
# Production-ready build complete! Choose your deployment platform:

set -e

echo "🎮 Sandlot Sluggers - Quick Deploy Script"
echo "=========================================="
echo ""
echo "Production build is ready in ./dist/"
echo ""
echo "Choose deployment platform:"
echo "1) Cloudflare Pages (Best for multiplayer)"
echo "2) Vercel (Fastest deployment)"
echo "3) Netlify (Easy setup)"
echo "4) Local preview"
echo "5) Exit"
echo ""
read -p "Enter choice [1-5]: " choice

case $choice in
  1)
    echo ""
    echo "📋 Cloudflare Pages Deployment"
    echo "================================"
    echo ""
    echo "Step 1: Create project in Cloudflare Dashboard"
    echo "   Go to: https://dash.cloudflare.com/pages"
    echo "   Click 'Create a project' → Name it 'sandlot-sluggers'"
    echo ""
    echo "Step 2: Set your API token:"
    echo "   export CLOUDFLARE_API_TOKEN='your_token_here'"
    echo ""
    echo "Step 3: Deploy:"
    echo "   npx wrangler pages deploy dist --project-name=sandlot-sluggers --branch=main --commit-dirty=true"
    echo ""
    read -p "Have you created the project and set the token? (y/n): " ready
    if [ "$ready" = "y" ]; then
      if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        read -p "Enter your Cloudflare API token: " token
        export CLOUDFLARE_API_TOKEN="$token"
      fi
      npx wrangler pages deploy dist --project-name=sandlot-sluggers --branch=main --commit-dirty=true
    fi
    ;;

  2)
    echo ""
    echo "🔷 Vercel Deployment"
    echo "===================="
    echo ""
    if [ -z "$VERCEL_TOKEN" ]; then
      read -p "Enter your Vercel token (or press Enter to use interactive mode): " token
      export VERCEL_TOKEN="$token"
    fi
    cd "$(dirname "$0")"
    npx vercel --prod dist
    ;;

  3)
    echo ""
    echo "🟢 Netlify Deployment"
    echo "====================="
    echo ""
    cd "$(dirname "$0")"
    npx netlify-cli deploy --prod --dir=dist
    ;;

  4)
    echo ""
    echo "👀 Local Preview"
    echo "================"
    echo ""
    echo "Starting preview server at http://localhost:4173"
    npm run preview
    ;;

  5)
    echo "Exiting..."
    exit 0
    ;;

  *)
    echo "Invalid choice. Exiting..."
    exit 1
    ;;
esac

echo ""
echo "✅ Deployment process complete!"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - PRODUCTION_READY.md (comprehensive guide)"
echo "   - DEPLOYMENT.md (technical details)"
echo ""
echo "🎮 Happy gaming!"
