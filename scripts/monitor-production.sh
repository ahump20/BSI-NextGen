#!/bin/bash
# Real-time Production Monitoring for Sandlot Sluggers
# Monitors site health, performance, and uptime

PRODUCTION_URL="https://5e1ebbdb.sandlot-sluggers.pages.dev"
LOG_FILE="./logs/production-monitor.log"
ALERT_THRESHOLD_MS=2000

# Create logs directory if it doesn't exist
mkdir -p ./logs

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🎮 Sandlot Sluggers - Real-Time Production Monitor"
echo "=================================================="
echo ""
echo "Monitoring: $PRODUCTION_URL"
echo "Press Ctrl+C to stop"
echo ""
echo "Timestamp              Status  Response Time  HTTP   Location"
echo "---------------------  ------  -------------  -----  --------"

check_health() {
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

    # Get response time and HTTP status
    RESPONSE=$(curl -o /dev/null -s -w "%{http_code}|%{time_total}|%{header_json}" "$PRODUCTION_URL" 2>/dev/null)
    HTTP_CODE=$(echo "$RESPONSE" | cut -d'|' -f1)
    RESPONSE_TIME=$(echo "$RESPONSE" | cut -d'|' -f2)
    RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "0")

    # Get CF datacenter
    CF_RAY=$(curl -I -s "$PRODUCTION_URL" 2>/dev/null | grep -i "cf-ray:" | cut -d: -f2 | xargs)
    CF_LOC=$(echo "$CF_RAY" | cut -d- -f2)

    # Determine status
    if [ "$HTTP_CODE" = "200" ]; then
        if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l 2>/dev/null || echo "0") )); then
            STATUS="${GREEN}✓ UP${NC}"
            STATUS_TEXT="UP"
        else
            STATUS="${YELLOW}⚠ SLOW${NC}"
            STATUS_TEXT="SLOW"
        fi
    else
        STATUS="${RED}✗ DOWN${NC}"
        STATUS_TEXT="DOWN"
    fi

    # Format response time
    RT_FORMATTED=$(printf "%.0f" "$RESPONSE_MS")ms

    # Print status line
    printf "$TIMESTAMP  %-15s %-13s  %-5s  %s\n" "$STATUS" "$RT_FORMATTED" "$HTTP_CODE" "$CF_LOC"

    # Log to file
    echo "$TIMESTAMP,$STATUS_TEXT,$HTTP_CODE,$RESPONSE_MS,$CF_LOC" >> "$LOG_FILE"

    # Alert if slow
    if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${YELLOW}⚠ ALERT: Response time exceeded ${ALERT_THRESHOLD_MS}ms threshold${NC}" >&2
    fi

    # Alert if down
    if [ "$HTTP_CODE" != "200" ]; then
        echo -e "${RED}🚨 ALERT: Site returned HTTP $HTTP_CODE${NC}" >&2
    fi
}

# Monitor continuously
while true; do
    check_health
    sleep 30  # Check every 30 seconds
done
