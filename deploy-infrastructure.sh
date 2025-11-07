#!/bin/bash
# Automated Cloudflare Infrastructure Setup & Deployment
# Requires: CLOUDFLARE_API_TOKEN with Edit permissions

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "========================================"
echo "🚀 Sandlot Sluggers - Automated Deployment"
echo "========================================"
echo ""

# Check if API token is set
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo -e "${RED}❌ ERROR: CLOUDFLARE_API_TOKEN not set${NC}"
  echo ""
  echo "Please set your API token with Edit permissions:"
  echo "  export CLOUDFLARE_API_TOKEN=\"your-token-here\""
  echo ""
  echo "See API_TOKEN_ISSUE.md for instructions on generating a token."
  exit 1
fi

# Verify authentication
echo -e "${BLUE}🔐 Step 1: Verifying authentication...${NC}"
if ! npx wrangler whoami > /dev/null 2>&1; then
  echo -e "${RED}❌ Authentication failed${NC}"
  echo "Please verify your CLOUDFLARE_API_TOKEN has correct permissions."
  exit 1
fi
echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

# Create D1 Database
echo -e "${BLUE}🗄️  Step 2: Creating D1 database...${NC}"
D1_OUTPUT=$(npx wrangler d1 create blaze-baseball-db 2>&1 || true)
if echo "$D1_OUTPUT" | grep -q "Successfully created"; then
  DATABASE_ID=$(echo "$D1_OUTPUT" | grep "database_id" | awk -F'"' '{print $2}')
  echo -e "${GREEN}✅ D1 database created: $DATABASE_ID${NC}"
elif echo "$D1_OUTPUT" | grep -q "already exists"; then
  echo -e "${YELLOW}⚠️  Database already exists, fetching ID...${NC}"
  DATABASE_ID=$(npx wrangler d1 list --json | jq -r '.[] | select(.name=="blaze-baseball-db") | .uuid')
  echo -e "${GREEN}✅ Using existing database: $DATABASE_ID${NC}"
else
  echo -e "${RED}❌ Failed to create D1 database${NC}"
  echo "$D1_OUTPUT"
  exit 1
fi
echo ""

# Create KV Namespace
echo -e "${BLUE}💾 Step 3: Creating KV namespace...${NC}"
KV_OUTPUT=$(npx wrangler kv:namespace create "KV" 2>&1 || true)
if echo "$KV_OUTPUT" | grep -q "id ="; then
  KV_ID=$(echo "$KV_OUTPUT" | grep "id =" | awk -F'"' '{print $2}')
  echo -e "${GREEN}✅ KV namespace created: $KV_ID${NC}"
elif echo "$KV_OUTPUT" | grep -q "already exists"; then
  echo -e "${YELLOW}⚠️  KV namespace already exists, fetching ID...${NC}"
  KV_ID=$(npx wrangler kv:namespace list --json | jq -r '.[] | select(.title | contains("KV")) | .id' | head -1)
  echo -e "${GREEN}✅ Using existing KV namespace: $KV_ID${NC}"
else
  echo -e "${RED}❌ Failed to create KV namespace${NC}"
  echo "$KV_OUTPUT"
  exit 1
fi
echo ""

# Create R2 Bucket
echo -e "${BLUE}📦 Step 4: Creating R2 bucket...${NC}"
R2_OUTPUT=$(npx wrangler r2 bucket create blaze-baseball-assets 2>&1 || true)
if echo "$R2_OUTPUT" | grep -q "Created bucket"; then
  echo -e "${GREEN}✅ R2 bucket created: blaze-baseball-assets${NC}"
elif echo "$R2_OUTPUT" | grep -q "already exists"; then
  echo -e "${YELLOW}⚠️  R2 bucket already exists${NC}"
  echo -e "${GREEN}✅ Using existing bucket: blaze-baseball-assets${NC}"
else
  echo -e "${RED}❌ Failed to create R2 bucket${NC}"
  echo "$R2_OUTPUT"
  exit 1
fi
echo ""

# Update wrangler.toml
echo -e "${BLUE}📝 Step 5: Updating wrangler.toml...${NC}"
sed -i.backup "s/database_id = \"TBD\"/database_id = \"$DATABASE_ID\"/" wrangler.toml
sed -i.backup "s/id = \"TBD\"/id = \"$KV_ID\"/" wrangler.toml
echo -e "${GREEN}✅ wrangler.toml updated${NC}"
echo "   Database ID: $DATABASE_ID"
echo "   KV ID: $KV_ID"
echo ""

# Initialize database schema
echo -e "${BLUE}🔨 Step 6: Initializing database schema...${NC}"
if npx wrangler d1 execute blaze-baseball-db --file=./schema.sql > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database schema initialized${NC}"
else
  echo -e "${YELLOW}⚠️  Schema initialization may have failed (could be already initialized)${NC}"
fi
echo ""

# Deploy to Cloudflare Pages
echo -e "${BLUE}🚀 Step 7: Deploying to Cloudflare Pages...${NC}"
if npm run deploy; then
  echo ""
  echo -e "${GREEN}✅ Deployment successful!${NC}"
else
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi
echo ""

# Extract deployment URL
DEPLOY_URL=$(npx wrangler pages deployment list --project-name blaze-backyard-baseball --json 2>/dev/null | jq -r '.[0].url // empty' || echo "")
if [ -z "$DEPLOY_URL" ]; then
  DEPLOY_URL="https://blaze-backyard-baseball.pages.dev"
fi

echo "========================================"
echo "🎉 Deployment Complete!"
echo "========================================"
echo ""
echo -e "${GREEN}✅ Infrastructure created:${NC}"
echo "   • D1 Database: $DATABASE_ID"
echo "   • KV Namespace: $KV_ID"
echo "   • R2 Bucket: blaze-baseball-assets"
echo ""
echo -e "${GREEN}✅ Deployment URL:${NC}"
echo "   $DEPLOY_URL"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "   1. Set deployment URL for testing:"
echo "      export DEPLOY_URL=\"$DEPLOY_URL\""
echo ""
echo "   2. Run health check:"
echo "      ./scripts/health-check.sh"
echo ""
echo "   3. Run full test suite:"
echo "      ./scripts/test-api.sh"
echo ""
echo "========================================"
