#!/usr/bin/env bash
#
# Environment Variables Setup Script for Netlify
# Adds all required production environment variables to Netlify
#
# Usage: ./scripts/setup-env-vars.sh
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Site configuration
SITE_ID="4b34db3c-8b28-48f9-bbd7-c48891986ad8"
SITE_NAME="blazesportsintelligence"

echo "🔐 Environment Variables Setup for Blaze Sports Intel"
echo "====================================================="
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

# Function to set environment variable
set_env_var() {
    local key="$1"
    local value="$2"
    local scope="${3:-all}"

    echo -n "Setting $key... "

    if netlify env:set "$key" "$value" --scope "$scope" &> /dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        echo -e "${YELLOW}⚠️  Manual setup required for $key${NC}"
    fi
}

# Function to prompt for value
prompt_for_value() {
    local key="$1"
    local description="$2"
    local default="${3:-}"
    local value=""

    echo ""
    echo -e "${YELLOW}$description${NC}"
    echo -n "Enter value for $key"

    if [ -n "$default" ]; then
        echo -n " (default: $default)"
    fi

    echo -n ": "
    read -r value

    if [ -z "$value" ] && [ -n "$default" ]; then
        value="$default"
    fi

    echo "$value"
}

echo "📝 Environment Variables Configuration"
echo "======================================="
echo ""
echo "This script will help you set up environment variables for:"
echo "  • Production domain"
echo "  • API configuration"
echo "  • Auth0 authentication"
echo "  • Sports data API keys"
echo ""

# Production Domain Configuration
echo -e "${YELLOW}1. Production Domain Configuration${NC}"
echo "-----------------------------------"

SITE_URL=$(prompt_for_value "NEXT_PUBLIC_SITE_URL" \
    "Primary production URL" \
    "https://blazesportsintel.com")

API_URL=$(prompt_for_value "NEXT_PUBLIC_API_URL" \
    "API base URL" \
    "$SITE_URL/api")

set_env_var "NEXT_PUBLIC_SITE_URL" "$SITE_URL" "all"
set_env_var "NEXT_PUBLIC_API_URL" "$API_URL" "all"

# Sports API Keys
echo ""
echo -e "${YELLOW}2. Sports API Keys${NC}"
echo "-------------------"

SPORTSDATAIO_KEY=$(prompt_for_value "SPORTSDATAIO_API_KEY" \
    "SportsDataIO API Key (for NFL/NBA data)" \
    "6ca2adb39404482da5406f0a6cd7aa37")

set_env_var "SPORTSDATAIO_API_KEY" "$SPORTSDATAIO_KEY" "all"

# Optional: MLB Stats API
echo ""
echo -n "Do you have an MLB Stats API key? (y/N): "
read -r has_mlb_key

if [[ $has_mlb_key =~ ^[Yy]$ ]]; then
    MLB_KEY=$(prompt_for_value "MLB_STATS_API_KEY" \
        "MLB Stats API Key (optional)")

    if [ -n "$MLB_KEY" ]; then
        set_env_var "MLB_STATS_API_KEY" "$MLB_KEY" "all"
    fi
fi

# Auth0 Configuration
echo ""
echo -e "${YELLOW}3. Auth0 Configuration${NC}"
echo "-----------------------"

AUTH0_ISSUER=$(prompt_for_value "AUTH0_ISSUER_BASE_URL" \
    "Auth0 tenant URL" \
    "https://ahump20.us.auth0.com")

AUTH0_CLIENT_ID=$(prompt_for_value "AUTH0_CLIENT_ID" \
    "Auth0 Application Client ID" \
    "")

if [ -z "$AUTH0_CLIENT_ID" ]; then
    echo -e "${RED}❌ Auth0 Client ID is required${NC}"
    echo "Get this from: https://manage.auth0.com/ → Applications → Your App → Settings"
    exit 1
fi

AUTH0_CLIENT_SECRET=$(prompt_for_value "AUTH0_CLIENT_SECRET" \
    "Auth0 Application Client Secret" \
    "")

if [ -z "$AUTH0_CLIENT_SECRET" ]; then
    echo -e "${RED}❌ Auth0 Client Secret is required${NC}"
    echo "Get this from: https://manage.auth0.com/ → Applications → Your App → Settings"
    exit 1
fi

# Generate secure Auth0 secret
echo ""
echo "Generating secure Auth0 secret..."
AUTH0_SECRET=$(openssl rand -hex 32)

set_env_var "AUTH0_BASE_URL" "$SITE_URL" "all"
set_env_var "AUTH0_ISSUER_BASE_URL" "$AUTH0_ISSUER" "all"
set_env_var "AUTH0_CLIENT_ID" "$AUTH0_CLIENT_ID" "all"
set_env_var "AUTH0_CLIENT_SECRET" "$AUTH0_CLIENT_SECRET" "all"
set_env_var "AUTH0_SECRET" "$AUTH0_SECRET" "all"

# Node Environment
echo ""
echo -e "${YELLOW}4. Node Environment${NC}"
echo "-------------------"

set_env_var "NODE_ENV" "production" "production"
set_env_var "NODE_VERSION" "18" "all"

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Environment Variables Configured${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Verify variables in Netlify Dashboard:"
echo "   https://app.netlify.com/sites/$SITE_NAME/configuration/env"
echo ""
echo "2. Update Auth0 Application Settings:"
echo "   • Allowed Callback URLs: $SITE_URL/api/auth/callback"
echo "   • Allowed Logout URLs: $SITE_URL"
echo "   • Allowed Web Origins: $SITE_URL"
echo ""
echo "3. Trigger a new deployment:"
echo "   netlify deploy --prod"
echo ""
echo "4. Test the production site:"
echo "   curl -I $SITE_URL"
echo ""

# Save configuration to .env.production (for reference)
echo ""
echo -n "Save configuration to .env.production for reference? (Y/n): "
read -r save_env

if [[ ! $save_env =~ ^[Nn]$ ]]; then
    cat > .env.production <<EOF
# Production Environment Variables
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Site Configuration
NEXT_PUBLIC_SITE_URL=$SITE_URL
NEXT_PUBLIC_API_URL=$API_URL

# Sports API Keys
SPORTSDATAIO_API_KEY=$SPORTSDATAIO_KEY

# Auth0 Configuration
AUTH0_BASE_URL=$SITE_URL
AUTH0_ISSUER_BASE_URL=$AUTH0_ISSUER
AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID
AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET
AUTH0_SECRET=$AUTH0_SECRET

# Node Configuration
NODE_ENV=production
NODE_VERSION=18
EOF

    echo -e "${GREEN}✅ Configuration saved to .env.production${NC}"
    echo -e "${YELLOW}⚠️  Keep this file secure and never commit to git${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
