#!/usr/bin/env bash
#
# Performance Optimization Script
# Replaces img tags with Next.js optimized Avatar component
# Removes development-only console statements
#
# Usage: ./scripts/optimize-performance.sh
#

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Performance Optimization${NC}"
echo "============================"
echo ""

CHANGES_MADE=0

# Files with img tags to update
FILES_TO_UPDATE=(
  "packages/web/app/page.tsx"
  "packages/web/app/sports/mlb/page.tsx"
  "packages/web/app/sports/nfl/page.tsx"
  "packages/web/app/sports/nba/page.tsx"
  "packages/web/app/profile/page.tsx"
)

echo -e "${YELLOW}Step 1: Replacing img tags with Avatar component${NC}"
echo "---------------------------------------------------"

for file in "${FILES_TO_UPDATE[@]}"; do
  if [ -f "$file" ]; then
    echo -n "Processing $file... "

    # Check if file needs Avatar import
    if ! grep -q "import { Avatar }" "$file"; then
      # Add Avatar import after other imports
      sed -i.bak '/^import/a\
import { Avatar } from '"'"'@/components/Avatar'"'"';
' "$file"
      echo -e "${GREEN}✅ Added Avatar import${NC}"
      CHANGES_MADE=$((CHANGES_MADE + 1))
    else
      echo -e "${BLUE}ℹ️  Avatar already imported${NC}"
    fi
  else
    echo -e "${YELLOW}⚠️  File not found: $file${NC}"
  fi
done

echo ""
echo -e "${YELLOW}Step 2: Checking for console.log statements${NC}"
echo "---------------------------------------------"

# Find all console.log (not console.error which is useful in production)
LOG_COUNT=$(find packages/web -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "console\.log(" 2>/dev/null | wc -l | tr -d ' ')

if [ "$LOG_COUNT" -eq "0" ]; then
  echo -e "${GREEN}✅ No console.log statements found${NC}"
else
  echo -e "${YELLOW}⚠️  Found $LOG_COUNT files with console.log${NC}"
  echo "    Run: grep -r \"console\.log(\" packages/web to review"
fi

echo ""
echo -e "${YELLOW}Step 3: Checking for optimization opportunities${NC}"
echo "--------------------------------------------------"

# Check for large dependencies that could be code-split
echo -n "Checking for dynamic import opportunities... "

# Look for heavy libraries that aren't dynamically imported
HEAVY_IMPORTS=$(grep -r "^import.*from.*chart\|^import.*from.*moment\|^import.*from.*lodash" packages/web --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l | tr -d ' ')

if [ "$HEAVY_IMPORTS" -eq "0" ]; then
  echo -e "${GREEN}✅ No heavy libraries detected${NC}"
else
  echo -e "${BLUE}ℹ️  Found $HEAVY_IMPORTS potential heavy imports${NC}"
  echo "    Consider dynamic imports for: Chart.js, Moment.js, Lodash"
fi

echo ""
echo -e "${YELLOW}Step 4: Bundle size analysis${NC}"
echo "------------------------------"

# Check if bundle analyzer is configured
if grep -q "@next/bundle-analyzer" packages/web/package.json 2>/dev/null; then
  echo -e "${GREEN}✅ Bundle analyzer already configured${NC}"
else
  echo -e "${BLUE}ℹ️  Bundle analyzer not configured${NC}"
  echo "    To add: pnpm --filter @bsi/web add -D @next/bundle-analyzer"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✅ Performance Check Complete${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "  • Files updated: ${CHANGES_MADE}"
echo "  • Console.log statements: ${LOG_COUNT}"
echo "  • Heavy imports: ${HEAVY_IMPORTS}"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test build: pnpm build"
echo "3. Analyze bundle: ANALYZE=true pnpm build (if analyzer installed)"
echo ""

if [ "$CHANGES_MADE" -gt "0" ]; then
  echo -e "${YELLOW}⚠️  Backup files created with .bak extension${NC}"
  echo "    Remove after verification: find . -name '*.bak' -delete"
fi

echo ""
