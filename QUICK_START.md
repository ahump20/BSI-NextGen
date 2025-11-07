# 🚀 Quick Start - 8 Minutes to Production

**Current Status**: ✅ All code complete. Ready for deployment.

---

## Step 1: Generate API Token (5 minutes)

Go to: https://dash.cloudflare.com/profile/api-tokens

**Create Custom Token** with these permissions:
- Account → D1 → **Edit**
- Account → Workers KV Storage → **Edit**
- Account → R2 → **Edit**
- Account → Cloudflare Pages → **Edit**

Copy the token immediately (it won't be shown again).

---

## Step 2: Deploy (3 minutes, 1 command)

```bash
cd /Users/AustinHumphrey/Sandlot-Sluggers

# Set your token
export CLOUDFLARE_API_TOKEN="your-new-token-here"

# Deploy everything automatically
./deploy-infrastructure.sh
```

**The script will**:
- ✅ Create D1 database
- ✅ Create KV namespace
- ✅ Create R2 bucket
- ✅ Update configuration
- ✅ Initialize database
- ✅ Deploy to production
- ✅ Show deployment URL

---

## Step 3: Test (2 minutes)

```bash
# Use deployment URL from script output
export DEPLOY_URL="https://your-deployment.pages.dev"

# Quick health check
./scripts/health-check.sh

# Full test suite (50+ tests)
./scripts/test-api.sh
```

---

## That's It! 🎉

Your game is live at the deployment URL.

**What You'll Have**:
- 3D Babylon.js baseball game
- 6 live API endpoints
- Real-time leaderboards
- Player progression tracking
- Landing page with live stats

---

## Troubleshooting

**"Authentication failed"**: Token doesn't have Edit permissions. Regenerate with correct permissions.

**"Resource already exists"**: Normal if re-running. Script handles this automatically.

**Need help?**: See `FINAL_DEPLOYMENT_SUMMARY.md` for complete documentation.

---

**Total Time**: 8 minutes (5 min token + 3 min deployment)
