#!/bin/bash

###############################################################################
# Texas Longhorns Baseball Tracker - Deployment Script
# One-command deployment for production
###############################################################################

set -e  # Exit on error

# Colors for output
ORANGE='\033[38;5;208m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# Configuration
WORKER_NAME="longhorns-baseball-tracker"
DB_NAME="longhorns-baseball-db"

echo -e "${ORANGE}${BOLD}"
echo "============================================================"
echo "  🤘 Texas Longhorns Baseball Tracker - Deployment"
echo "============================================================"
echo -e "${RESET}"

# Check prerequisites
echo -e "${BLUE}[1/6] Checking prerequisites...${RESET}"

if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI not found${RESET}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✅ Wrangler found: $(wrangler --version)${RESET}"

# Check if logged in to Cloudflare
echo -e "${BLUE}[2/6] Verifying Cloudflare authentication...${RESET}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Cloudflare${RESET}"
    echo "Run: wrangler login"
    exit 1
fi
echo -e "${GREEN}✅ Authenticated with Cloudflare${RESET}"

# Create D1 database (if it doesn't exist)
echo -e "${BLUE}[3/6] Setting up D1 database...${RESET}"
if wrangler d1 create "$DB_NAME" 2>&1 | grep -q "already exists\|Success"; then
    echo -e "${GREEN}✅ Database ready: $DB_NAME${RESET}"
else
    echo -e "${ORANGE}⚠️  Database may need manual setup${RESET}"
fi

# Apply database schema
echo -e "${BLUE}[4/6] Applying database schema...${RESET}"
if wrangler d1 execute "$DB_NAME" --file=./schema.sql --remote; then
    echo -e "${GREEN}✅ Schema applied successfully${RESET}"
else
    echo -e "${ORANGE}⚠️  Schema may already be applied${RESET}"
fi

# Verify database tables
echo -e "${BLUE}[5/6] Verifying database setup...${RESET}"
TABLE_COUNT=$(wrangler d1 execute "$DB_NAME" \
    --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" \
    --remote 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Database verified: $TABLE_COUNT tables created${RESET}"
else
    echo -e "${RED}❌ Database verification failed${RESET}"
    exit 1
fi

# Deploy worker
echo -e "${BLUE}[6/6] Deploying Cloudflare Worker...${RESET}"
if wrangler deploy; then
    echo -e "${GREEN}✅ Worker deployed successfully${RESET}"
else
    echo -e "${RED}❌ Deployment failed${RESET}"
    exit 1
fi

# Get worker URL
WORKER_URL=$(wrangler deployments list 2>/dev/null | grep -oE 'https://[^[:space:]]+' | head -1 || echo "")

echo ""
echo -e "${ORANGE}${BOLD}============================================================"
echo "  ✨ Deployment Complete!"
echo -e "============================================================${RESET}"
echo ""
echo -e "${BOLD}Worker URL:${RESET} ${GREEN}${WORKER_URL}${RESET}"
echo ""
echo -e "${BOLD}Next Steps:${RESET}"
echo -e "  1. Visit the dashboard: ${GREEN}${WORKER_URL}${RESET}"
echo -e "  2. Trigger initial data load: ${BLUE}curl -X POST ${WORKER_URL}/api/update${RESET}"
echo -e "  3. View analytics: ${BLUE}${WORKER_URL}/api/analytics${RESET}"
echo ""
echo -e "${BOLD}CLI Commands:${RESET}"
echo -e "  ${BLUE}node cli.js update ${WORKER_URL}${RESET}       - Update stats"
echo -e "  ${BLUE}node cli.js analytics ${WORKER_URL}${RESET}    - View analytics"
echo -e "  ${BLUE}node cli.js logs${RESET}                       - Tail worker logs"
echo ""
echo -e "${BOLD}Scheduled Updates:${RESET}"
echo -e "  ${GREEN}Daily at 6:00 AM CT (12:00 UTC)${RESET}"
echo ""
echo -e "${ORANGE}🤘 Hook 'em Horns!${RESET}"
