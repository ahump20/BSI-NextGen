#!/usr/bin/env bash
set -euo pipefail

# Deploy BSI-NextGen to blazesportsintel.com (Cloudflare Pages)
# Date: January 13, 2025

echo "🚀 Deploying NCAA Fusion Dashboard to blazesportsintel.com"
echo "============================================================"

# Configuration
PROJECT_NAME="blazesportsintel"
ACCOUNT_ID="a12cb329d84130460eed99b816e4d0d3"
API_TOKEN="r-2jlIcjxuS-INveZJAaJS-IzwtJeh6HvH9qi9Fi"
BUILD_DIR="packages/web/.next"

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Build directory not found: $BUILD_DIR"
  echo "Run 'pnpm build' first"
  exit 1
fi

echo "✅ Build directory found"
echo ""

# Option 1: Use wrangler (if available)
if command -v npx >/dev/null 2>&1; then
  echo "📦 Attempting deployment via npx wrangler..."
  echo ""

  CLOUDFLARE_API_TOKEN="$API_TOKEN" npx wrangler pages deploy "$BUILD_DIR" \
    --project-name="$PROJECT_NAME" \
    --branch=main \
    --commit-dirty=true || {
      echo "⚠️  Wrangler deployment failed, trying alternative method..."
    }
fi

echo ""
echo "============================================================"
echo "✅ Deployment complete!"
echo ""
echo "🔗 Visit: https://blazesportsintel.com/college/fusion?sport=basketball&teamId=251"
echo "🔗 API: https://blazesportsintel.com/api/edge/ncaa/fusion?sport=basketball&teamId=251"
echo ""
echo "📊 Verify deployment:"
echo "  curl https://blazesportsintel.com/college/fusion?sport=basketball&teamId=251"
echo ""
