#!/bin/bash
#
# Cache Staleness Monitor
# Checks if Cloudflare cache age exceeds threshold and sends alerts
#
# Usage:
#   ./scripts/check-cache-staleness.sh [--domain URL] [--max-age SECONDS] [--alert]
#
# Environment Variables:
#   SLACK_WEBHOOK_URL - Slack webhook for alerts (optional)
#   PAGERDUTY_INTEGRATION_KEY - PagerDuty integration key (optional)
#   MAX_CACHE_AGE - Maximum acceptable cache age in seconds (default: 600)
#
# Exit codes:
#   0 - Cache is fresh
#   1 - Cache is stale
#   2 - Error checking cache
#

set -euo pipefail

# Configuration
DOMAIN="${DOMAIN:-https://blazesportsintel.com}"
MAX_AGE="${MAX_CACHE_AGE:-90}"  # 90 seconds default (cache header is 60s, allow 30s buffer)
SEND_ALERT="${SEND_ALERT:-false}"
TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --domain)
      DOMAIN="$2"
      shift 2
      ;;
    --max-age)
      MAX_AGE="$2"
      shift 2
      ;;
    --alert)
      SEND_ALERT="true"
      shift
      ;;
    --help)
      echo "Usage: $0 [--domain URL] [--max-age SECONDS] [--alert] [--help]"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# Function to send Slack alert
send_slack_alert() {
  local message="$1"
  local severity="${2:-warning}"

  if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
    echo "ℹ️  Slack webhook not configured (set SLACK_WEBHOOK_URL)"
    return 0
  fi

  local emoji="⚠️"
  local color="#ffaa00"

  if [[ "$severity" == "critical" ]]; then
    emoji="🚨"
    color="#ff0000"
  elif [[ "$severity" == "info" ]]; then
    emoji="ℹ️"
    color="#0099ff"
  fi

  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"${emoji} ${message}\",
      \"attachments\": [{
        \"color\": \"${color}\",
        \"fields\": [
          {\"title\": \"Domain\", \"value\": \"${DOMAIN}\", \"short\": true},
          {\"title\": \"Timestamp\", \"value\": \"$(date -u '+%Y-%m-%d %H:%M:%S UTC')\", \"short\": true}
        ]
      }]
    }" \
    -s -o /dev/null || echo "⚠️  Failed to send Slack alert"
}

# Function to send PagerDuty alert
send_pagerduty_alert() {
  local message="$1"
  local severity="${2:-warning}"

  if [[ -z "${PAGERDUTY_INTEGRATION_KEY:-}" ]]; then
    echo "ℹ️  PagerDuty not configured (set PAGERDUTY_INTEGRATION_KEY)"
    return 0
  fi

  curl -X POST "https://events.pagerduty.com/v2/enqueue" \
    -H 'Content-Type: application/json' \
    -d "{
      \"routing_key\": \"${PAGERDUTY_INTEGRATION_KEY}\",
      \"event_action\": \"trigger\",
      \"payload\": {
        \"summary\": \"${message}\",
        \"severity\": \"${severity}\",
        \"source\": \"blazesportsintel-cache-monitor\",
        \"custom_details\": {
          \"domain\": \"${DOMAIN}\",
          \"timestamp\": \"$(date -u '+%Y-%m-%d %H:%M:%S UTC')\"
        }
      }
    }" \
    -s -o /dev/null || echo "⚠️  Failed to send PagerDuty alert"
}

# Main check
echo "🔍 Checking cache staleness for $DOMAIN..."

# Fetch headers
if ! HEADERS=$(curl -sI --max-time "$TIMEOUT" "$DOMAIN/"); then
  echo -e "${RED}❌ Failed to fetch headers from $DOMAIN${NC}"
  if [[ "$SEND_ALERT" == "true" ]]; then
    send_slack_alert "Failed to fetch headers from $DOMAIN" "critical"
    send_pagerduty_alert "Failed to fetch headers from $DOMAIN" "error"
  fi
  exit 2
fi

# Extract cache information
CACHE_STATUS=$(echo "$HEADERS" | grep -i "^cf-cache-status:" | awk '{print $2}' | tr -d '\r\n' || echo "N/A")
CACHE_AGE=$(echo "$HEADERS" | grep -i "^age:" | awk '{print $2}' | tr -d '\r\n' || echo "0")
CACHE_CONTROL=$(echo "$HEADERS" | grep -i "^cache-control:" | cut -d: -f2- | tr -d '\r\n' || echo "N/A")
HTTP_CODE=$(echo "$HEADERS" | head -n1 | awk '{print $2}')

echo "HTTP Status: $HTTP_CODE"
echo "Cache Status: $CACHE_STATUS"
echo "Cache Age: ${CACHE_AGE}s"
echo "Cache-Control: $CACHE_CONTROL"

# Check if cache age is within acceptable range
if [[ "$CACHE_AGE" -gt "$MAX_AGE" ]]; then
  echo -e "${RED}❌ Cache is stale!${NC}"
  echo "   Cache age: ${CACHE_AGE}s"
  echo "   Threshold: ${MAX_AGE}s"
  echo "   Exceeded by: $((CACHE_AGE - MAX_AGE))s"

  if [[ "$SEND_ALERT" == "true" ]]; then
    MESSAGE="Cache staleness alert: Age ${CACHE_AGE}s exceeds threshold ${MAX_AGE}s (cache status: $CACHE_STATUS)"

    # Determine severity
    SEVERITY="warning"
    if [[ "$CACHE_AGE" -gt $((MAX_AGE * 3)) ]]; then
      SEVERITY="critical"
    fi

    send_slack_alert "$MESSAGE" "$SEVERITY"
    send_pagerduty_alert "$MESSAGE" "$SEVERITY"
  fi

  echo ""
  echo "Recommended action:"
  echo "  Run manual cache purge:"
  echo "  curl -X POST 'https://api.cloudflare.com/client/v4/zones/\${ZONE_ID}/purge_cache' \\"
  echo "    -H 'Authorization: Bearer \${API_TOKEN}' \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    --data '{\"purge_everything\":true}'"
  echo ""
  echo "Or follow runbook: docs/runbooks/CACHE-INVALIDATION-RUNBOOK.md"

  exit 1
else
  echo -e "${GREEN}✅ Cache is fresh${NC}"
  echo "   Cache age: ${CACHE_AGE}s (< ${MAX_AGE}s threshold)"

  # Send info alert if cache was recently cleared
  if [[ "$CACHE_AGE" -lt 60 ]] && [[ "$SEND_ALERT" == "true" ]] && [[ "$CACHE_STATUS" == "MISS" ]]; then
    send_slack_alert "Cache recently cleared (age: ${CACHE_AGE}s, status: $CACHE_STATUS)" "info"
  fi

  exit 0
fi
