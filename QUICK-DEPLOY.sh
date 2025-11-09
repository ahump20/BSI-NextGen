#!/bin/bash

# BSI-NextGen Quick Deploy Script
# Deploys to Vercel with one command

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║   🚀 BSI-NEXTGEN QUICK DEPLOY TO BLAZESPORTSINTEL.COM    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from BSI-NextGen root directory"
    exit 1
fi

echo "📋 Pre-flight checks..."
echo ""

# Check for .env
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file..."
    echo "SPORTSDATAIO_API_KEY=6ca2adb39404482da5406f0a6cd7aa37" > .env
    echo "✅ .env created"
else
    echo "✅ .env exists"
fi

# Check build
echo ""
echo "🔨 Building project..."
pnpm build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors and try again."
    exit 1
fi

echo "✅ Build successful"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  ✅ PRE-FLIGHT COMPLETE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Your platform is ready to deploy!"
echo ""
echo "Next steps:"
echo ""
echo "1. Go to: https://vercel.com/new"
echo "2. Import: ahump20/BSI-NextGen"
echo "3. Root: packages/web"
echo "4. Add env: SPORTSDATAIO_API_KEY=6ca2adb39404482da5406f0a6cd7aa37"
echo "5. Deploy"
echo ""
echo "Live in 3 minutes at: https://bsi-nextgen.vercel.app"
echo ""
echo "Then add custom domain: blazesportsintel.com"
echo ""
echo "════════════════════════════════════════════════════════════"
