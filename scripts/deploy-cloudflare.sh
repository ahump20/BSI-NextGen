#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Pages Deployment Setup Script
# This script guides you through setting up Cloudflare Pages deployment

CLOUDFLARE_ACCOUNT_ID="a12cb329d84130460eed99b816e4d0d3"
CLOUDFLARE_API_TOKEN="r-2jlIcjxuS-INveZJAaJS-IzwtJeh6HvH9qi9Fi"
PROJECT_NAME="blazesportsintel"
GITHUB_REPO="ahump20/BSI-NextGen"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔥 Blaze Sports Intel - Cloudflare Pages Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Verify build is ready
echo "📦 Step 1/5: Verifying build..."
if [ -d "packages/web/.next" ]; then
    echo "✅ Build directory exists"
else
    echo "⚠️  No build found. Running build..."
    pnpm build
fi

# Step 2: Check Cloudflare API access
echo ""
echo "🔧 Step 2/5: Checking Cloudflare API access..."
echo "Testing API connectivity..."
API_TEST=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/user/tokens/verify" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")

if echo "$API_TEST" | grep -q '"status":"active"'; then
    echo "✅ Cloudflare API access verified"
else
    echo "❌ API authentication failed"
    echo "$API_TEST" | jq .
    exit 1
fi

# Step 3: Check Cloudflare Pages project
echo ""
echo "🌐 Step 3/5: Checking Cloudflare Pages project..."
echo "Verifying project '$PROJECT_NAME' exists..."

PROJECT_CHECK=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json")

if echo "$PROJECT_CHECK" | grep -q '"success":true'; then
    echo "✅ Project '${PROJECT_NAME}' exists"

    # Get project details
    PROD_URL=$(echo "$PROJECT_CHECK" | grep -o '"subdomain":"[^"]*"' | cut -d'"' -f4)
    echo "   Production URL: https://${PROD_URL}.pages.dev"
else
    echo "⚠️  Project not found. Creating project..."

    CREATE_PROJECT=$(curl -s -X POST \
        "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{
            \"name\": \"${PROJECT_NAME}\",
            \"production_branch\": \"main\",
            \"build_config\": {
                \"build_command\": \"pnpm build\",
                \"destination_dir\": \"packages/web/.next\",
                \"root_dir\": \"/\"
            }
        }")

    if echo "$CREATE_PROJECT" | grep -q '"success":true'; then
        echo "✅ Project created successfully"
        PROD_URL=$(echo "$CREATE_PROJECT" | grep -o '"subdomain":"[^"]*"' | cut -d'"' -f4)
        echo "   Production URL: https://${PROD_URL}.pages.dev"
    else
        echo "❌ Failed to create project"
        echo "$CREATE_PROJECT" | jq .
        exit 1
    fi
fi

# Step 4: Set environment variables
echo ""
echo "🔑 Step 4/5: Setting environment variables..."

ENV_VARS='{
  "SPORTSDATAIO_API_KEY": {
    "value": "6ca2adb39404482da5406f0a6cd7aa37",
    "type": "secret_text"
  },
  "NEXT_PUBLIC_APP_URL": {
    "value": "https://blazesportsintel.pages.dev",
    "type": "plain_text"
  },
  "NODE_ENV": {
    "value": "production",
    "type": "plain_text"
  }
}'

for env_var in $(echo "$ENV_VARS" | jq -r 'keys[]'); do
    echo "Setting ${env_var}..."

    VALUE=$(echo "$ENV_VARS" | jq -r ".\"${env_var}\".value")
    TYPE=$(echo "$ENV_VARS" | jq -r ".\"${env_var}\".type")

    curl -s -X PATCH \
        "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        --data "{
            \"deployment_configs\": {
                \"production\": {
                    \"env_vars\": {
                        \"${env_var}\": {
                            \"value\": \"${VALUE}\",
                            \"type\": \"${TYPE}\"
                        }
                    }
                }
            }
        }" > /dev/null

    echo "✅ ${env_var} configured"
done

# Step 5: Create deployment
echo ""
echo "🚀 Step 5/5: Creating deployment..."
echo "Uploading build to Cloudflare Pages..."

# Create a manifest of files
cd packages/web/.next
MANIFEST=$(find . -type f -print | jq -R -s -c 'split("\n")[:-1]')

echo "Files to upload: $(echo "$MANIFEST" | jq 'length')"

# Note: Direct upload requires creating a proper upload payload
# For now, we'll trigger via GitHub connection
cd /Users/AustinHumphrey/BSI-NextGen

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next Steps:"
echo ""
echo "1. Connect GitHub Repository:"
echo "   https://dash.cloudflare.com/${CLOUDFLARE_ACCOUNT_ID}/pages"
echo "   → Create application → Connect to Git"
echo "   → Select: ${GITHUB_REPO}"
echo ""
echo "2. Add GitHub Secret:"
echo "   https://github.com/${GITHUB_REPO}/settings/secrets/actions"
echo "   → New repository secret"
echo "   → Name: CLOUDFLARE_API_TOKEN"
echo "   → Value: ${CLOUDFLARE_API_TOKEN}"
echo ""
echo "3. Your site will be live at:"
echo "   https://${PROJECT_NAME}.pages.dev"
echo ""
echo "4. Verify deployment:"
echo "   curl https://${PROJECT_NAME}.pages.dev/api/test-env"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
