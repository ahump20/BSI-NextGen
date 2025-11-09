#!/usr/bin/env bash
#
# Automated Environment Variables Setup for Netlify
# Uses values from master environment configuration
#
# Usage: ./scripts/setup-env-vars-auto.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Automated Environment Variables Setup${NC}"
echo "=========================================="
echo ""

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo -e "${RED}❌ Netlify CLI not found${NC}"
    echo "Install with: npm install -g netlify-cli"
    exit 1
fi

# Check if authenticated
if ! netlify status &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Netlify${NC}"
    echo "Run: netlify login"
    exit 1
fi

echo -e "${GREEN}✅ Netlify CLI authenticated${NC}"
echo ""

# Function to set environment variable using netlify env:set
set_env_var() {
    local key="$1"
    local value="$2"
    local scope="${3:-all}"

    echo -n "  Setting $key... "

    # Use netlify env:set command
    if netlify env:set "$key" "$value" --scope "$scope" &> /dev/null; then
        echo -e "${GREEN}✅${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  (manual setup may be needed)${NC}"
        return 1
    fi
}

# Production Configuration
echo -e "${YELLOW}1. Production Domain Configuration${NC}"
echo "-----------------------------------"

SITE_URL="https://blazesportsintel.com"
API_URL="$SITE_URL/api"

set_env_var "NEXT_PUBLIC_SITE_URL" "$SITE_URL" "all"
set_env_var "NEXT_PUBLIC_API_URL" "$API_URL" "all"

echo ""

# Sports API Keys
echo -e "${YELLOW}2. Sports API Keys${NC}"
echo "-------------------"

# SportsDataIO API Key
SPORTSDATAIO_KEY="6ca2adb39404482da5406f0a6cd7aa37"
set_env_var "SPORTSDATAIO_API_KEY" "$SPORTSDATAIO_KEY" "all"

echo ""

# Auth0 Configuration
echo -e "${YELLOW}3. Auth0 Configuration${NC}"
echo "-----------------------"

AUTH0_ISSUER="https://ahump20.us.auth0.com"
SITE_URL_FOR_AUTH="https://blazesportsintel.com"

# Generate secure Auth0 secret
echo "  Generating secure Auth0 secret..."
AUTH0_SECRET=$(openssl rand -hex 32)

set_env_var "AUTH0_BASE_URL" "$SITE_URL_FOR_AUTH" "all"
set_env_var "AUTH0_ISSUER_BASE_URL" "$AUTH0_ISSUER" "all"
set_env_var "AUTH0_SECRET" "$AUTH0_SECRET" "all"

echo ""
echo -e "${YELLOW}⚠️  Auth0 Client ID and Secret require manual setup:${NC}"
echo "  1. Go to: https://manage.auth0.com/"
echo "  2. Navigate to Applications → Your App → Settings"
echo "  3. Copy Client ID and Client Secret"
echo "  4. Add them in Netlify Dashboard:"
echo "     https://app.netlify.com/sites/blazesportsintelligence/configuration/env"
echo ""
echo "  Required variables:"
echo "    • AUTH0_CLIENT_ID"
echo "    • AUTH0_CLIENT_SECRET"
echo ""

# Node Configuration
echo -e "${YELLOW}4. Node Environment${NC}"
echo "-------------------"

set_env_var "NODE_ENV" "production" "production"
set_env_var "NODE_VERSION" "18" "all"

echo ""

# Save reference configuration
echo -e "${YELLOW}5. Saving Reference Configuration${NC}"
echo "-----------------------------------"

cat > .env.production.reference <<EOF
# Production Environment Variables Reference
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# ⚠️  DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Site Configuration
NEXT_PUBLIC_SITE_URL=$SITE_URL
NEXT_PUBLIC_API_URL=$API_URL

# Sports API Keys
SPORTSDATAIO_API_KEY=$SPORTSDATAIO_KEY

# Auth0 Configuration
AUTH0_BASE_URL=$SITE_URL_FOR_AUTH
AUTH0_ISSUER_BASE_URL=$AUTH0_ISSUER
AUTH0_SECRET=$AUTH0_SECRET
# AUTH0_CLIENT_ID=<get-from-auth0-dashboard>
# AUTH0_CLIENT_SECRET=<get-from-auth0-dashboard>

# Node Configuration
NODE_ENV=production
NODE_VERSION=18

# ==========================================
# MANUAL SETUP REQUIRED FOR:
# ==========================================
# 1. AUTH0_CLIENT_ID
# 2. AUTH0_CLIENT_SECRET
#
# Get these from:
# https://manage.auth0.com/ → Applications → Your App → Settings
#
# Add them in Netlify Dashboard:
# https://app.netlify.com/sites/blazesportsintelligence/configuration/env
EOF

echo -e "${GREEN}✅ Reference configuration saved to .env.production.reference${NC}"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ Automated Setup Complete${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. Complete Auth0 setup manually:"
echo "   • Get Client ID and Client Secret from Auth0 dashboard"
echo "   • Add to Netlify: https://app.netlify.com/sites/blazesportsintelligence/configuration/env"
echo ""
echo "2. Update Auth0 Application Settings:"
echo "   • Allowed Callback URLs: $SITE_URL/api/auth/callback"
echo "   • Allowed Logout URLs: $SITE_URL"
echo "   • Allowed Web Origins: $SITE_URL"
echo ""
echo "3. Verify all variables are set:"
echo "   netlify env:list"
echo ""
echo "4. Trigger new deployment:"
echo "   netlify deploy --prod"
echo ""
echo "5. Test production site:"
echo "   curl -I $SITE_URL"
echo ""
echo -e "${GREEN}🎉 Environment variables configured!${NC}"
echo ""
