#!/bin/bash
# Sandlot Sluggers - API Health Check Script
# Monitors all API endpoints and reports their status

set -euo pipefail

# Configuration
DEPLOY_URL="${DEPLOY_URL:-https://blaze-backyard-baseball.pages.dev}"
LOG_FILE="${LOG_FILE:-/tmp/sandlot-health.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
  local endpoint=$1
  local name=$2
  local timeout=${3:-10}

  local http_code
  local response_time

  # Measure response time and HTTP status code
  response_time=$(curl -s -o /dev/null -w "%{time_total}" -m "$timeout" "${DEPLOY_URL}${endpoint}" 2>/dev/null || echo "timeout")
  http_code=$(curl -s -o /dev/null -w "%{http_code}" -m "$timeout" "${DEPLOY_URL}${endpoint}" 2>/dev/null || echo "000")

  if [ "$http_code" -eq 200 ]; then
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
      echo -e "${GREEN}✅ PASS${NC}: $name (${http_code}, ${response_time}s)"
    else
      echo -e "${YELLOW}⚠️  SLOW${NC}: $name (${http_code}, ${response_time}s)"
    fi
  else
    echo -e "${RED}❌ FAIL${NC}: $name (${http_code})"
  fi
}

# Header
echo "========================================"
echo "🏥 Sandlot Sluggers Health Check"
echo "$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "Target: $DEPLOY_URL"
echo "========================================"
echo ""

# Test game page
echo "📱 Frontend:"
test_endpoint "/" "Game Page"
test_endpoint "/sandlot-sluggers.html" "Landing Page"
echo ""

# Test API endpoints
echo "🔌 API Endpoints:"
test_endpoint "/api/stats/global" "Global Stats"
test_endpoint "/api/stats/leaderboard/home_runs" "Leaderboard - Home Runs"
test_endpoint "/api/stats/leaderboard/wins" "Leaderboard - Wins"
test_endpoint "/api/stats/characters" "Character Stats (All)"
test_endpoint "/api/stats/characters?characterId=rocket_rivera" "Character Stats (Single)"
test_endpoint "/api/stats/stadiums" "Stadium Stats (All)"
test_endpoint "/api/stats/stadiums?stadiumId=dusty_acres" "Stadium Stats (Single)"
echo ""

# Test CORS headers
echo "🔒 CORS Configuration:"
CORS_HEADER=$(curl -s -I -H "Origin: https://blazesportsintel.com" "${DEPLOY_URL}/api/stats/global" | grep -i "access-control-allow-origin" || echo "MISSING")
if [[ $CORS_HEADER == *"*"* ]] || [[ $CORS_HEADER == *"blazesportsintel.com"* ]]; then
  echo -e "${GREEN}✅ PASS${NC}: CORS headers present"
else
  echo -e "${RED}❌ FAIL${NC}: CORS headers missing or incorrect"
fi
echo ""

# Test cache headers
echo "💾 Cache Performance:"
for i in {1..5}; do
  CACHE_STATUS=$(curl -s -I "${DEPLOY_URL}/api/stats/global" | grep -i "x-cache" | awk '{print $2}' | tr -d '\r\n' || echo "UNKNOWN")
  if [ "$CACHE_STATUS" == "HIT" ]; then
    ((CACHE_HITS++)) || CACHE_HITS=1
  fi
  sleep 0.2
done
CACHE_HITS=${CACHE_HITS:-0}
CACHE_RATE=$((CACHE_HITS * 100 / 5))

if [ "$CACHE_RATE" -ge 80 ]; then
  echo -e "${GREEN}✅ PASS${NC}: Cache hit rate ${CACHE_RATE}% (5 requests)"
elif [ "$CACHE_RATE" -ge 50 ]; then
  echo -e "${YELLOW}⚠️  WARN${NC}: Cache hit rate ${CACHE_RATE}% (5 requests)"
else
  echo -e "${RED}❌ FAIL${NC}: Cache hit rate ${CACHE_RATE}% (5 requests)"
fi
echo ""

# Test data freshness
echo "🕒 Data Freshness:"
GLOBAL_STATS=$(curl -s "${DEPLOY_URL}/api/stats/global")
LAST_UPDATED=$(echo "$GLOBAL_STATS" | jq -r '.lastUpdated' 2>/dev/null || echo "ERROR")

if [ "$LAST_UPDATED" != "ERROR" ] && [ "$LAST_UPDATED" != "null" ]; then
  TIMESTAMP=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${LAST_UPDATED%.*}" "+%s" 2>/dev/null || echo "0")
  NOW=$(date "+%s")
  AGE=$((NOW - TIMESTAMP))

  if [ "$AGE" -lt 300 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Data age ${AGE}s (< 5 minutes)"
  elif [ "$AGE" -lt 3600 ]; then
    echo -e "${YELLOW}⚠️  WARN${NC}: Data age ${AGE}s (< 1 hour)"
  else
    echo -e "${RED}❌ FAIL${NC}: Data age ${AGE}s (stale)"
  fi
else
  echo -e "${RED}❌ FAIL${NC}: Could not parse lastUpdated timestamp"
fi
echo ""

# Summary
echo "========================================"
echo "Health check completed at $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "========================================"

# Log to file
{
  echo "$(date '+%Y-%m-%d %H:%M:%S %Z') - Health check completed"
  echo "Cache hit rate: ${CACHE_RATE}%"
  echo "---"
} >> "$LOG_FILE"
