#!/bin/bash
# Blaze Storage Setup Script

set -e

echo "======================================"
echo "Blaze Storage Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI is not installed${NC}"
    echo "Install it with: npm install -g wrangler"
    exit 1
fi

echo -e "${GREEN}✓ Wrangler CLI found${NC}"

# Login check
echo ""
echo "Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Cloudflare${NC}"
    echo "Please run: wrangler login"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated with Cloudflare${NC}"

# Get account ID
echo ""
echo "Getting account ID..."
ACCOUNT_ID=$(wrangler whoami | grep "Account ID" | awk '{print $3}')
if [ -z "$ACCOUNT_ID" ]; then
    echo -e "${RED}❌ Could not determine account ID${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Account ID: $ACCOUNT_ID${NC}"

# Update wrangler.toml with account ID
echo ""
echo "Updating wrangler.toml with account ID..."
sed -i "s/YOUR_ACCOUNT_ID/$ACCOUNT_ID/g" wrangler.toml
echo -e "${GREEN}✓ Updated wrangler.toml${NC}"

# Create R2 buckets
echo ""
echo "======================================"
echo "Creating R2 Buckets"
echo "======================================"

# Production bucket
echo ""
echo "Creating production bucket: blazesports-media-production"
if wrangler r2 bucket create blazesports-media-production 2>/dev/null; then
    echo -e "${GREEN}✓ Production bucket created${NC}"
else
    echo -e "${YELLOW}⚠ Production bucket may already exist${NC}"
fi

# Staging bucket
echo ""
echo "Creating staging bucket: blazesports-media-staging"
if wrangler r2 bucket create blazesports-media-staging 2>/dev/null; then
    echo -e "${GREEN}✓ Staging bucket created${NC}"
else
    echo -e "${YELLOW}⚠ Staging bucket may already exist${NC}"
fi

# Configure CORS
echo ""
echo "======================================"
echo "Configuring CORS"
echo "======================================"

echo ""
echo "Setting CORS for production bucket..."
if wrangler r2 bucket cors put blazesports-media-production --cors-config r2-cors.json; then
    echo -e "${GREEN}✓ CORS configured for production${NC}"
else
    echo -e "${RED}❌ Failed to configure CORS${NC}"
fi

echo ""
echo "Setting CORS for staging bucket..."
if wrangler r2 bucket cors put blazesports-media-staging --cors-config r2-cors.json; then
    echo -e "${GREEN}✓ CORS configured for staging${NC}"
else
    echo -e "${RED}❌ Failed to configure CORS${NC}"
fi

# Create D1 database
echo ""
echo "======================================"
echo "Creating D1 Database"
echo "======================================"

echo ""
echo "Creating database: blaze-storage-db"
DB_OUTPUT=$(wrangler d1 create blaze-storage-db 2>&1 || echo "")

if echo "$DB_OUTPUT" | grep -q "database_id"; then
    DATABASE_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk -F'"' '{print $4}')
    echo -e "${GREEN}✓ Database created${NC}"
    echo "Database ID: $DATABASE_ID"

    # Update wrangler.toml
    sed -i "s/YOUR_DATABASE_ID/$DATABASE_ID/g" wrangler.toml
    echo -e "${GREEN}✓ Updated wrangler.toml with database ID${NC}"
else
    echo -e "${YELLOW}⚠ Database may already exist or failed to create${NC}"
    echo "You may need to manually update wrangler.toml with the database ID"
fi

# Execute schema
echo ""
echo "Applying database schema..."
if wrangler d1 execute blaze-storage-db --file=schema.sql; then
    echo -e "${GREEN}✓ Schema applied${NC}"
else
    echo -e "${RED}❌ Failed to apply schema${NC}"
fi

# Create KV namespaces
echo ""
echo "======================================"
echo "Creating KV Namespaces"
echo "======================================"

echo ""
echo "Creating KV namespace: BLAZE_STORAGE_CACHE"
KV_OUTPUT=$(wrangler kv:namespace create BLAZE_STORAGE_CACHE 2>&1 || echo "")

if echo "$KV_OUTPUT" | grep -q "id ="; then
    KV_ID=$(echo "$KV_OUTPUT" | grep "id =" | awk -F'"' '{print $2}')
    echo -e "${GREEN}✓ KV namespace created${NC}"
    echo "KV ID: $KV_ID"

    # Update wrangler.toml
    sed -i "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml
    echo -e "${GREEN}✓ Updated wrangler.toml with KV ID${NC}"
fi

echo ""
echo "Creating preview KV namespace..."
KV_PREVIEW_OUTPUT=$(wrangler kv:namespace create BLAZE_STORAGE_CACHE --preview 2>&1 || echo "")

if echo "$KV_PREVIEW_OUTPUT" | grep -q "id ="; then
    KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep "id =" | awk -F'"' '{print $2}')
    echo -e "${GREEN}✓ Preview KV namespace created${NC}"
    echo "Preview KV ID: $KV_PREVIEW_ID"

    # Update wrangler.toml
    sed -i "s/YOUR_KV_PREVIEW_ID/$KV_PREVIEW_ID/g" wrangler.toml
    echo -e "${GREEN}✓ Updated wrangler.toml with preview KV ID${NC}"
fi

# Set secrets
echo ""
echo "======================================"
echo "Setting Secrets"
echo "======================================"

echo ""
echo -e "${YELLOW}Optional: Set JWT_SECRET for authentication${NC}"
echo "Run: npm run secret:jwt"

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Deploy to staging: npm run deploy"
echo "3. Deploy to production: npm run deploy:production"
echo ""
echo "Test health check:"
echo "  curl http://localhost:8787/health"
echo ""
echo "For more information, see README.md"
echo ""
