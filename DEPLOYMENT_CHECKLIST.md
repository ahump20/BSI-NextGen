# Sandlot Sluggers - Production Deployment Checklist
**Last Updated**: November 6, 2025

---

## Pre-Deployment Checklist

### ☐ Environment Setup

- [ ] Node.js 18+ installed
- [ ] npm packages installed (`npm install` completed successfully)
- [ ] Wrangler CLI installed globally (`npm install -g wrangler`)
- [ ] Git repository cloned and up to date
- [ ] Cloudflare account created

### ☐ Cloudflare Authentication

```bash
# Test 1: Check if wrangler is installed
wrangler --version
# Expected: wrangler 3.x.x or higher

# Test 2: Login to Cloudflare
wrangler login
# Expected: Opens browser, successful auth

# Test 3: Verify authentication
wrangler whoami
# Expected: Shows your account email and ID
```

**Status**: ⚠️ Currently blocked - API token auth failing
**Resolution**: Use browser-based login (`wrangler login`)

---

## Infrastructure Creation Checklist

### ☐ Step 1: Create D1 Database

```bash
cd /Users/AustinHumphrey/Sandlot-Sluggers

# Create database
wrangler d1 create blaze-baseball-db

# Expected output:
# ✅ Successfully created DB 'blaze-baseball-db'!
# Add the following to your wrangler.toml:
# [[d1_databases]]
# binding = "DB"
# database_name = "blaze-baseball-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Action**: Copy the `database_id` value to clipboard

**Update wrangler.toml**:
```toml
[[d1_databases]]
binding = "DB"
database_name = "blaze-baseball-db"
database_id = "PASTE_YOUR_DATABASE_ID_HERE"  # ← Replace this
```

---

### ☐ Step 2: Create KV Namespace

```bash
# Create KV namespace
wrangler kv:namespace create "KV"

# Expected output:
# ✅ Success!
# Add the following to your wrangler.toml:
# { binding = "KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
```

**Action**: Copy the `id` value to clipboard

**Update wrangler.toml**:
```toml
[[kv_namespaces]]
binding = "KV"
id = "PASTE_YOUR_KV_ID_HERE"  # ← Replace this
```

---

### ☐ Step 3: Create R2 Bucket

```bash
# Create R2 bucket
wrangler r2 bucket create blaze-baseball-assets

# Expected output:
# ✅ Created bucket 'blaze-baseball-assets'
```

**Note**: R2 binding doesn't require an ID in wrangler.toml - it's already configured:
```toml
[[r2_buckets]]
binding = "GAME_ASSETS"
bucket_name = "blaze-baseball-assets"
```

---

### ☐ Step 4: Initialize Database Schema

```bash
# Run schema initialization
wrangler d1 execute blaze-baseball-db --file=./schema.sql

# Expected output:
# ✅ Executed 3 commands in 0.234s
```

**Verify schema creation**:
```bash
# List tables
wrangler d1 execute blaze-baseball-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Expected output:
# | name              |
# |-------------------|
# | player_progress   |
# | leaderboard       |
# | game_sessions     |
```

---

## Build and Test Checklist

### ☐ Step 5: Local Build

```bash
# Clean build
rm -rf dist/
npm run build

# Expected output:
# vite v5.x.x building for production...
# ✓ xx modules transformed.
# dist/index.html                   x.xx kB
# dist/assets/index-xxxxx.js       xxx.xx kB
# ✓ built in xxxms
```

**Verification**:
```bash
# Check dist folder exists
ls -la dist/

# Expected files:
# - index.html
# - assets/
# - favicon.ico
# - manifest.json
```

---

### ☐ Step 6: Local Preview

```bash
# Start local preview server
npm run preview

# Expected output:
# Local:   http://localhost:4173/
# ➜  press h to show help
```

**Manual Testing**:
- [ ] Open http://localhost:4173/ in browser
- [ ] Game loads without errors
- [ ] Character selection works
- [ ] Stadium selection works
- [ ] Pitch button functional
- [ ] No console errors

---

## Deployment Checklist

### ☐ Step 7: Deploy to Cloudflare Pages

```bash
# Deploy to production
wrangler pages deploy dist \
  --project-name=blaze-backyard-baseball \
  --branch=main \
  --commit-dirty=true

# Expected output:
# ✨ Success! Uploaded xx files (x.xx sec)
# ✨ Deployment complete! Take a peek over at https://xxxxxxxx.blaze-backyard-baseball.pages.dev
```

**Action**: Save the deployment URL for testing

---

### ☐ Step 8: Verify API Endpoints

Test all 5 analytics endpoints after deployment:

```bash
# Set your deployment URL
DEPLOY_URL="https://xxxxxxxx.blaze-backyard-baseball.pages.dev"

# Test 1: Global stats
curl "${DEPLOY_URL}/api/stats/global" | jq '.'
# Expected: JSON with activePlayers, gamesToday, gamesTotal, etc.

# Test 2: Leaderboard
curl "${DEPLOY_URL}/api/stats/leaderboard/home_runs?limit=10" | jq '.'
# Expected: JSON with entries array (may be empty initially)

# Test 3: Characters
curl "${DEPLOY_URL}/api/stats/characters" | jq '.'
# Expected: JSON with characters array

# Test 4: Stadiums
curl "${DEPLOY_URL}/api/stats/stadiums" | jq '.'
# Expected: JSON with stadiums array

# Test 5: Specific character
curl "${DEPLOY_URL}/api/stats/characters?characterId=rocket_rivera" | jq '.'
# Expected: JSON with single character stats
```

---

### ☐ Step 9: Deploy Landing Page to Blaze Sports Intel

**Option A: Copy file to BSI repo**
```bash
# Navigate to BSI repo
cd /Users/AustinHumphrey/BSI

# Create sandlot-sluggers directory (if needed)
mkdir -p public/sandlot-sluggers

# Copy landing page
cp /Users/AustinHumphrey/Sandlot-Sluggers/public/sandlot-sluggers.html \
   /Users/AustinHumphrey/BSI/public/sandlot-sluggers/index.html

# Update API_BASE_URL in the file
# Change: const API_BASE_URL = 'https://blaze-backyard-baseball.pages.dev/api';
# To: Your actual deployed URL

# Commit and push
git add public/sandlot-sluggers/
git commit -m "Add Sandlot Sluggers landing page"
git push
```

**Option B: Cloudflare redirect rule**
1. Go to Cloudflare Dashboard → blazesportsintel.com → Rules → Redirect Rules
2. Create new rule:
   - If: URI Path equals `/sandlot-sluggers`
   - Then: Dynamic redirect to `https://blaze-backyard-baseball.pages.dev/sandlot-sluggers.html`
   - Status code: 301 (Permanent)

---

### ☐ Step 10: Smoke Test Production

After deployment, verify these critical paths:

**Game Functionality**:
- [ ] Visit deployed URL (https://xxx.blaze-backyard-baseball.pages.dev)
- [ ] Game loads within 5 seconds
- [ ] No console errors
- [ ] Character selection works
- [ ] Stadium selection works
- [ ] Click "Start Game" - game initializes
- [ ] Pitch button appears and works
- [ ] Ball physics look correct
- [ ] Score updates correctly

**API Functionality**:
- [ ] Global stats endpoint returns valid JSON
- [ ] Leaderboard endpoint returns valid JSON
- [ ] Characters endpoint returns 10 characters
- [ ] Stadiums endpoint returns 5 stadiums
- [ ] No CORS errors in browser console

**Landing Page**:
- [ ] Visit blazesportsintel.com/sandlot-sluggers
- [ ] Page loads within 3 seconds
- [ ] Live stats display (even if 0)
- [ ] Leaderboard shows "No games played yet" message (initially)
- [ ] All 10 characters render with stat bars
- [ ] All 5 stadiums render with descriptions
- [ ] "Play Now" button links to game
- [ ] Responsive on mobile (test on phone or Chrome DevTools)

---

## Post-Deployment Checklist

### ☐ Step 11: Custom Domain Setup (Optional)

If you want `play.blazesportsintel.com` or similar:

```bash
# Add custom domain via Cloudflare Pages dashboard
# 1. Go to Pages → blaze-backyard-baseball → Settings → Custom domains
# 2. Click "Set up a custom domain"
# 3. Enter: play.blazesportsintel.com
# 4. Follow DNS configuration instructions
```

---

### ☐ Step 12: Analytics Setup

**Cloudflare Web Analytics**:
1. Go to Cloudflare Dashboard → Web Analytics
2. Add site: blaze-backyard-baseball.pages.dev
3. Copy the beacon script
4. Add to `/public/index.html` before `</body>`:

```html
<!-- Cloudflare Web Analytics -->
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
        data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'></script>
```

---

### ☐ Step 13: Monitoring Setup

**Create monitoring script**: `/scripts/health-check.sh`

```bash
#!/bin/bash
DEPLOY_URL="https://YOUR_DEPLOYMENT_URL.pages.dev"

echo "🏥 Health Check - $(date)"
echo "================================"

# Test game loads
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}/")
echo "Game Page: ${HTTP_CODE} $([ "$HTTP_CODE" -eq 200 ] && echo '✅' || echo '❌')"

# Test APIs
API_ENDPOINTS=("global" "leaderboard/home_runs" "characters" "stadiums")
for endpoint in "${API_ENDPOINTS[@]}"; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}/api/stats/${endpoint}")
  echo "API ${endpoint}: ${HTTP_CODE} $([ "$HTTP_CODE" -eq 200 ] && echo '✅' || echo '❌')"
done

echo "================================"
```

**Run health checks**:
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

**Set up cron job** (optional):
```bash
# Run health check every hour
crontab -e
# Add line:
# 0 * * * * /Users/AustinHumphrey/Sandlot-Sluggers/scripts/health-check.sh >> /tmp/sandlot-health.log 2>&1
```

---

## Troubleshooting Guide

### Issue: "Unable to authenticate request [code: 10001]"

**Solution**:
```bash
# Clear existing auth
rm -rf ~/.wrangler/config/

# Re-authenticate with browser
wrangler login

# Verify
wrangler whoami
```

---

### Issue: Build fails with TypeScript errors

**Solution**:
```bash
# Clean TypeScript cache
rm -rf node_modules/.cache/

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

---

### Issue: API returns 500 errors

**Check**:
1. Database initialized? `wrangler d1 execute blaze-baseball-db --command="SELECT * FROM player_progress LIMIT 1;"`
2. KV namespace bound correctly in wrangler.toml?
3. Check Cloudflare Pages logs: Dashboard → Pages → blaze-backyard-baseball → Logs

---

### Issue: CORS errors in browser console

**Check**:
1. Verify `ALLOWED_ORIGINS` in `/functions/api/stats/_utils.ts` includes your domain
2. Deploy updated code
3. Clear browser cache (Cmd+Shift+R on Mac)

---

### Issue: Landing page shows "0" for all stats

**Expected Behavior**: This is normal until players start playing games!

**To test with fake data**:
1. Play a few games yourself
2. Manually insert test data:

```bash
wrangler d1 execute blaze-baseball-db --command="
INSERT INTO player_progress (player_id, games_played, total_home_runs, total_hits, total_runs)
VALUES ('test_player_1', 10, 25, 80, 45);
"
```

3. Wait 60 seconds for cache to expire
4. Refresh landing page - stats should update

---

## Performance Targets

After deployment, verify these metrics:

| Metric | Target | How to Check |
|--------|--------|--------------|
| Page Load Time | < 3s | Chrome DevTools → Network |
| API Response Time | < 500ms | `curl -w "@curl-format.txt"` |
| Cache Hit Rate | > 80% | Cloudflare Dashboard → Analytics |
| Error Rate | < 1% | Cloudflare Pages → Logs |
| Lighthouse Score | > 90 | Chrome DevTools → Lighthouse |

---

## Success Criteria

✅ Deployment is successful when:

- [ ] Game is playable at deployed URL
- [ ] All 5 API endpoints return 200 OK
- [ ] Landing page loads and fetches live stats
- [ ] No console errors in browser
- [ ] Mobile responsive design works
- [ ] Leaderboard updates after playing games
- [ ] Character stats render correctly
- [ ] Stadium selection works

---

## Quick Command Reference

```bash
# Authentication
wrangler login
wrangler whoami

# Infrastructure
wrangler d1 create blaze-baseball-db
wrangler kv:namespace create "KV"
wrangler r2 bucket create blaze-baseball-assets

# Database
wrangler d1 execute blaze-baseball-db --file=./schema.sql
wrangler d1 execute blaze-baseball-db --command="SELECT * FROM player_progress;"

# Build & Deploy
npm run build
npm run preview
wrangler pages deploy dist --project-name=blaze-backyard-baseball

# Testing
./scripts/health-check.sh

# Logs
wrangler pages deployment tail
```

---

## Contact & Support

If you encounter issues:
1. Check [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
2. Check [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
3. Review error logs in Cloudflare Dashboard
4. Open issue on GitHub repository

---

**Ready to deploy!** 🚀

Start with Step 1 (Cloudflare Authentication) and work through each checkbox sequentially.
