#!/bin/bash
set -e

VERCEL_TOKEN="vck_0t1lFnjR0C1saohIupsLuf8SrZN3h3t91n4XYP0MJTIWRp8fJp2dnHDp"

echo "🚀 Deploying BSI-NextGen to Vercel via REST API..."

# Create deployment using Vercel API
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "bsi-nextgen",
    "gitSource": {
      "type": "github",
      "repo": "ahump20/BSI-NextGen",
      "ref": "main"
    },
    "projectSettings": {
      "framework": "nextjs",
      "buildCommand": "cd ../.. && pnpm build",
      "outputDirectory": ".next",
      "installCommand": "cd ../.. && pnpm install",
      "rootDirectory": "packages/web"
    },
    "env": {
      "SPORTSDATAIO_API_KEY": "6ca2adb39404482da5406f0a6cd7aa37"
    },
    "target": "production"
  }' | jq '.'

echo ""
echo "✅ Deployment initiated!"
