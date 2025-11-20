#!/usr/bin/env bash
set -euo pipefail

# Production Monitoring Script for BSI-NextGen
# This script checks production health and sends alerts if issues are detected

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-https://blazesportsintel.com}"
HEALTH_ENDPOINT="/api/health"
MMI_HEALTH_ENDPOINT="/api/sports/mlb/mmi/health"
ALERT_EMAIL="${ALERT_EMAIL:-}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S %Z')

echo "============================================"
echo "BSI-NextGen Production Health Check"
echo "Timestamp: $TIMESTAMP"
echo "Production URL: $PRODUCTION_URL"
echo "============================================"
echo ""

# Track overall status
OVERALL_STATUS="healthy"
ISSUES=()

# Function to check endpoint health
check_endpoint() {
  local endpoint=$1
  local name=$2
  local expected_status=${3:-200}

  echo -n "Checking $name... "

  local response
  local http_code

  # Make request with timeout
  response=$(curl -s -w "\n%{http_code}" --max-time 10 "$PRODUCTION_URL$endpoint" 2>&1)
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [[ "$http_code" == "$expected_status" ]]; then
    echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"

    # Parse and display status if JSON
    if command -v jq &> /dev/null && echo "$body" | jq empty 2>/dev/null; then
      status=$(echo "$body" | jq -r '.status // "unknown"' 2>/dev/null)
      echo "  Status: $status"
    fi

    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
    OVERALL_STATUS="degraded"
    ISSUES+=("$name returned HTTP $http_code (expected $expected_status)")

    # Show error details if available
    if command -v jq &> /dev/null && echo "$body" | jq empty 2>/dev/null; then
      error=$(echo "$body" | jq -r '.error // .message // "No error message"' 2>/dev/null)
      echo -e "  ${YELLOW}Error: $error${NC}"
    fi

    return 1
  fi
}

# Function to send alerts
send_alert() {
  local message=$1

  # Send email alert if configured
  if [[ -n "$ALERT_EMAIL" ]] && command -v mail &> /dev/null; then
    echo "$message" | mail -s "[BSI-NextGen] Production Alert" "$ALERT_EMAIL"
    echo "Email alert sent to $ALERT_EMAIL"
  fi

  # Send Slack alert if configured
  if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
    curl -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\"$message\"}" \
      "$SLACK_WEBHOOK_URL" 2>/dev/null
    echo "Slack alert sent"
  fi

  # Always log to console
  echo -e "\n${RED}ALERT: $message${NC}"
}

# Run health checks
echo "Running health checks..."
echo ""

# Check main health endpoint
check_endpoint "$HEALTH_ENDPOINT" "Main Health Check" "200"

# Check MMI health (should return 503 unavailable, which is expected)
check_endpoint "$MMI_HEALTH_ENDPOINT" "MMI Service Health" "503"

# Check homepage
check_endpoint "/" "Homepage" "200"

# Check a sports page
check_endpoint "/sports/mlb" "MLB Sports Page" "200"

echo ""
echo "============================================"

# Summary
if [[ "$OVERALL_STATUS" == "healthy" ]]; then
  echo -e "${GREEN}✓ All systems operational${NC}"
  exit 0
else
  echo -e "${RED}✗ System degraded - ${#ISSUES[@]} issue(s) detected${NC}"
  echo ""
  echo "Issues:"
  for issue in "${ISSUES[@]}"; do
    echo "  - $issue"
  done

  # Send alert
  ALERT_MESSAGE="BSI-NextGen Production Alert - $TIMESTAMP\n\nSystem Status: $OVERALL_STATUS\n\nIssues:\n$(printf '%s\n' "${ISSUES[@]}")"
  send_alert "$ALERT_MESSAGE"

  exit 1
fi
