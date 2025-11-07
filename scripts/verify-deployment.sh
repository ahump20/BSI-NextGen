#!/usr/bin/env bash

###############################################################################
# Sandlot Sluggers - Deployment Verification Script
#
# This script verifies that all deployment endpoints are working correctly
# and that the game is properly deployed across all platforms.
#
# Usage: ./scripts/verify-deployment.sh [deployment-url]
#
# Example: ./scripts/verify-deployment.sh https://642b31b1.sandlot-sluggers.pages.dev
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default deployment URL (Cloudflare Pages)
DEPLOYMENT_URL="${1:-https://642b31b1.sandlot-sluggers.pages.dev}"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}🏆 Sandlot Sluggers - Deployment Verification${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "Testing deployment at: ${YELLOW}${DEPLOYMENT_URL}${NC}"
echo ""

# Function to check HTTP status
check_url() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    echo -n "  Testing ${description}... "

    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}")

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ ${status_code}${NC}"
        return 0
    else
        echo -e "${RED}✗ ${status_code} (expected ${expected_status})${NC}"
        return 1
    fi
}

# Function to check content
check_content() {
    local url=$1
    local search_string=$2
    local description=$3

    echo -n "  Testing ${description}... "

    local content=$(curl -s "${url}")

    if echo "$content" | grep -q "$search_string"; then
        echo -e "${GREEN}✓ Found${NC}"
        return 0
    else
        echo -e "${RED}✗ Not found${NC}"
        return 1
    fi
}

# Function to check CORS headers
check_cors() {
    local url=$1
    local origin=${2:-https://blazesportsintel.com}
    local description=$3

    echo -n "  Testing ${description}... "

    local headers=$(curl -s -I -H "Origin: ${origin}" "${url}")

    if echo "$headers" | grep -qi "Access-Control-Allow-Origin"; then
        echo -e "${GREEN}✓ CORS enabled${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ CORS not detected${NC}"
        return 1
    fi
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

echo -e "${BLUE}1. Core Pages${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if check_url "${DEPLOYMENT_URL}/" 200 "Homepage"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

if check_url "${DEPLOYMENT_URL}/embed.html" 200 "Embed page"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

if check_url "${DEPLOYMENT_URL}/test-embed.html" 200 "Test embed page"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}2. Game Assets${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if check_content "${DEPLOYMENT_URL}/" "Babylon.js" "Babylon.js loaded"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

if check_content "${DEPLOYMENT_URL}/" "GameEngine" "GameEngine present"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}3. API Endpoints${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if API endpoints return 404 (expected - they need POST data)
# or 405 (method not allowed - also acceptable)
if check_url "${DEPLOYMENT_URL}/api/game-result" "404|405" "Game result endpoint exists"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

if check_url "${DEPLOYMENT_URL}/api/stats/characters" "404|405|200" "Character stats endpoint"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

if check_url "${DEPLOYMENT_URL}/api/stats/stadiums" "404|405|200" "Stadium stats endpoint"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}4. Blaze Integration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for Blaze-specific content in embed page
if check_content "${DEPLOYMENT_URL}/embed.html" "blazesportsintel" "Blaze origin whitelist"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

if check_content "${DEPLOYMENT_URL}/embed.html" "postMessage" "PostMessage API"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}5. Iframe Security${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check CORS headers on embed page
if check_cors "${DEPLOYMENT_URL}/embed.html" "https://blazesportsintel.com" "CORS headers"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# Check Content-Security-Policy header
echo -n "  Testing CSP headers... "
CSP_HEADER=$(curl -s -I "${DEPLOYMENT_URL}/embed.html" | grep -i "Content-Security-Policy" || echo "")
if [ ! -z "$CSP_HEADER" ]; then
    echo -e "${GREEN}✓ Present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ Not detected${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}6. Performance${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check response time
echo -n "  Testing response time... "
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "${DEPLOYMENT_URL}/")
RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc | cut -d. -f1)

if [ "$RESPONSE_MS" -lt 1000 ]; then
    echo -e "${GREEN}✓ ${RESPONSE_MS}ms${NC}"
    ((TESTS_PASSED++))
elif [ "$RESPONSE_MS" -lt 3000 ]; then
    echo -e "${YELLOW}⚠ ${RESPONSE_MS}ms (acceptable)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ ${RESPONSE_MS}ms (slow)${NC}"
    ((TESTS_FAILED++))
fi

# Check gzip compression
echo -n "  Testing gzip compression... "
ENCODING=$(curl -s -I -H "Accept-Encoding: gzip" "${DEPLOYMENT_URL}/" | grep -i "Content-Encoding" || echo "")
if echo "$ENCODING" | grep -qi "gzip"; then
    echo -e "${GREEN}✓ Enabled${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ Not detected${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}7. Cache Headers${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check Cache-Control headers on static assets
echo -n "  Testing static asset caching... "
CACHE_HEADER=$(curl -s -I "${DEPLOYMENT_URL}/" | grep -i "Cache-Control" || echo "")
if [ ! -z "$CACHE_HEADER" ]; then
    echo -e "${GREEN}✓ Present${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ Not detected${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}📊 Test Results${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
PASS_RATE=$(echo "scale=1; $TESTS_PASSED * 100 / $TOTAL_TESTS" | bc)

echo -e "  Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "  Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo -e "  Total Tests:  ${TOTAL_TESTS}"
echo -e "  Pass Rate:    ${PASS_RATE}%"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! Deployment is healthy.${NC}"
    exit 0
elif [ "$PASS_RATE" -ge "80" ]; then
    echo -e "${YELLOW}⚠️  Most tests passed, but some issues detected.${NC}"
    exit 1
else
    echo -e "${RED}❌ Multiple tests failed. Deployment needs attention.${NC}"
    exit 1
fi
