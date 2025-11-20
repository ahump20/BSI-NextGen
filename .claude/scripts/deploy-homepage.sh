#!/bin/bash

#############################################################################
# Homepage V2 Deployment Script
#
# This script replaces the current homepage with the enhanced V2 homepage
#
# Usage:
#   bash .claude/scripts/deploy-homepage.sh
#
# What it does:
#   1. Creates backup of current homepage
#   2. Copies V2 homepage to main location
#   3. Verifies the deployment
#   4. Provides rollback instructions
#
#############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
PROJECT_ROOT="/home/user/BSI-NextGen"
WEB_APP="$PROJECT_ROOT/packages/web/app"
HOME_V2="$WEB_APP/home-v2"
BACKUP_DIR="$WEB_APP/.backup-$(date +%Y%m%d-%H%M%S)"

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Blaze Sports Intel - Homepage V2 Deployment${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
echo ""

# Check if home-v2 exists
if [ ! -d "$HOME_V2" ]; then
  echo -e "${RED}❌ Error: home-v2 directory not found!${NC}"
  echo -e "${YELLOW}Expected location: $HOME_V2${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Found home-v2 directory"

# Check if current page.tsx exists
if [ ! -f "$WEB_APP/page.tsx" ]; then
  echo -e "${YELLOW}⚠️  Warning: Current page.tsx not found${NC}"
  echo -e "${YELLOW}   Creating new homepage directly...${NC}"
else
  # Create backup
  echo -e "${BLUE}📦 Creating backup...${NC}"
  mkdir -p "$BACKUP_DIR"
  cp "$WEB_APP/page.tsx" "$BACKUP_DIR/page.tsx"
  echo -e "${GREEN}✓${NC} Backup created: $BACKUP_DIR/page.tsx"
fi

# Copy V2 homepage to main location
echo -e "${BLUE}🚀 Deploying V2 homepage...${NC}"
cp "$HOME_V2/page.tsx" "$WEB_APP/page.tsx"
echo -e "${GREEN}✓${NC} Homepage V2 deployed successfully!"

# Verify the deployment
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
if grep -q "HomePageV2" "$WEB_APP/page.tsx"; then
  echo -e "${GREEN}✓${NC} Verification passed: V2 homepage is active"
else
  echo -e "${YELLOW}⚠️  Warning: Could not verify V2 content${NC}"
fi

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Deployment Complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo -e "1. ${YELLOW}Test locally:${NC}"
echo -e "   ${BLUE}pnpm dev${NC}"
echo -e "   ${BLUE}open http://localhost:3000${NC}"
echo ""
echo -e "2. ${YELLOW}Commit changes:${NC}"
echo -e "   ${BLUE}git add packages/web/app/page.tsx${NC}"
echo -e "   ${BLUE}git commit -m \"feat: Deploy enhanced homepage v2\"${NC}"
echo -e "   ${BLUE}git push${NC}"
echo ""
echo -e "3. ${YELLOW}Monitor deployment:${NC}"
echo -e "   ${BLUE}Netlify: https://app.netlify.com${NC}"
echo -e "   ${BLUE}Vercel: https://vercel.com/dashboard${NC}"
echo ""

if [ -d "$BACKUP_DIR" ]; then
  echo -e "${YELLOW}📋 Rollback Instructions:${NC}"
  echo -e "   If you need to rollback, run:"
  echo -e "   ${BLUE}cp $BACKUP_DIR/page.tsx $WEB_APP/page.tsx${NC}"
  echo ""
fi

echo -e "${BLUE}🎉 Homepage V2 is now ready for production!${NC}"
echo ""
