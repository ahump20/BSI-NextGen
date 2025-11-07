#!/bin/bash
# Sandlot Sluggers - Automated API Test Suite
# Tests all API endpoints with comprehensive validation

set -euo pipefail

# Configuration
API_BASE_URL="${API_BASE_URL:-https://blaze-backyard-baseball.pages.dev/api}"
VERBOSE="${VERBOSE:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test helper functions
test_start() {
  ((TESTS_RUN++))
  if [ "$VERBOSE" = "true" ]; then
    echo -e "${BLUE}Testing${NC}: $1"
  fi
}

test_pass() {
  ((TESTS_PASSED++))
  echo -e "${GREEN}✅ PASS${NC}: $1"
}

test_fail() {
  ((TESTS_FAILED++))
  echo -e "${RED}❌ FAIL${NC}: $1"
  [ -n "${2:-}" ] && echo "   Error: $2"
}

# Check if jq is available
if ! command -v jq &> /dev/null; then
  echo "Error: jq is required for JSON parsing. Install with: brew install jq"
  exit 1
fi

# Header
echo "========================================"
echo "🧪 Sandlot Sluggers API Test Suite"
echo "$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "Target: $API_BASE_URL"
echo "========================================"
echo ""

# Test 1: Global Stats - Response Structure
echo "📊 Testing Global Stats API"
test_start "GET /stats/global returns 200"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/stats/global")
if [ "$HTTP_CODE" -eq 200 ]; then
  test_pass "Global stats endpoint accessible"
else
  test_fail "Global stats endpoint" "HTTP $HTTP_CODE"
fi

test_start "Global stats returns valid JSON"
GLOBAL_RESPONSE=$(curl -s "${API_BASE_URL}/stats/global")
if echo "$GLOBAL_RESPONSE" | jq -e '.' > /dev/null 2>&1; then
  test_pass "Global stats returns valid JSON"
else
  test_fail "Global stats JSON validation" "Invalid JSON response"
fi

test_start "Global stats contains required fields"
REQUIRED_FIELDS=("activePlayers" "gamesToday" "gamesTotal" "totalHomeRuns" "totalHits" "totalRuns" "lastUpdated" "timezone")
MISSING_FIELDS=()

for field in "${REQUIRED_FIELDS[@]}"; do
  if ! echo "$GLOBAL_RESPONSE" | jq -e ".$field" > /dev/null 2>&1; then
    MISSING_FIELDS+=("$field")
  fi
done

if [ ${#MISSING_FIELDS[@]} -eq 0 ]; then
  test_pass "Global stats has all required fields"
else
  test_fail "Global stats required fields" "Missing: ${MISSING_FIELDS[*]}"
fi

test_start "Global stats values are non-negative"
NEGATIVE_CHECK=$(echo "$GLOBAL_RESPONSE" | jq '[.activePlayers, .gamesToday, .gamesTotal, .totalHomeRuns, .totalHits, .totalRuns] | map(select(. < 0)) | length')
if [ "$NEGATIVE_CHECK" -eq 0 ]; then
  test_pass "Global stats values are non-negative"
else
  test_fail "Global stats value validation" "Found negative values"
fi

echo ""

# Test 2: Leaderboard API
echo "🏆 Testing Leaderboard API"
LEADERBOARD_STATS=("home_runs" "wins" "batting_avg" "total_hits" "total_runs" "games_played")

for stat in "${LEADERBOARD_STATS[@]}"; do
  test_start "GET /stats/leaderboard/$stat returns 200"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/stats/leaderboard/${stat}")
  if [ "$HTTP_CODE" -eq 200 ]; then
    test_pass "Leaderboard $stat endpoint accessible"
  else
    test_fail "Leaderboard $stat endpoint" "HTTP $HTTP_CODE"
  fi
done

test_start "Leaderboard pagination works (limit parameter)"
LEADERBOARD_RESPONSE=$(curl -s "${API_BASE_URL}/stats/leaderboard/home_runs?limit=5")
ENTRY_COUNT=$(echo "$LEADERBOARD_RESPONSE" | jq '.entries | length')
if [ "$ENTRY_COUNT" -le 5 ]; then
  test_pass "Leaderboard respects limit parameter"
else
  test_fail "Leaderboard pagination" "Returned $ENTRY_COUNT entries, expected ≤5"
fi

test_start "Leaderboard entries have required fields"
FIRST_ENTRY=$(echo "$LEADERBOARD_RESPONSE" | jq '.entries[0]')
if echo "$FIRST_ENTRY" | jq -e '.rank and .playerId and .value and .recordedAt' > /dev/null 2>&1; then
  test_pass "Leaderboard entries have required fields"
else
  test_fail "Leaderboard entry structure" "Missing required fields"
fi

echo ""

# Test 3: Character Stats API
echo "👤 Testing Character Stats API"
test_start "GET /stats/characters returns 200"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/stats/characters")
if [ "$HTTP_CODE" -eq 200 ]; then
  test_pass "Character stats endpoint accessible"
else
  test_fail "Character stats endpoint" "HTTP $HTTP_CODE"
fi

test_start "Character stats returns array of characters"
CHAR_RESPONSE=$(curl -s "${API_BASE_URL}/stats/characters")
if echo "$CHAR_RESPONSE" | jq -e '.characters | type == "array"' > /dev/null 2>&1; then
  test_pass "Character stats returns array"
else
  test_fail "Character stats structure" "Expected array of characters"
fi

test_start "Character stats returns 10 characters"
CHAR_COUNT=$(echo "$CHAR_RESPONSE" | jq '.characters | length')
if [ "$CHAR_COUNT" -eq 10 ]; then
  test_pass "Character stats returns all 10 characters"
else
  test_fail "Character count" "Expected 10 characters, got $CHAR_COUNT"
fi

test_start "GET /stats/characters?characterId=rocket_rivera returns single character"
SINGLE_CHAR=$(curl -s "${API_BASE_URL}/stats/characters?characterId=rocket_rivera")
if echo "$SINGLE_CHAR" | jq -e '.characterId == "rocket_rivera"' > /dev/null 2>&1; then
  test_pass "Single character query works"
else
  test_fail "Single character query" "Did not return rocket_rivera"
fi

test_start "Character stats include performance metrics"
FIRST_CHAR=$(echo "$CHAR_RESPONSE" | jq '.characters[0]')
if echo "$FIRST_CHAR" | jq -e '.gamesPlayed and .winRate and .usagePercent and .avgHomeRuns' > /dev/null 2>&1; then
  test_pass "Character stats include performance metrics"
else
  test_fail "Character performance metrics" "Missing metrics"
fi

echo ""

# Test 4: Stadium Stats API
echo "🏟️ Testing Stadium Stats API"
test_start "GET /stats/stadiums returns 200"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/stats/stadiums")
if [ "$HTTP_CODE" -eq 200 ]; then
  test_pass "Stadium stats endpoint accessible"
else
  test_fail "Stadium stats endpoint" "HTTP $HTTP_CODE"
fi

test_start "Stadium stats returns array of stadiums"
STADIUM_RESPONSE=$(curl -s "${API_BASE_URL}/stats/stadiums")
if echo "$STADIUM_RESPONSE" | jq -e '.stadiums | type == "array"' > /dev/null 2>&1; then
  test_pass "Stadium stats returns array"
else
  test_fail "Stadium stats structure" "Expected array of stadiums"
fi

test_start "Stadium stats returns 5 stadiums"
STADIUM_COUNT=$(echo "$STADIUM_RESPONSE" | jq '.stadiums | length')
if [ "$STADIUM_COUNT" -eq 5 ]; then
  test_pass "Stadium stats returns all 5 stadiums"
else
  test_fail "Stadium count" "Expected 5 stadiums, got $STADIUM_COUNT"
fi

test_start "GET /stats/stadiums?stadiumId=dusty_acres returns single stadium"
SINGLE_STADIUM=$(curl -s "${API_BASE_URL}/stats/stadiums?stadiumId=dusty_acres")
if echo "$SINGLE_STADIUM" | jq -e '.stadiumId == "dusty_acres"' > /dev/null 2>&1; then
  test_pass "Single stadium query works"
else
  test_fail "Single stadium query" "Did not return dusty_acres"
fi

test_start "Stadium stats include scoring metrics"
FIRST_STADIUM=$(echo "$STADIUM_RESPONSE" | jq '.stadiums[0]')
if echo "$FIRST_STADIUM" | jq -e '.avgHomeRuns and .avgTotalRuns and .homeRunRate' > /dev/null 2>&1; then
  test_pass "Stadium stats include scoring metrics"
else
  test_fail "Stadium scoring metrics" "Missing metrics"
fi

echo ""

# Test 5: CORS Headers
echo "🔒 Testing CORS Configuration"
test_start "CORS headers present for blazesportsintel.com"
CORS_HEADER=$(curl -s -I -H "Origin: https://blazesportsintel.com" "${API_BASE_URL}/stats/global" | grep -i "access-control-allow-origin" || echo "MISSING")
if [[ $CORS_HEADER == *"*"* ]] || [[ $CORS_HEADER == *"blazesportsintel.com"* ]]; then
  test_pass "CORS headers allow blazesportsintel.com"
else
  test_fail "CORS configuration" "Missing or incorrect CORS headers"
fi

test_start "CORS preflight (OPTIONS) works"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "${API_BASE_URL}/stats/global")
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 204 ]; then
  test_pass "CORS preflight handled correctly"
else
  test_fail "CORS preflight" "HTTP $HTTP_CODE"
fi

echo ""

# Test 6: Cache Performance
echo "💾 Testing Cache Performance"
test_start "Cache headers present"
CACHE_CONTROL=$(curl -s -I "${API_BASE_URL}/stats/global" | grep -i "cache-control" || echo "MISSING")
if [[ $CACHE_CONTROL != "MISSING" ]]; then
  test_pass "Cache-Control headers present"
else
  test_fail "Cache headers" "Missing Cache-Control header"
fi

test_start "X-Cache headers indicate caching"
CACHE_HITS=0
for i in {1..10}; do
  CACHE_STATUS=$(curl -s -I "${API_BASE_URL}/stats/global" | grep -i "x-cache" | awk '{print $2}' | tr -d '\r\n' || echo "UNKNOWN")
  if [ "$CACHE_STATUS" == "HIT" ]; then
    ((CACHE_HITS++))
  fi
  sleep 0.1
done

if [ "$CACHE_HITS" -ge 8 ]; then
  test_pass "Cache hit rate: $CACHE_HITS/10 (≥80%)"
elif [ "$CACHE_HITS" -ge 5 ]; then
  test_pass "Cache hit rate: $CACHE_HITS/10 (≥50%)"
else
  test_fail "Cache performance" "Low hit rate: $CACHE_HITS/10"
fi

echo ""

# Test 7: Error Handling
echo "⚠️ Testing Error Handling"
test_start "Invalid character ID returns 404"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/stats/characters?characterId=invalid_character")
if [ "$HTTP_CODE" -eq 404 ]; then
  test_pass "Invalid character returns 404"
else
  test_fail "Character error handling" "Expected 404, got HTTP $HTTP_CODE"
fi

test_start "Invalid stadium ID returns 404"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/stats/stadiums?stadiumId=invalid_stadium")
if [ "$HTTP_CODE" -eq 404 ]; then
  test_pass "Invalid stadium returns 404"
else
  test_fail "Stadium error handling" "Expected 404, got HTTP $HTTP_CODE"
fi

test_start "Invalid leaderboard stat returns 400"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/stats/leaderboard/invalid_stat")
if [ "$HTTP_CODE" -eq 400 ]; then
  test_pass "Invalid leaderboard stat returns 400"
else
  test_fail "Leaderboard error handling" "Expected 400, got HTTP $HTTP_CODE"
fi

echo ""

# Summary
echo "========================================"
echo "📈 Test Summary"
echo "========================================"
echo -e "Total Tests:  ${TESTS_RUN}"
echo -e "Passed:       ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed:       ${RED}${TESTS_FAILED}${NC}"
echo -e "Success Rate: $((TESTS_PASSED * 100 / TESTS_RUN))%"
echo "========================================"
echo ""

# Exit with appropriate code
if [ "$TESTS_FAILED" -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed${NC}"
  exit 1
fi
