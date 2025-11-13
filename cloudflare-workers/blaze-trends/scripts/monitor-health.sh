#!/bin/bash

# Health Monitoring Script for Blaze Trends Worker
# Checks worker health and provides real-time monitoring

set -e

# Default worker URL (can be overridden)
WORKER_URL="${BLAZE_TRENDS_WORKER_URL:-http://localhost:8787}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Function to check if worker is running
check_worker_health() {
    print_header "Worker Health Check"
    print_info "Checking: $WORKER_URL/health"

    if response=$(curl -s -w "\n%{http_code}" "$WORKER_URL/health" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" -eq 200 ]; then
            print_success "Worker is healthy (HTTP $http_code)"
            echo "$body" | jq . 2>/dev/null || echo "$body"
        else
            print_error "Worker returned HTTP $http_code"
            echo "$body"
        fi
    else
        print_error "Failed to connect to worker"
        print_info "Make sure the worker is running: npm run dev"
        return 1
    fi
}

# Function to test trends API
test_trends_api() {
    print_header "Testing Trends API"
    print_info "Fetching trends: $WORKER_URL/api/trends?limit=5"

    if response=$(curl -s -w "\n%{http_code}" "$WORKER_URL/api/trends?limit=5" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" -eq 200 ]; then
            count=$(echo "$body" | jq '.trends | length' 2>/dev/null || echo "?")
            cached=$(echo "$body" | jq -r '.cached' 2>/dev/null || echo "?")

            print_success "Trends API working (HTTP $http_code)"
            echo -e "  Trends returned: ${GREEN}$count${NC}"
            echo -e "  Cached: ${BLUE}$cached${NC}"

            if [ "$count" != "0" ] && [ "$count" != "?" ]; then
                echo -e "\n${YELLOW}Sample Trend:${NC}"
                echo "$body" | jq '.trends[0] | {id, sport, title, viralScore}' 2>/dev/null || echo "Unable to parse"
            fi
        else
            print_error "Trends API returned HTTP $http_code"
            echo "$body" | jq . 2>/dev/null || echo "$body"
        fi
    else
        print_error "Failed to connect to trends API"
        return 1
    fi
}

# Function to test trends by sport
test_sport_filter() {
    local sport="${1:-college_baseball}"
    print_header "Testing Sport Filter: $sport"
    print_info "Fetching: $WORKER_URL/api/trends?sport=$sport&limit=3"

    if response=$(curl -s -w "\n%{http_code}" "$WORKER_URL/api/trends?sport=$sport&limit=3" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" -eq 200 ]; then
            count=$(echo "$body" | jq '.trends | length' 2>/dev/null || echo "?")
            print_success "Sport filter working (HTTP $http_code) - $count trends found"
        else
            print_error "Sport filter returned HTTP $http_code"
        fi
    else
        print_error "Failed to test sport filter"
        return 1
    fi
}

# Function to trigger monitoring manually
trigger_monitoring() {
    print_header "Triggering Manual Monitoring"
    print_warning "This will fetch news and run AI analysis"
    print_info "URL: $WORKER_URL/cron/monitor"

    if response=$(curl -s -w "\n%{http_code}" "$WORKER_URL/cron/monitor" 2>/dev/null); then
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$http_code" -eq 200 ]; then
            print_success "Monitoring triggered successfully (HTTP $http_code)"
            echo "$body" | jq . 2>/dev/null || echo "$body"
        else
            print_error "Monitoring failed (HTTP $http_code)"
            echo "$body" | jq . 2>/dev/null || echo "$body"
        fi
    else
        print_error "Failed to trigger monitoring"
        return 1
    fi
}

# Function to run continuous health checks
continuous_monitor() {
    local interval="${1:-60}"
    print_header "Continuous Health Monitoring"
    print_info "Checking every $interval seconds. Press Ctrl+C to stop."

    while true; do
        clear
        echo -e "${BLUE}Blaze Trends Health Monitor${NC}"
        echo -e "${BLUE}Time: $(date)${NC}"
        echo -e "${BLUE}Worker: $WORKER_URL${NC}\n"

        # Health check
        if response=$(curl -s -w "\n%{http_code}" "$WORKER_URL/health" 2>/dev/null); then
            http_code=$(echo "$response" | tail -n1)
            if [ "$http_code" -eq 200 ]; then
                echo -e "${GREEN}● Worker Status: HEALTHY${NC}"
            else
                echo -e "${RED}● Worker Status: UNHEALTHY (HTTP $http_code)${NC}"
            fi
        else
            echo -e "${RED}● Worker Status: UNREACHABLE${NC}"
        fi

        # Trends count
        if response=$(curl -s "$WORKER_URL/api/trends?limit=1" 2>/dev/null); then
            # Try to get total count from database (would need a new endpoint)
            echo -e "${BLUE}● API: Responding${NC}"
        else
            echo -e "${RED}● API: Not responding${NC}"
        fi

        echo -e "\n${YELLOW}Checking again in $interval seconds...${NC}"
        sleep "$interval"
    done
}

# Function to test all endpoints
test_all() {
    check_worker_health
    test_trends_api
    test_sport_filter "college_baseball"
    test_sport_filter "mlb"

    print_header "Summary"
    print_success "All basic tests completed"
    print_info "To run a full monitoring cycle, use: $0 trigger"
}

# Function to show help
show_help() {
    cat << EOF
${BLUE}Blaze Trends Health Monitor${NC}

Usage: ./monitor-health.sh [command] [options]

Commands:
  ${GREEN}health${NC}                Health check only
  ${GREEN}test${NC}                  Test trends API
  ${GREEN}sport${NC} [sport]         Test sport filter (default: college_baseball)
  ${GREEN}trigger${NC}               Manually trigger monitoring cycle
  ${GREEN}all${NC}                   Run all tests
  ${GREEN}watch${NC} [seconds]       Continuous monitoring (default: 60s)
  ${GREEN}help${NC}                  Show this help message

Environment Variables:
  BLAZE_TRENDS_WORKER_URL   Worker URL (default: http://localhost:8787)

Examples:
  ./monitor-health.sh health
  ./monitor-health.sh test
  ./monitor-health.sh sport mlb
  ./monitor-health.sh trigger
  ./monitor-health.sh watch 30
  BLAZE_TRENDS_WORKER_URL=https://blaze-trends.your.workers.dev ./monitor-health.sh all

Production Monitoring:
  export BLAZE_TRENDS_WORKER_URL=https://blaze-trends.your.workers.dev
  ./monitor-health.sh watch

EOF
}

# Main command handler
case "${1:-all}" in
    health)
        check_worker_health
        ;;
    test)
        test_trends_api
        ;;
    sport)
        test_sport_filter "${2:-college_baseball}"
        ;;
    trigger)
        trigger_monitoring
        ;;
    all)
        test_all
        ;;
    watch)
        continuous_monitor "${2:-60}"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
