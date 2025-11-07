#!/bin/bash
set -euo pipefail

# Sandlot Sluggers - Backend Rollback Script
# Version: 1.0.0
# Date: 2025-11-06

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo -e "${RED}Sandlot Sluggers - Backend Rollback${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}WARNING: This will revert backend changes${NC}"
echo ""
echo "Rollback options:"
echo "  1. Rollback D1 schema (DROP tables, reapply)"
echo "  2. Rollback to frontend-only (disable API)"
echo "  3. Cancel"
echo ""
read -p "Select option (1-3): " OPTION

case $OPTION in
  1)
    echo ""
    echo -e "${YELLOW}Backing up D1 data...${NC}"

    # Backup player_progress
    wrangler d1 execute blaze-db --command="SELECT * FROM player_progress" --json > "backup_$(date +%Y%m%d_%H%M%S).json"
    echo -e "${GREEN}✅ Backup created${NC}"

    echo ""
    echo -e "${RED}Dropping tables...${NC}"
    wrangler d1 execute blaze-db --command="DROP TABLE IF EXISTS leaderboard;"
    wrangler d1 execute blaze-db --command="DROP TABLE IF EXISTS player_progress;"
    echo -e "${GREEN}✅ Tables dropped${NC}"

    echo ""
    echo -e "${YELLOW}Reapplying schema...${NC}"
    wrangler d1 execute blaze-db --file=./schema.sql
    echo -e "${GREEN}✅ Schema reapplied${NC}"

    echo ""
    echo -e "${GREEN}✅ D1 rollback complete${NC}"
    echo "Backup file: backup_*.json"
    ;;

  2)
    echo ""
    echo -e "${YELLOW}Deploying frontend-only version...${NC}"

    # Temporarily comment out D1 binding
    cp wrangler.toml wrangler.toml.backup
    sed -i.bak 's/^\[\[d1_databases\]\]/# [[d1_databases]]/' wrangler.toml
    sed -i.bak 's/^binding = "DB"/# binding = "DB"/' wrangler.toml
    sed -i.bak 's/^database_name/# database_name/' wrangler.toml
    sed -i.bak 's/^database_id/# database_id/' wrangler.toml

    # Build and deploy
    npm run build
    npm run deploy

    # Restore wrangler.toml
    mv wrangler.toml.backup wrangler.toml
    rm wrangler.toml.bak

    echo ""
    echo -e "${GREEN}✅ Frontend-only deployment complete${NC}"
    echo "Game will run in offline mode only"
    echo ""
    echo "To restore backend:"
    echo "  1. Uncomment D1 bindings in wrangler.toml"
    echo "  2. Run: ./scripts/deploy-backend.sh"
    ;;

  3)
    echo ""
    echo "Rollback cancelled"
    exit 0
    ;;

  *)
    echo ""
    echo -e "${RED}Invalid option${NC}"
    exit 1
    ;;
esac
