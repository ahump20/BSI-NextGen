#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  echo "Not running in remote environment, skipping session setup"
  exit 0
fi

echo "🚀 Starting BSI-NextGen session setup..."

# Install dependencies with pnpm
echo "📦 Installing dependencies with pnpm..."
pnpm install

# Build core packages (shared and api) - these don't require network access
echo "🔨 Building core packages (shared & api)..."
pnpm --filter @bsi/shared build
pnpm --filter @bsi/api build

# Attempt to build web package, but don't fail if it has network issues
echo "🔨 Attempting to build web package..."
if pnpm --filter @bsi/web build 2>/dev/null; then
  echo "✅ Web package built successfully"
else
  echo "⚠️  Web package build skipped (will build on first dev run)"
fi

echo "✅ Session setup complete! Dependencies installed and core packages built."
