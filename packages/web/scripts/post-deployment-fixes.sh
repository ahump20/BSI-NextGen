#!/bin/bash
set -euo pipefail

# Post-Deployment Remediation Script for BSI-NextGen
# Generated: 2025-11-20
# Run this after deployment to fix critical production issues

echo "=========================================="
echo "BSI-NextGen Post-Deployment Fixes"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Run this script from packages/web directory.${NC}"
  exit 1
fi

echo -e "${YELLOW}Step 1: Security Audit${NC}"
echo "Running pnpm audit..."
pnpm audit --production || {
  echo -e "${RED}WARNING: Vulnerabilities found. Review output above.${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
}
echo -e "${GREEN}✓ Security audit complete${NC}"
echo ""

echo -e "${YELLOW}Step 2: TypeScript Strict Mode Check${NC}"
echo "Running TypeScript compiler check..."
pnpm exec tsc --noEmit || {
  echo -e "${RED}WARNING: TypeScript errors found. Fix before deploying again.${NC}"
}
echo -e "${GREEN}✓ TypeScript check complete${NC}"
echo ""

echo -e "${YELLOW}Step 3: Check Environment Variables${NC}"
echo "Verifying required environment variables..."

required_vars=("SPORTSDATAIO_API_KEY" "AUTH0_DOMAIN" "AUTH0_CLIENT_ID" "AUTH0_CLIENT_SECRET" "NEXT_PUBLIC_APP_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo -e "${RED}Missing environment variables:${NC}"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  done
  echo -e "${YELLOW}Set these in Cloudflare Pages dashboard:${NC}"
  echo "  https://dash.cloudflare.com → Pages → bsi-nextgen-web → Settings → Environment Variables"
else
  echo -e "${GREEN}✓ All required environment variables set${NC}"
fi
echo ""

echo -e "${YELLOW}Step 4: Check for Console Logs${NC}"
echo "Scanning for console.log statements..."
log_count=$(grep -r "console\\.log" app/ --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
echo "Found $log_count console.log statements"
if [ "$log_count" -gt 10 ]; then
  echo -e "${YELLOW}Consider replacing with structured logging service (Sentry)${NC}"
fi
echo ""

echo -e "${YELLOW}Step 5: Check for TODOs${NC}"
echo "Scanning for TODO comments..."
grep -rn "TODO\|FIXME\|HACK\|XXX" app/ --include="*.ts" --include="*.tsx" || echo -e "${GREEN}No TODOs found${NC}"
echo ""

echo -e "${YELLOW}Step 6: Lighthouse Audit${NC}"
echo "Run this manually to test production performance:"
echo "  npx lighthouse https://www.blazesportsintel.com/ --view"
echo ""

echo -e "${YELLOW}Step 7: Test Production APIs${NC}"
echo "Testing critical API endpoints..."

endpoints=(
  "https://www.blazesportsintel.com/api/sports/nfl/games?season=2025&week=1"
  "https://www.blazesportsintel.com/api/sports/mlb/games"
  "https://www.blazesportsintel.com/api/sports/college-baseball/games"
)

for endpoint in "${endpoints[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
  if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓${NC} $endpoint - $status"
  else
    echo -e "${RED}✗${NC} $endpoint - $status"
  fi
done
echo ""

echo -e "${GREEN}=========================================="
echo "Post-Deployment Checks Complete"
echo "==========================================${NC}"
echo ""
echo -e "${YELLOW}CRITICAL ACTIONS REQUIRED:${NC}"
echo "1. Set MMI_SERVICE_URL environment variable in Cloudflare dashboard"
echo "2. Add security headers (see next.config.js example below)"
echo "3. Set up monitoring (Sentry, Cloudflare Analytics)"
echo "4. Configure uptime alerts"
echo ""
echo -e "${YELLOW}Security Headers Example (next.config.js):${NC}"
cat << 'EOF'

// Add to next.config.js
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
}
EOF
echo ""
echo -e "${GREEN}All checks complete!${NC}"
