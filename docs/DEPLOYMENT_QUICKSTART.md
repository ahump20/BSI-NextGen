# Sandlot Sluggers - Deployment Quick Start

**Version:** 1.0.0
**Date:** 2025-11-06
**Estimated Time:** 30 minutes

---

## Prerequisites

- [x] Cloudflare account (free tier works)
- [x] Node.js 18+ installed
- [x] npm or pnpm installed
- [x] Wrangler CLI installed globally: `npm install -g wrangler`
- [x] Git installed

---

## Step 1: Fix Wrangler Dependency Issue

```bash
cd /Users/AustinHumphrey/Sandlot-Sluggers

# Install missing workerd dependency
npm install @cloudflare/workerd-darwin-arm64 --save-optional

# Reinstall all dependencies
npm ci
```

**Verify:**
```bash
wrangler --version
# Should output: ⛅️ wrangler 3.87.0
```

---

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser window for OAuth authentication. Grant access.

**Verify:**
```bash
wrangler whoami
# Should show your Cloudflare email
```

---

## Step 3: Deploy D1 Schema

```bash
# Apply schema to production D1 database
wrangler d1 execute blaze-db --file=./schema.sql
```

**Verify:**
```bash
wrangler d1 execute blaze-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

**Expected output:**
```
┌─────────────────┐
│ name            │
├─────────────────┤
│ player_progress │
│ leaderboard     │
└─────────────────┘
```

---

## Step 4: Build & Deploy Frontend

```bash
# Build TypeScript + Vite
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

**Expected output:**
```
✨ Success! Uploaded 42 files (3.2 MB)
✨ Deployment complete! 🎉
🌎 https://5e1ebbdb.sandlot-sluggers.pages.dev
```

---

## Step 5: Run Integration Tests

```bash
# Make test script executable (if not already)
chmod +x scripts/test-api.sh

# Run tests
./scripts/test-api.sh
```

**Expected output:**
```
==========================================
Sandlot Sluggers - API Integration Tests
==========================================

✅ PASSED: Health Check
✅ PASSED: GET New Player (games=0)
✅ PASSED: POST Game Result (games=1, wins=1, xp=219)
✅ PASSED: GET Updated Progress (persistence verified)
✅ PASSED: POST Game Result (loss, games=2)
✅ PASSED: CORS Preflight (OPTIONS request)
✅ PASSED: Response Time (<1000ms, actual: 287ms)

==========================================
Test Summary
==========================================
Passed: 7
Failed: 0

✅ All tests passed!
```

---

## Step 6: Verify Deployment

**Manual checks:**

1. **Frontend loads:**
   ```bash
   open https://5e1ebbdb.sandlot-sluggers.pages.dev
   ```
   - Game should load in browser
   - Babylon.js scene should render
   - No console errors

2. **Health check passes:**
   ```bash
   curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/health | jq .
   ```
   - `status: "healthy"`
   - `database.status: "healthy"`
   - `kv.status: "healthy"`

3. **API works:**
   ```bash
   curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/progress/test-player | jq .
   ```
   - Returns JSON with `gamesPlayed: 0`

---

## Troubleshooting

### Issue: Wrangler command not found

**Solution:**
```bash
npm install -g wrangler
# or use npx:
npx wrangler --version
```

---

### Issue: D1 schema fails with "database not found"

**Solution:**
```bash
# List D1 databases
wrangler d1 list

# If "blaze-db" missing, use existing database ID from wrangler.toml:
wrangler d1 info blaze-db
```

---

### Issue: API returns 500 errors

**Check logs:**
```bash
wrangler pages deployment tail --project-name sandlot-sluggers
```

**Check bindings:**
1. Go to Cloudflare Dashboard
2. Navigate to Pages > sandlot-sluggers > Settings > Functions
3. Verify bindings:
   - D1: `DB` → `blaze-db`
   - KV: `KV` → `BLAZE_KV`

---

### Issue: Tests fail with CORS errors

**Solution:**
Verify `/functions/api/game-result.ts` has CORS headers:
```typescript
headers: {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

---

## Next Steps

Once deployment is successful:

1. **Monitor logs:**
   ```bash
   wrangler pages deployment tail --project-name sandlot-sluggers
   ```

2. **Set up analytics:**
   - Go to Cloudflare Dashboard > Analytics
   - View request metrics, error rates, latency

3. **Enable KV leaderboard cache** (Phase 3):
   - See `/docs/DEPLOYMENT_ARCHITECTURE.md` Section 2.3

4. **Test on mobile:**
   - Open game on iOS/Android device
   - Test touch controls (tap to swing, pitch button)
   - Verify offline mode works (turn off WiFi, play game)

---

## Rollback Procedure

If deployment fails or causes issues:

```bash
# Option 1: Rollback D1 schema
./scripts/rollback-backend.sh
# Select option 1

# Option 2: Deploy frontend-only (disable backend)
./scripts/rollback-backend.sh
# Select option 2
```

---

## Quick Reference

**Production URL:**
```
https://5e1ebbdb.sandlot-sluggers.pages.dev
```

**API Endpoints:**
- `GET /api/health` - Health check
- `GET /api/progress/{playerId}` - Get player progress
- `POST /api/game-result` - Record game result
- `GET /api/stats/global` - Global statistics
- `GET /api/stats/leaderboard/{stat}` - Leaderboard (future)

**Commands:**
```bash
# Deploy
npm run build && npm run deploy

# Test
./scripts/test-api.sh

# Logs
wrangler pages deployment tail --project-name sandlot-sluggers

# D1 Query
wrangler d1 execute blaze-db --command="SELECT * FROM player_progress LIMIT 5"

# KV Get
wrangler kv:key get --namespace-id=1b4e56b25c1442029c5eb3215f9ff636 "test-key"
```

---

## Success Criteria

**Deployment is successful when:**
- ✅ Frontend loads without errors
- ✅ `/api/health` returns `status: "healthy"`
- ✅ All 7 integration tests pass
- ✅ Can play game and record results
- ✅ Progress persists across sessions
- ✅ Offline mode works (queues results to IndexedDB)

**Performance benchmarks:**
- API response time: < 500ms (p95)
- D1 query latency: < 100ms
- KV read latency: < 50ms
- Error rate: < 1%

---

## Support & Documentation

**Full Documentation:**
- `/docs/DEPLOYMENT_ARCHITECTURE.md` - Complete deployment guide
- `/README.md` - Project overview and features
- `/schema.sql` - Database schema

**Cloudflare Dashboard:**
- Pages: https://dash.cloudflare.com/pages
- D1: https://dash.cloudflare.com/d1
- KV: https://dash.cloudflare.com/kv

**Need Help?**
- Check logs: `wrangler pages deployment tail`
- Review architecture doc: `/docs/DEPLOYMENT_ARCHITECTURE.md`
- Test API manually: `curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/health`

---

**END OF QUICK START GUIDE**
