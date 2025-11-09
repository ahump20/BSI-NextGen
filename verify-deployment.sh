#!/usr/bin/env bash
################################################################################
# Blaze Sports Intel - Deployment Verification Script
# Tests all endpoints and features after deployment
# Version: 1.0.0
# Date: 2025-11-09
################################################################################

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${1:-https://blazesportsintel.pages.dev}"
TIMEOUT=10

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Helper functions
test_endpoint() {
  local endpoint=$1
  local expected_status=${2:-200}
  local description=$3

  TESTS_TOTAL=$((TESTS_TOTAL + 1))

  printf "Testing: %-50s " "$description"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -m $TIMEOUT "$BASE_URL$endpoint" || echo "000")

  if [ "$HTTP_CODE" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} ($HTTP_CODE)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $HTTP_CODE)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

test_json_endpoint() {
  local endpoint=$1
  local description=$2

  TESTS_TOTAL=$((TESTS_TOTAL + 1))

  printf "Testing: %-50s " "$description"

  RESPONSE=$(curl -s -m $TIMEOUT "$BASE_URL$endpoint" || echo "{}")

  if echo "$RESPONSE" | python3 -m json.tool > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC} (Valid JSON)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (Invalid JSON)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

test_data_presence() {
  local endpoint=$1
  local field_path=$2
  local description=$3

  TESTS_TOTAL=$((TESTS_TOTAL + 1))

  printf "Testing: %-50s " "$description"

  RESPONSE=$(curl -s -m $TIMEOUT "$BASE_URL$endpoint" || echo "{}")

  if echo "$RESPONSE" | python3 -c "import json, sys; data=json.load(sys.stdin); exit(0 if '$field_path' in str(data) else 1)" 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} (Data present)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (Data missing)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Banner
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔥 Blaze Sports Intel - Deployment Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Test Suite 1: Core Pages
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 1: Core Pages"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "/" 200 "Homepage"
test_endpoint "/login" 200 "Login page"
test_endpoint "/profile" 200 "Profile page"
test_endpoint "/sports/college-baseball" 200 "College Baseball page"
test_endpoint "/sports/college-baseball/standings" 200 "College Baseball Standings"
test_endpoint "/sports/college-baseball/rankings" 200 "College Baseball Rankings"
test_endpoint "/sports/mlb" 200 "MLB page"

echo ""

# Test Suite 2: API Endpoints - MLB
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 2: API Endpoints - MLB"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_json_endpoint "/api/sports/mlb/teams" "MLB Teams API (JSON)"
test_json_endpoint "/api/sports/mlb/standings" "MLB Standings API (JSON)"
test_json_endpoint "/api/sports/mlb/games" "MLB Games API (JSON)"

test_data_presence "/api/sports/mlb/teams" "data" "MLB Teams (data field)"
test_data_presence "/api/sports/mlb/standings" "data" "MLB Standings (data field)"
test_data_presence "/api/sports/mlb/games" "source" "MLB Games (metadata)"

echo ""

# Test Suite 3: API Endpoints - College Baseball
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 3: API Endpoints - College Baseball"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_json_endpoint "/api/sports/college-baseball/games" "College Baseball Games (JSON)"
test_json_endpoint "/api/sports/college-baseball/standings" "College Baseball Standings (JSON)"
test_json_endpoint "/api/sports/college-baseball/rankings" "College Baseball Rankings (JSON)"

test_data_presence "/api/sports/college-baseball/games" "data" "College Baseball Games (data)"
test_data_presence "/api/sports/college-baseball/standings" "data" "College Baseball Standings (data)"

echo ""

# Test Suite 4: API Endpoints - NFL
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 4: API Endpoints - NFL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_json_endpoint "/api/sports/nfl/games" "NFL Games API (JSON)"

echo ""

# Test Suite 5: Auth Endpoints
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 5: Auth Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "/api/auth/me" 401 "Auth /me (401 unauthorized)"
test_endpoint "/api/auth/logout" 405 "Auth /logout (405 method not allowed for GET)"

echo ""

# Test Suite 6: 404 Handling
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test Suite 6: 404 Handling"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_endpoint "/nonexistent-page" 404 "404 for nonexistent page"

echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Total Tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo ""
  echo "Deployment at $BASE_URL is functioning correctly."
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  echo ""
  echo "Please review the failures above and fix before considering"
  echo "the deployment complete."
  exit 1
fi
