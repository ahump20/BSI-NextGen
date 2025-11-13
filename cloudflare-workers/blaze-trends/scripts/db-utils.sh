#!/bin/bash

# Database Utilities for Blaze Trends
# Provides helpful commands for managing D1 database

set -e

DB_NAME="blaze-trends-db"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}========================================${NC}"
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

# Function to execute a query
execute_query() {
    local query="$1"
    wrangler d1 execute "$DB_NAME" --command="$query"
}

# Function to list all trends
list_trends() {
    print_header "Recent Trends"
    execute_query "SELECT id, sport, title, viral_score, created_at FROM trends ORDER BY created_at DESC LIMIT 10"
}

# Function to count trends by sport
count_by_sport() {
    print_header "Trends by Sport"
    execute_query "SELECT sport, COUNT(*) as count FROM trends GROUP BY sport ORDER BY count DESC"
}

# Function to list articles
list_articles() {
    print_header "Recent Articles"
    execute_query "SELECT id, sport, title, source_name, published_at FROM news_articles ORDER BY created_at DESC LIMIT 10"
}

# Function to count articles by sport
articles_by_sport() {
    print_header "Articles by Sport"
    execute_query "SELECT sport, COUNT(*) as count, SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) as processed FROM news_articles GROUP BY sport"
}

# Function to show monitoring logs
show_logs() {
    local limit="${1:-20}"
    print_header "Recent Monitoring Logs ($limit)"
    execute_query "SELECT timestamp, event_type, sport, duration_ms, success FROM monitoring_logs ORDER BY timestamp DESC LIMIT $limit"
}

# Function to show error logs
show_errors() {
    print_header "Recent Errors"
    execute_query "SELECT timestamp, event_type, sport, details FROM monitoring_logs WHERE success = 0 ORDER BY timestamp DESC LIMIT 10"
}

# Function to get database statistics
db_stats() {
    print_header "Database Statistics"

    echo -e "\n${YELLOW}Trends:${NC}"
    execute_query "SELECT COUNT(*) as total_trends FROM trends"

    echo -e "\n${YELLOW}Articles:${NC}"
    execute_query "SELECT COUNT(*) as total_articles FROM news_articles"

    echo -e "\n${YELLOW}Monitoring Events:${NC}"
    execute_query "SELECT COUNT(*) as total_events FROM monitoring_logs"

    echo -e "\n${YELLOW}Success Rate:${NC}"
    execute_query "SELECT
        COUNT(*) as total_events,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        ROUND(100.0 * SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
        FROM monitoring_logs"
}

# Function to clean old data
clean_old_data() {
    local days="${1:-30}"
    print_header "Cleaning Data Older Than $days Days"

    print_warning "This will delete old articles and trends!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\n${YELLOW}Deleting old articles...${NC}"
        execute_query "DELETE FROM news_articles WHERE created_at < datetime('now', '-$days days')"
        print_success "Old articles deleted"

        echo -e "\n${YELLOW}Deleting old trends...${NC}"
        execute_query "DELETE FROM trends WHERE created_at < datetime('now', '-$days days')"
        print_success "Old trends deleted"

        echo -e "\n${YELLOW}Deleting old logs...${NC}"
        execute_query "DELETE FROM monitoring_logs WHERE timestamp < datetime('now', '-$days days')"
        print_success "Old logs deleted"
    else
        print_warning "Cancelled"
    fi
}

# Function to get top trends
top_trends() {
    local limit="${1:-10}"
    print_header "Top $limit Trending Stories"
    execute_query "SELECT sport, title, viral_score, created_at FROM trends ORDER BY viral_score DESC, created_at DESC LIMIT $limit"
}

# Function to search trends
search_trends() {
    local search_term="$1"
    if [ -z "$search_term" ]; then
        print_error "Please provide a search term"
        return 1
    fi

    print_header "Searching Trends for: $search_term"
    execute_query "SELECT id, sport, title, summary FROM trends WHERE title LIKE '%$search_term%' OR summary LIKE '%$search_term%' ORDER BY created_at DESC LIMIT 20"
}

# Function to export trends to JSON
export_trends() {
    local output_file="${1:-trends_export.json}"
    print_header "Exporting Trends"

    wrangler d1 execute "$DB_NAME" --json --command="SELECT * FROM trends ORDER BY created_at DESC" > "$output_file"
    print_success "Trends exported to: $output_file"
}

# Function to show help
show_help() {
    cat << EOF
${BLUE}Blaze Trends Database Utilities${NC}

Usage: ./db-utils.sh [command] [options]

Commands:
  ${GREEN}list${NC}              List recent trends
  ${GREEN}count${NC}             Count trends by sport
  ${GREEN}articles${NC}          List recent articles
  ${GREEN}articles-sport${NC}    Count articles by sport
  ${GREEN}logs${NC} [N]          Show recent monitoring logs (default: 20)
  ${GREEN}errors${NC}            Show recent errors
  ${GREEN}stats${NC}             Show database statistics
  ${GREEN}top${NC} [N]           Show top N trending stories (default: 10)
  ${GREEN}search${NC} <term>     Search trends by keyword
  ${GREEN}clean${NC} [days]      Clean data older than N days (default: 30)
  ${GREEN}export${NC} [file]     Export trends to JSON file
  ${GREEN}help${NC}              Show this help message

Examples:
  ./db-utils.sh list
  ./db-utils.sh logs 50
  ./db-utils.sh top 20
  ./db-utils.sh search "college baseball"
  ./db-utils.sh clean 60
  ./db-utils.sh export my_trends.json

EOF
}

# Main command handler
case "${1:-help}" in
    list)
        list_trends
        ;;
    count)
        count_by_sport
        ;;
    articles)
        list_articles
        ;;
    articles-sport)
        articles_by_sport
        ;;
    logs)
        show_logs "${2:-20}"
        ;;
    errors)
        show_errors
        ;;
    stats)
        db_stats
        ;;
    top)
        top_trends "${2:-10}"
        ;;
    search)
        search_trends "$2"
        ;;
    clean)
        clean_old_data "${2:-30}"
        ;;
    export)
        export_trends "${2:-trends_export.json}"
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
