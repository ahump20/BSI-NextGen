#!/bin/bash
set -euo pipefail

# Sandlot Sluggers - Backend Deployment Script
# Version: 1.0.0
# Date: 2025-11-06

echo "=========================================="
echo "Sandlot Sluggers - Backend Deployment"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Verify environment
echo -e "\n${YELLOW}[1/6]${NC} Verifying Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
  echo -e "${RED}❌ Not logged in to Cloudflare${NC}"
  echo "Run: wrangler login"
  exit 1
fi
echo -e "${GREEN}✅ Authenticated${NC}"

# Step 2: Verify D1 database exists
echo -e "\n${YELLOW}[2/6]${NC} Verifying D1 database..."
if ! wrangler d1 info blaze-db &> /dev/null; then
  echo -e "${RED}❌ D1 database 'blaze-db' not found${NC}"
  echo "Create it with: wrangler d1 create blaze-db"
  exit 1
fi
echo -e "${GREEN}✅ D1 database exists${NC}"

# Step 3: Apply D1 schema
echo -e "\n${YELLOW}[3/6]${NC} Applying D1 schema..."
if ! wrangler d1 execute blaze-db --file=./schema.sql; then
  echo -e "${RED}❌ Schema deployment failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Schema applied${NC}"

# Verify tables exist
TABLES=$(wrangler d1 execute blaze-db --command="SELECT name FROM sqlite_master WHERE type='table';" --json 2>/dev/null | jq -r '.[0].results[] | .name')
if echo "$TABLES" | grep -q "player_progress"; then
  echo -e "${GREEN}✅ Table 'player_progress' verified${NC}"
else
  echo -e "${RED}❌ Table 'player_progress' not found${NC}"
  exit 1
fi

# Step 4: Build frontend
echo -e "\n${YELLOW}[4/6]${NC} Building frontend..."
if ! npm run build; then
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Step 5: Deploy to Cloudflare Pages
echo -e "\n${YELLOW}[5/6]${NC} Deploying to Cloudflare Pages..."
if ! npm run deploy; then
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Deployed to Pages${NC}"

# Step 6: Verify deployment health
echo -e "\n${YELLOW}[6/6]${NC} Verifying deployment..."
sleep 5

HEALTH_URL="https://5e1ebbdb.sandlot-sluggers.pages.dev/api/health"
if curl -sf "$HEALTH_URL" > /dev/null; then
  echo -e "${GREEN}✅ Health check passed${NC}"
else
  echo -e "${YELLOW}⚠️  Health check failed (API may still be deploying)${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=========================================="
echo "Production URL: https://5e1ebbdb.sandlot-sluggers.pages.dev"
echo "Health Check: $HEALTH_URL"
echo ""
echo "Next steps:"
echo "  1. Run integration tests: ./scripts/test-api.sh"
echo "  2. Monitor logs: wrangler pages deployment tail --project-name sandlot-sluggers"
echo "  3. Check analytics: https://dash.cloudflare.com"
echo ""
