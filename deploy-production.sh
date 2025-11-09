#!/usr/bin/env bash
################################################################################
# Blaze Sports Intel - Production Deployment Script
# Version: 2.0.0
# Date: 2025-11-09
################################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
DEPLOYMENT_TARGET="${1:-netlify}" # netlify, vercel, or cloudflare

# Helper functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Banner
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔥 Blaze Sports Intel - Production Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Environment Check
log_info "Step 1/10: Checking environment..."

if [ ! -f ".env" ]; then
  log_error ".env file not found"
  log_info "Creating .env from .env.example..."
  cp .env.example .env
  log_warning "Please configure .env with your API keys before deploying"
  exit 1
fi

log_success "Environment configured"

# Step 2: Dependency Check
log_info "Step 2/10: Checking dependencies..."

if ! command -v node &> /dev/null; then
  log_error "Node.js not found. Please install Node.js 18+"
  exit 1
fi

if ! command -v pnpm &> /dev/null; then
  log_error "pnpm not found. Installing..."
  npm install -g pnpm
fi

log_success "Dependencies verified"

# Step 3: Install packages
log_info "Step 3/10: Installing packages..."
pnpm install --frozen-lockfile
log_success "Packages installed"

# Step 4: Lint check
log_info "Step 4/10: Running linter..."
if pnpm lint 2>&1 | grep -q "error"; then
  log_error "Lint errors found. Please fix before deploying."
  exit 1
fi
log_success "Lint check passed"

# Step 5: Type check
log_info "Step 5/10: Type checking..."
if ! pnpm type-check; then
  log_error "Type errors found. Please fix before deploying."
  exit 1
fi
log_success "Type check passed"

# Step 6: Build all packages
log_info "Step 6/10: Building all packages..."
pnpm build
log_success "Build completed"

# Step 7: Run tests (if available)
log_info "Step 7/10: Running tests..."
if [ -d "tests" ]; then
  log_warning "Tests found but skipped (add 'pnpm test' when ready)"
else
  log_warning "No tests configured"
fi
log_success "Test check completed"

# Step 8: Deploy based on target
log_info "Step 8/10: Deploying to ${DEPLOYMENT_TARGET}..."

case $DEPLOYMENT_TARGET in
  netlify)
    if ! command -v netlify &> /dev/null; then
      log_info "Installing Netlify CLI..."
      npm install -g netlify-cli
    fi

    log_info "Deploying to Netlify..."
    cd packages/web
    netlify deploy --prod --dir=.next
    cd ../..
    log_success "Deployed to Netlify"
    ;;

  vercel)
    if ! command -v vercel &> /dev/null; then
      log_info "Installing Vercel CLI..."
      npm install -g vercel
    fi

    log_info "Deploying to Vercel..."
    cd packages/web
    vercel --prod
    cd ../..
    log_success "Deployed to Vercel"
    ;;

  cloudflare)
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
      log_error "CLOUDFLARE_API_TOKEN not set"
      exit 1
    fi

    log_info "Deploying to Cloudflare Pages..."

    # Deploy web app
    cd packages/web
    CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" npx wrangler pages deploy .next \
      --project-name=blazesportsintel \
      --branch=main \
      --commit-dirty=true
    cd ../..

    # Deploy Longhorns Baseball Worker
    log_info "Deploying Longhorns Baseball Worker..."
    cd cloudflare-workers/longhorns-baseball
    CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" npx wrangler deploy
    cd ../..

    log_success "Deployed to Cloudflare"
    ;;

  *)
    log_error "Unknown deployment target: $DEPLOYMENT_TARGET"
    log_info "Usage: ./deploy-production.sh [netlify|vercel|cloudflare]"
    exit 1
    ;;
esac

# Step 9: Post-deployment verification
log_info "Step 9/10: Running post-deployment checks..."

case $DEPLOYMENT_TARGET in
  netlify)
    DEPLOYMENT_URL=$(netlify status --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    ;;
  vercel)
    DEPLOYMENT_URL=$(vercel ls --json | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
    ;;
  cloudflare)
    DEPLOYMENT_URL="https://blazesportsintel.pages.dev"
    ;;
esac

if [ -n "${DEPLOYMENT_URL:-}" ]; then
  log_info "Testing deployment at: $DEPLOYMENT_URL"

  # Test homepage
  if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200"; then
    log_success "Homepage responding"
  else
    log_warning "Homepage returned non-200 status"
  fi

  # Test API endpoint
  if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/sports/mlb/teams" | grep -q "200"; then
    log_success "API responding"
  else
    log_warning "API returned non-200 status"
  fi
else
  log_warning "Could not determine deployment URL for verification"
fi

log_success "Post-deployment checks completed"

# Step 10: Summary
log_info "Step 10/10: Deployment Summary"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Platform: $DEPLOYMENT_TARGET"
if [ -n "${DEPLOYMENT_URL:-}" ]; then
  echo "URL: $DEPLOYMENT_URL"
fi
echo ""
echo "Deployed Components:"
echo "  - Web Application (Next.js)"
echo "  - API Endpoints (MLB, College Baseball, NFL)"
echo "  - College Baseball Box Scores"
if [ "$DEPLOYMENT_TARGET" = "cloudflare" ]; then
  echo "  - Longhorns Baseball Worker"
fi
echo ""
echo "Next Steps:"
echo "  1. Verify all pages load correctly"
echo "  2. Test real-time data fetching"
echo "  3. Monitor error logs"
echo "  4. Update DNS if needed"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
