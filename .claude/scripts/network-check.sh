#!/bin/bash

# =============================================================================
# BSI-NextGen Network API Check Script
# =============================================================================
# This script validates network access to required sports data APIs.
# Run this to verify that Claude Code web session has proper network access.
# =============================================================================

set -e

echo "🌐 BSI-NextGen Network API Check"
echo "================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local required=$3

    echo -n "Checking $name... "

    if curl -s -f -m 5 --head "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Available${NC}"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗ FAILED (REQUIRED)${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠ Failed (optional)${NC}"
            return 0
        fi
    fi
}

# Track overall status
FAILED=0

echo "Core Sports APIs:"
echo "-----------------"

# MLB Stats API (free, no auth required)
if ! check_endpoint "MLB Stats API" "https://statsapi.mlb.com/api/v1/sports" "required"; then
    FAILED=1
fi

# ESPN College Baseball API (free, no auth required)
if ! check_endpoint "ESPN CFB API" "https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard" "required"; then
    FAILED=1
fi

# ESPN NCAA Football API (free, no auth required)
if ! check_endpoint "ESPN NCAA Football API" "https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard" "required"; then
    FAILED=1
fi

echo ""
echo "Third-Party APIs (require API keys):"
echo "-------------------------------------"

# SportsDataIO (requires API key - just check domain)
if ! check_endpoint "SportsDataIO" "https://sportsdata.io" "optional"; then
    echo "   Note: SportsDataIO requires SPORTSDATAIO_API_KEY in .env"
fi

echo ""
echo "Authentication Services:"
echo "------------------------"

# Auth0 (if configured)
if [ -n "$AUTH0_DOMAIN" ]; then
    check_endpoint "Auth0" "https://$AUTH0_DOMAIN" "optional"
else
    echo "Auth0: Not configured (set AUTH0_DOMAIN in .env)"
fi

echo ""
echo "================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All required APIs are accessible${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure API keys are configured in .env"
    echo "  2. Run 'pnpm dev' to start development server"
    exit 0
else
    echo -e "${RED}❌ Some required APIs are not accessible${NC}"
    echo ""
    echo "This may indicate network restrictions in the Claude Code web environment."
    echo ""
    echo "Required domains for network allowlist:"
    echo "  - statsapi.mlb.com (MLB data)"
    echo "  - site.api.espn.com (NCAA/College sports)"
    echo "  - api.sportsdata.io (NFL/NBA data)"
    echo "  - sportsdata.io (SportsDataIO)"
    echo ""
    echo "Contact your administrator to update network access settings."
    exit 1
fi
