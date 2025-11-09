#!/usr/bin/env bash
# Uptime monitoring script - run via cron every 5 minutes
# */5 * * * * /path/to/monitor-uptime.sh

SITE_URL="https://blazesportsintel.com"
LOG_FILE="/var/log/blaze-uptime.log"
ALERT_EMAIL="ahump20@outlook.com"

check_endpoint() {
    local url="$1"
    local name="$2"

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$response" != "200" ]; then
        echo "[$(date)] ALERT: $name returned HTTP $response" >> "$LOG_FILE"
        # Send alert email
        echo "$name is down (HTTP $response)" | mail -s "⚠️ Blaze Sports Intel Alert" "$ALERT_EMAIL"
        return 1
    fi

    return 0
}

# Check main endpoints
check_endpoint "$SITE_URL" "Homepage"
check_endpoint "$SITE_URL/api/sports/mlb/teams" "MLB API"
check_endpoint "$SITE_URL/api/sports/college-baseball/games" "College Baseball API"
