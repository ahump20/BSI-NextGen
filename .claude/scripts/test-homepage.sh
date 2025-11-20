#!/bin/bash

#############################################################################
# Homepage V2 Testing Script
#
# Comprehensive testing for the enhanced homepage before deployment
#
# Usage:
#   bash .claude/scripts/test-homepage.sh
#
#############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_ROOT="/home/user/BSI-NextGen"
BASE_URL="http://localhost:3000"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Homepage V2 - Comprehensive Testing${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if dev server is running
echo -e "${BLUE}🔍 Checking development server...${NC}"
if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Dev server not running${NC}"
  echo -e "${YELLOW}   Please start it with: pnpm dev${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Dev server is running"
echo ""

# Test API endpoints
echo -e "${BLUE}🧪 Testing API Endpoints${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

# Test alerts API
echo -n "Testing /api/homepage/alerts... "
if curl -s "$BASE_URL/api/homepage/alerts" | grep -q "alerts"; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

# Test user stats API
echo -n "Testing /api/homepage/user-stats... "
if curl -s "$BASE_URL/api/homepage/user-stats" | grep -q "stats"; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

# Test weekly alpha API
echo -n "Testing /api/homepage/weekly-alpha... "
if curl -s "$BASE_URL/api/homepage/weekly-alpha" | grep -q "alpha"; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# Test pages
echo -e "${BLUE}📄 Testing Pages${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

# Test home-v2 page
echo -n "Testing /home-v2... "
if curl -s "$BASE_URL/home-v2" | grep -q "FIND THE"; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

# Test current homepage
echo -n "Testing / (current homepage)... "
if curl -s "$BASE_URL/" | grep -q "Blaze"; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# Performance check
echo -e "${BLUE}⚡ Performance Checks${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

echo -n "API response time (alerts)... "
START=$(date +%s%N)
curl -s "$BASE_URL/api/homepage/alerts" > /dev/null
END=$(date +%s%N)
DURATION=$((($END - $START) / 1000000))

if [ $DURATION -lt 1000 ]; then
  echo -e "${GREEN}✓ ${DURATION}ms (GOOD)${NC}"
elif [ $DURATION -lt 2000 ]; then
  echo -e "${YELLOW}⚠ ${DURATION}ms (OK)${NC}"
else
  echo -e "${RED}✗ ${DURATION}ms (SLOW)${NC}"
fi

echo ""

# Build test
echo -e "${BLUE}🔨 Build Test${NC}"
echo -e "${BLUE}─────────────────────────────────────────────────────────${NC}"

cd "$PROJECT_ROOT"
echo -n "Building shared package... "
if pnpm --filter @bsi/shared build > /dev/null 2>&1; then
  echo -e "${GREEN}✓ PASS${NC}"
else
  echo -e "${RED}✗ FAIL${NC}"
fi

echo ""

# Summary
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Testing Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. Review test results above"
echo -e "2. Fix any failing tests"
echo -e "3. Run deployment script: ${YELLOW}bash .claude/scripts/deploy-homepage.sh${NC}"
echo ""
