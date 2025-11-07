#!/usr/bin/env bash

###############################################################################
# Vercel Secrets Setup Script
#
# This script sets up Vercel secrets for Sandlot Sluggers deployment.
#
# Prerequisites:
#   - Vercel CLI installed: npm install -g vercel
#   - Logged in: vercel login
#
# Usage:
#   ./scripts/setup-vercel-secrets.sh
#
###############################################################################

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🔐 Vercel Secrets Setup${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g vercel"
    echo ""
    echo "Then run: vercel login"
    exit 1
fi

echo -e "${YELLOW}Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel${NC}"
    echo ""
    echo "Login with:"
    echo "  vercel login"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

echo -e "${YELLOW}This script will create the following secrets:${NC}"
echo "  - vite_blaze_api_url"
echo "  - vite_blaze_client_id"
echo "  - vite_blaze_client_secret"
echo "  - vite_blaze_api_key"
echo "  - vite_sentry_dsn (optional)"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo -e "${BLUE}Creating secrets...${NC}"
echo ""

# Create secrets
echo -n "1. Creating vite_blaze_api_url... "
if vercel secrets add vite_blaze_api_url "https://api.blazesportsintel.com" &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}(already exists)${NC}"
fi

echo -n "2. Creating vite_blaze_client_id... "
if vercel secrets add vite_blaze_client_id "X252EXMZ5BD2XZNIU804XVGYM9A6KXG4" &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}(already exists)${NC}"
fi

echo -n "3. Creating vite_blaze_client_secret... "
if vercel secrets add vite_blaze_client_secret "4252V9LMU8NHY4KN7WIVR3RVNW4WXHV3456ZNE6XGUNEOR3BHE3NPD1JXE62WNHG" &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}(already exists)${NC}"
fi

echo -n "4. Creating vite_blaze_api_key... "
if vercel secrets add vite_blaze_api_key "blaze_live_83453667ea265aa73a3ccae226cc0003ba006b27a36fe8470828e65f6c7871f5" &> /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}(already exists)${NC}"
fi

echo ""
echo -e "${YELLOW}Optional: Sentry DSN${NC}"
read -p "Do you have a Sentry DSN to add? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter Sentry DSN: " SENTRY_DSN
    if [ ! -z "$SENTRY_DSN" ]; then
        echo -n "5. Creating vite_sentry_dsn... "
        if vercel secrets add vite_sentry_dsn "$SENTRY_DSN" &> /dev/null; then
            echo -e "${GREEN}✓${NC}"
        else
            echo -e "${YELLOW}(already exists)${NC}"
        fi
    fi
else
    echo "Skipping Sentry DSN."
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Secrets Created${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

echo "Verifying secrets..."
echo ""
vercel secrets ls

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}Next Steps${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo "1. Your vercel.json already references these secrets"
echo "2. Import your project: vercel"
echo "3. Deploy to production: vercel --prod"
echo "4. Verify at: https://sandlot-sluggers.vercel.app"
echo ""
echo -e "${GREEN}Setup complete!${NC}"
