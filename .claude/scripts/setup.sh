#!/bin/bash

# =============================================================================
# BSI-NextGen Claude Code Web Setup Script
# =============================================================================
# This script runs automatically when a Claude Code web session starts.
# It ensures all dependencies are installed and packages are built.
# =============================================================================

set -e  # Exit on error

echo "🚀 BSI-NextGen Claude Code Setup"
echo "================================="
echo ""

# Check Node.js version
echo "📋 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js: $NODE_VERSION"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found - installing globally..."
    npm install -g pnpm
    echo "✅ pnpm installed"
else
    PNPM_VERSION=$(pnpm --version)
    echo "   pnpm: v$PNPM_VERSION"
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if pnpm install --frozen-lockfile; then
    echo "✅ Dependencies installed"
else
    echo "⚠️  Frozen lockfile failed, trying regular install..."
    pnpm install
    echo "✅ Dependencies installed (lockfile updated)"
fi

echo ""

# Build all packages
echo "🔨 Building packages..."
echo "   Building @bsi/shared..."
pnpm --filter @bsi/shared build

echo "   Building @bsi/api..."
pnpm --filter @bsi/api build

echo "   Building @bsi/web..."
pnpm --filter @bsi/web build

echo ""
echo "✅ All packages built successfully"

echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found"
    echo "   Copy .env.example to .env and add your API keys:"
    echo "   cp .env.example .env"
    echo ""
    echo "   Required environment variables:"
    echo "   - SPORTSDATAIO_API_KEY (for NFL/NBA data)"
    echo "   - AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET (for auth)"
    echo "   - JWT_SECRET (for session tokens)"
else
    echo "✅ .env file found"
fi

echo ""

# Check Playwright browsers
if ! npx playwright --version &> /dev/null; then
    echo "⚠️  Playwright not found - skipping browser check"
else
    echo "🎭 Playwright detected"
    echo "   To run tests, first install browsers:"
    echo "   npx playwright install"
fi

echo ""
echo "================================="
echo "✨ Setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm dev        # Start Next.js dev server (http://localhost:3000)"
echo "  pnpm build      # Build all packages"
echo "  pnpm lint       # Lint all packages"
echo "  pnpm test       # Run Playwright tests (after browser install)"
echo ""
echo "Documentation:"
echo "  CLAUDE.md       # Development guide"
echo "  .env.example    # Environment variables template"
echo ""

exit 0
