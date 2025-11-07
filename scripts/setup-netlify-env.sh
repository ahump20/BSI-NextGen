#!/usr/bin/env bash

###############################################################################
# Netlify Environment Variables Setup Script
#
# This script outputs the exact environment variables you need to add
# to your Netlify dashboard for Sandlot Sluggers deployment.
#
# Usage:
#   1. Run this script to see the variables: ./scripts/setup-netlify-env.sh
#   2. Copy each variable to Netlify dashboard:
#      Go to: Site settings → Environment variables → Add a variable
#
###############################################################################

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🔐 Netlify Environment Variables Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo -e "${YELLOW}Instructions:${NC}"
echo "1. Go to: https://app.netlify.com"
echo "2. Select your site: Sandlot Sluggers"
echo "3. Navigate to: Site settings → Environment variables"
echo "4. Click: Add a variable"
echo "5. Copy each variable below:"
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Required Environment Variables${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo "Variable 1:"
echo "  Key: VITE_BLAZE_API_URL"
echo "  Value: https://api.blazesportsintel.com"
echo "  Scopes: Production, Deploy Previews, Branch deploys"
echo ""

echo "Variable 2:"
echo "  Key: VITE_BLAZE_CLIENT_ID"
echo "  Value: X252EXMZ5BD2XZNIU804XVGYM9A6KXG4"
echo "  Scopes: Production, Deploy Previews, Branch deploys"
echo ""

echo "Variable 3:"
echo "  Key: VITE_BLAZE_CLIENT_SECRET"
echo "  Value: 4252V9LMU8NHY4KN7WIVR3RVNW4WXHV3456ZNE6XGUNEOR3BHE3NPD1JXE62WNHG"
echo "  Scopes: Production, Deploy Previews, Branch deploys"
echo ""

echo "Variable 4:"
echo "  Key: VITE_BLAZE_API_KEY"
echo "  Value: blaze_live_83453667ea265aa73a3ccae226cc0003ba006b27a36fe8470828e65f6c7871f5"
echo "  Scopes: Production, Deploy Previews, Branch deploys"
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${YELLOW}Optional Environment Variables${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo "Variable 5 (optional):"
echo "  Key: VITE_SENTRY_DSN"
echo "  Value: [your Sentry DSN if using error tracking]"
echo "  Scopes: Production, Deploy Previews, Branch deploys"
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Quick Copy Commands${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo "If using Netlify CLI, you can also set these via command line:"
echo ""
echo 'netlify env:set VITE_BLAZE_API_URL "https://api.blazesportsintel.com"'
echo 'netlify env:set VITE_BLAZE_CLIENT_ID "X252EXMZ5BD2XZNIU804XVGYM9A6KXG4"'
echo 'netlify env:set VITE_BLAZE_CLIENT_SECRET "4252V9LMU8NHY4KN7WIVR3RVNW4WXHV3456ZNE6XGUNEOR3BHE3NPD1JXE62WNHG"'
echo 'netlify env:set VITE_BLAZE_API_KEY "blaze_live_83453667ea265aa73a3ccae226cc0003ba006b27a36fe8470828e65f6c7871f5"'
echo ""

echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Setup Complete${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "After adding these variables:"
echo "  1. Trigger a new deployment (push to main or manual deploy)"
echo "  2. Verify deployment at: https://sandlot-sluggers.netlify.app"
echo "  3. Check console for: ✅ Stats synced to Blaze Sports Intel"
echo ""
