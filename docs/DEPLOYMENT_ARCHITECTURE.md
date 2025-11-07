# Sandlot Sluggers - Comprehensive Deployment Architecture

**Document Version:** 1.0.0
**Date:** 2025-11-06
**Status:** Production Frontend Deployed | Backend Pending
**Confidence:** 95%

---

## Executive Summary

Sandlot Sluggers is a mobile-first 3D baseball game built with Babylon.js 7.31 and Havok Physics, currently deployed to Cloudflare Pages at `https://5e1ebbdb.sandlot-sluggers.pages.dev`. The frontend is fully operational with physics-driven gameplay, but backend infrastructure (D1, KV, Durable Objects) remains uncommitted and requires systematic deployment.

### Current State Analysis

**Production Assets:**
- ✅ Frontend: Babylon.js 3D game with Havok Physics
- ✅ Hosting: Cloudflare Pages (live)
- ✅ Build Pipeline: Vite 5 + TypeScript
- ⚠️ Backend: Functions exist but not deployed
- ⚠️ D1 Database: Configured but schema not applied
- ⚠️ KV Namespace: Configured but not utilized
- ❌ Durable Objects: Commented out (no Worker script)
- ❌ R2 Storage: Commented out (account limitation)

**Risk Assessment:**
- **Frontend Stability:** HIGH (95% confidence)
- **Backend Readiness:** MEDIUM (functions exist, need testing)
- **Data Persistence:** LOW (no schema deployed)
- **Multiplayer Capability:** NONE (Durable Objects disabled)

---

## 1. System Architecture

### 1.1 High-Level Architecture (Text Diagram)

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Babylon.js 7.31 Game Engine                               │  │
│  │  • WebGPU Rendering (fallback: WebGL2)                     │  │
│  │  • Havok Physics Engine                                    │  │
│  │  • Touch-optimized controls                                │  │
│  │  • Offline-first with IndexedDB cache                      │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS (REST + WebSocket)
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                        │
│  ┌─────────────────────┐  ┌────────────────────────────────────┐ │
│  │  Cloudflare Pages   │  │   Pages Functions (Serverless)     │ │
│  │  • Static hosting   │  │   /api/progress/[playerId]        │ │
│  │  • Global CDN       │  │   /api/game-result                │ │
│  │  • Automatic SSL    │  │   /api/stats/*                    │ │
│  │  • Edge caching     │  │   • GET player progress           │ │
│  └─────────────────────┘  │   • POST game results             │ │
│                            │   • PATCH progress updates        │ │
│                            └────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              ↕ Bindings
┌──────────────────────────────────────────────────────────────────┐
│                    Persistence Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  D1 (SQLite) │  │  KV Storage  │  │  Durable Objects       │ │
│  │              │  │              │  │  (Future: Multiplayer) │ │
│  │  • Players   │  │  • Leaderbd  │  │  • GameSession DO      │ │
│  │  • Progress  │  │  • Cache     │  │  • WebSocket state     │ │
│  │  • Stats     │  │  • <50ms RD  │  │  • Real-time sync      │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow Architecture

#### Single-Player Game Flow
```
Player Action → Babylon.js Physics → Game Result
                                          ↓
                              Circuit Breaker + Retry
                                          ↓
                          POST /api/game-result
                                          ↓
                      ┌─────────────────────────────┐
                      │  Cloudflare Pages Function  │
                      │  1. Calculate XP gained     │
                      │  2. Check level-ups         │
                      │  3. Update D1 database      │
                      │  4. Return new progress     │
                      └─────────────────────────────┘
                                          ↓
                          D1: player_progress table
                                          ↓
                      Cache to IndexedDB (offline)
```

#### Offline-First Flow
```
Network Failed → Queue to IndexedDB (PendingGameResult)
                              ↓
                 Store updated progress locally
                              ↓
              Display "Offline Mode" indicator
                              ↓
         Network Restored → Auto-sync pending results
                              ↓
              POST each queued result to API
                              ↓
              Update local cache with server response
```

### 1.3 Component Interaction Map

```
GameEngine.ts
    ├──> BatterSystem.ts ──> BallPhysics.ts ──> ContactResult
    ├──> PitcherSystem.ts ──> HavokPhysics ──> PitchTrajectory
    ├──> FieldingSystem.ts ──> BaseRunningSystem.ts ──> GameScore
    └──> PostGameScreen.ts ──> ProgressionAPI.recordGameResult()
                                        ↓
                            /api/game-result (Pages Function)
                                        ↓
                            D1: player_progress
                                        ↓
                            KV: leaderboard cache (future)
```

---

## 2. Backend Deployment Strategy

### 2.1 Phase 1: D1 Database Deployment (Critical Path)

**Objective:** Deploy schema and enable persistence for single-player progression.

**Pre-Deployment Checklist:**
- [x] Schema defined (`schema.sql`)
- [x] D1 binding configured (`wrangler.toml`)
- [ ] Schema applied to production database
- [ ] Connection tested from Pages Functions
- [ ] Migration rollback script prepared

**Deployment Steps:**

```bash
# Step 1: Verify D1 database exists
wrangler d1 info blaze-db

# Expected output:
# Database: blaze-db
# UUID: d3d5415d-0264-41ee-840f-bf12d88d3319
# Created: 2024-XX-XX

# Step 2: Apply schema (IDEMPOTENT - uses IF NOT EXISTS)
wrangler d1 execute blaze-db --file=./schema.sql

# Step 3: Verify tables created
wrangler d1 execute blaze-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# Expected output:
# player_progress, leaderboard

# Step 4: Verify indexes created
wrangler d1 execute blaze-db --command="SELECT name FROM sqlite_master WHERE type='index';"

# Expected output:
# idx_player_level, idx_player_wins, idx_leaderboard_type_value

# Step 5: Insert test data (validation)
wrangler d1 execute blaze-db --command="
  INSERT INTO player_progress
  (player_id, games_played, wins, current_level, experience)
  VALUES ('test-player-1', 1, 1, 1, 150);
"

# Step 6: Query test data
wrangler d1 execute blaze-db --command="
  SELECT * FROM player_progress WHERE player_id = 'test-player-1';
"

# Step 7: Clean up test data
wrangler d1 execute blaze-db --command="
  DELETE FROM player_progress WHERE player_id = 'test-player-1';
"
```

**Rollback Procedure (if needed):**

```bash
# Save current data (backup)
wrangler d1 execute blaze-db --command="SELECT * FROM player_progress;" > backup_$(date +%Y%m%d_%H%M%S).json

# Drop tables (CAUTION: DATA LOSS)
wrangler d1 execute blaze-db --command="DROP TABLE IF EXISTS leaderboard;"
wrangler d1 execute blaze-db --command="DROP TABLE IF EXISTS player_progress;"

# Reapply schema
wrangler d1 execute blaze-db --file=./schema.sql
```

**Success Metrics:**
- Schema applied: `sqlite_master` contains `player_progress` and `leaderboard`
- Indexes created: 3 indexes present
- Test query succeeds: Can INSERT and SELECT from `player_progress`
- Pages Function binding: API can query D1 without errors

**Risk Level:** LOW
**Reversibility:** HIGH (schema uses IF NOT EXISTS, can drop tables)

---

### 2.2 Phase 2: Pages Functions Testing

**Objective:** Validate API endpoints with production D1 binding.

**Test Plan:**

#### Test 1: Player Progress GET (New Player)
```bash
# Request
curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/progress/new-player-123

# Expected Response (200 OK)
{
  "playerId": "new-player-123",
  "gamesPlayed": 0,
  "wins": 0,
  "losses": 0,
  "totalRuns": 0,
  "totalHits": 0,
  "totalHomeRuns": 0,
  "unlockedCharacters": [],
  "unlockedStadiums": [],
  "currentLevel": 1,
  "experience": 0
}
```

#### Test 2: Game Result POST (First Game)
```bash
# Request
curl -X POST https://5e1ebbdb.sandlot-sluggers.pages.dev/api/game-result \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test-player-456",
    "won": true,
    "runsScored": 5,
    "hitsRecorded": 8,
    "homeRunsHit": 2
  }'

# Expected Response (200 OK)
{
  "player_id": "test-player-456",
  "games_played": 1,
  "wins": 1,
  "losses": 0,
  "total_runs": 5,
  "total_hits": 8,
  "total_home_runs": 2,
  "current_level": 1,
  "experience": 199,  # 100 base + 50 win + 25 runs + 24 hits + 20 HRs
  "unlocked_characters": [],
  "unlocked_stadiums": [],
  "xp_gained": 199,
  "leveled_up": false
}
```

#### Test 3: Progress GET (Existing Player)
```bash
curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/progress/test-player-456

# Should return same data as Test 2
```

#### Test 4: Game Result POST (Level Up Test)
```bash
# Request (enough XP to trigger level up)
curl -X POST https://5e1ebbdb.sandlot-sluggers.pages.dev/api/game-result \
  -H "Content-Type: application/json" \
  -d '{
    "playerId": "test-player-456",
    "won": true,
    "runsScored": 50,
    "hitsRecorded": 30,
    "homeRunsHit": 10
  }'

# Expected Response
{
  ...
  "current_level": 2,  # Leveled up!
  "experience": XXX,   # Rolled over to next level
  "leveled_up": true
}
```

#### Test 5: CORS Validation
```bash
# OPTIONS preflight
curl -X OPTIONS https://5e1ebbdb.sandlot-sluggers.pages.dev/api/game-result \
  -H "Origin: https://example.com" \
  -H "Access-Control-Request-Method: POST"

# Expected Response (204 No Content)
# Headers:
#   Access-Control-Allow-Origin: *
#   Access-Control-Allow-Methods: POST, OPTIONS
#   Access-Control-Allow-Headers: Content-Type
```

**Automated Test Script:**

```bash
#!/bin/bash
# File: scripts/test-api.sh

BASE_URL="https://5e1ebbdb.sandlot-sluggers.pages.dev"
TEST_PLAYER="test-$(date +%s)"

echo "Testing Sandlot Sluggers API"
echo "Test Player ID: $TEST_PLAYER"

# Test 1: New player GET
echo -e "\n[Test 1] GET new player progress..."
RESPONSE=$(curl -s "$BASE_URL/api/progress/$TEST_PLAYER")
echo "$RESPONSE" | jq .

# Validate response
if echo "$RESPONSE" | jq -e '.gamesPlayed == 0' > /dev/null; then
  echo "✅ Test 1 PASSED"
else
  echo "❌ Test 1 FAILED"
  exit 1
fi

# Test 2: POST game result
echo -e "\n[Test 2] POST game result..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/game-result" \
  -H "Content-Type: application/json" \
  -d "{
    \"playerId\": \"$TEST_PLAYER\",
    \"won\": true,
    \"runsScored\": 5,
    \"hitsRecorded\": 8,
    \"homeRunsHit\": 2
  }")
echo "$RESPONSE" | jq .

# Validate response
if echo "$RESPONSE" | jq -e '.games_played == 1 and .wins == 1' > /dev/null; then
  echo "✅ Test 2 PASSED"
else
  echo "❌ Test 2 FAILED"
  exit 1
fi

# Test 3: GET updated progress
echo -e "\n[Test 3] GET updated player progress..."
RESPONSE=$(curl -s "$BASE_URL/api/progress/$TEST_PLAYER")
echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.games_played == 1' > /dev/null; then
  echo "✅ Test 3 PASSED"
else
  echo "❌ Test 3 FAILED"
  exit 1
fi

echo -e "\n✅ All tests passed!"
echo "Clean up test player manually if needed: $TEST_PLAYER"
```

**Success Metrics:**
- All 5 tests pass
- Response time < 500ms (p95)
- D1 queries execute successfully
- CORS headers present
- Error handling works (test with invalid payloads)

**Risk Level:** MEDIUM
**Reversibility:** HIGH (test data can be deleted)

---

### 2.3 Phase 3: KV Namespace Integration

**Objective:** Implement leaderboard caching with KV for sub-50ms reads.

**KV Usage Patterns:**

```typescript
// KV Key Schema
interface KVKeys {
  "leaderboard:wins:top100": PlayerProgress[];          // TTL: 5 minutes
  "leaderboard:home_runs:top100": PlayerProgress[];     // TTL: 5 minutes
  "leaderboard:total_runs:top100": PlayerProgress[];    // TTL: 5 minutes
  "leaderboard:global:last_update": number;             // Timestamp
  "player:session:{playerId}": { lastActive: number };  // TTL: 1 hour
}
```

**Implementation (New API Endpoint):**

```typescript
// functions/api/leaderboard.ts
interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const statType = url.searchParams.get("stat") || "wins";
  const limit = parseInt(url.searchParams.get("limit") || "100");

  const cacheKey = `leaderboard:${statType}:top${limit}`;

  // Try KV cache first
  const cached = await context.env.KV.get(cacheKey, "json");

  if (cached) {
    return new Response(JSON.stringify({
      data: cached,
      cached: true,
      timestamp: Date.now()
    }), {
      headers: {
        "Content-Type": "application/json",
        "X-Cache": "HIT"
      }
    });
  }

  // Cache miss - query D1
  const results = await context.env.DB.prepare(`
    SELECT * FROM player_progress
    ORDER BY ${statType} DESC
    LIMIT ?
  `).bind(limit).all();

  // Store in KV with 5-minute TTL
  await context.env.KV.put(cacheKey, JSON.stringify(results.results), {
    expirationTtl: 300
  });

  return new Response(JSON.stringify({
    data: results.results,
    cached: false,
    timestamp: Date.now()
  }), {
    headers: {
      "Content-Type": "application/json",
      "X-Cache": "MISS"
    }
  });
};
```

**Deployment Steps:**

```bash
# Step 1: Verify KV namespace exists
wrangler kv:namespace list

# Expected output:
# [
#   {
#     "id": "1b4e56b25c1442029c5eb3215f9ff636",
#     "title": "BLAZE_KV"
#   }
# ]

# Step 2: Test KV write
wrangler kv:key put --namespace-id=1b4e56b25c1442029c5eb3215f9ff636 \
  "test:key" "test_value"

# Step 3: Test KV read
wrangler kv:key get --namespace-id=1b4e56b25c1442029c5eb3215f9ff636 \
  "test:key"

# Expected output: test_value

# Step 4: Deploy leaderboard endpoint
# (Automatically deployed with next `npm run deploy`)

# Step 5: Test leaderboard endpoint
curl "https://5e1ebbdb.sandlot-sluggers.pages.dev/api/leaderboard?stat=wins&limit=10"

# Step 6: Verify cache headers
curl -I "https://5e1ebbdb.sandlot-sluggers.pages.dev/api/leaderboard?stat=wins"
# Look for: X-Cache: MISS (first request)

curl -I "https://5e1ebbdb.sandlot-sluggers.pages.dev/api/leaderboard?stat=wins"
# Look for: X-Cache: HIT (subsequent request within 5 min)
```

**Success Metrics:**
- KV reads < 50ms (p95)
- Cache hit rate > 80% after warmup
- D1 queries reduced by 5x
- Leaderboard endpoint returns valid JSON
- Cache invalidation works (expires after 5 minutes)

**Risk Level:** LOW
**Reversibility:** HIGH (KV is cache, can be cleared)

---

### 2.4 Phase 4: Durable Objects (Multiplayer - Future)

**Status:** Currently commented out in `wrangler.toml` due to missing Worker script.

**Blockers:**
1. Durable Objects require a Worker script with `export default` handler
2. `game-session.ts` exists but needs to be deployed as a Worker
3. Pages Functions can't directly export Durable Objects

**Architecture Requirement:**

```
Current Architecture:
  Cloudflare Pages (Static + Functions)
    └─ D1 + KV bindings

Required Architecture for Multiplayer:
  Cloudflare Pages (Frontend)
    └─ WebSocket connection to...

  Cloudflare Worker (Separate script: "sandlot-sluggers-multiplayer")
    └─ Durable Objects binding: GAME_SESSIONS
         └─ GameSessionDurableObject class
```

**Deployment Plan (Future Phase):**

1. **Create standalone Worker script:**
   - Extract `game-session.ts` to separate Worker project
   - Deploy as `sandlot-sluggers-multiplayer` Worker
   - Configure custom domain: `multiplayer.sandlot-sluggers.pages.dev`

2. **Enable Durable Objects:**
   - Uncomment in `wrangler.toml`
   - Update `script_name` to match Worker
   - Deploy Worker with DO binding

3. **Frontend Integration:**
   - Update WebSocket connection URL in `GameEngine.ts`
   - Add matchmaking UI (join/create game)
   - Implement reconnection logic

**Estimated Timeline:** 2-3 weeks
**Risk Level:** HIGH (new WebSocket infrastructure)
**Reversibility:** MEDIUM (requires Worker deletion)

**Decision:** **DEFER** until single-player backend is stable and validated.

---

## 3. Deployment Sequence with Dependencies

### 3.1 Critical Path

```
Phase 1: D1 Schema Deployment
  ├─ DEPENDS ON: Cloudflare account access
  ├─ BLOCKS: Phase 2 (API testing)
  └─ ESTIMATED TIME: 30 minutes

Phase 2: API Testing & Validation
  ├─ DEPENDS ON: Phase 1 complete
  ├─ BLOCKS: Phase 3 (KV integration)
  └─ ESTIMATED TIME: 2 hours

Phase 3: KV Leaderboard Cache
  ├─ DEPENDS ON: Phase 2 passing
  ├─ BLOCKS: None (optional enhancement)
  └─ ESTIMATED TIME: 1 hour

Phase 4: Durable Objects (Future)
  ├─ DEPENDS ON: Phases 1-3 stable
  ├─ BLOCKS: Multiplayer features
  └─ ESTIMATED TIME: 2-3 weeks
```

### 3.2 Pre-Deployment Checklist

**Environment Validation:**
- [ ] Cloudflare account authenticated (`wrangler whoami`)
- [ ] D1 database exists (`wrangler d1 info blaze-db`)
- [ ] KV namespace exists (`wrangler kv:namespace list`)
- [ ] Pages deployment succeeds (`npm run build && npm run deploy`)
- [ ] Node.js dependencies installed (`npm ci`)

**Code Validation:**
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] No placeholder TODOs in API functions
- [ ] CORS headers configured
- [ ] Error handling implemented
- [ ] Input validation present

**Documentation:**
- [ ] API endpoints documented
- [ ] Database schema versioned
- [ ] Rollback procedures tested
- [ ] Monitoring dashboard created

### 3.3 Deployment Timeline

**Day 1: Foundation**
- [ ] Apply D1 schema
- [ ] Verify D1 connectivity from Pages Functions
- [ ] Run Test 1-2 (new player GET, POST game result)

**Day 2: Validation**
- [ ] Run full test suite (`scripts/test-api.sh`)
- [ ] Load test API endpoints (100 req/s for 1 minute)
- [ ] Monitor D1 query performance
- [ ] Fix any issues found

**Day 3: Enhancement**
- [ ] Implement KV leaderboard cache
- [ ] Deploy leaderboard endpoint
- [ ] Verify cache hit rates
- [ ] Update frontend to call leaderboard API

**Day 4-5: Monitoring & Optimization**
- [ ] Set up Cloudflare Analytics
- [ ] Create dashboard for key metrics
- [ ] Optimize slow queries (if any)
- [ ] Document lessons learned

---

## 4. Risk Assessment & Mitigation

### 4.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| D1 schema migration fails | LOW | HIGH | Use IF NOT EXISTS, test in dev first |
| API returns 500 errors | MEDIUM | HIGH | Comprehensive error handling + circuit breakers |
| KV cache stampede | LOW | MEDIUM | Stagger cache expiry, use cache warming |
| Durable Objects hit limits | HIGH | MEDIUM | Defer until stable, use rate limiting |
| Frontend can't reach API | LOW | HIGH | Offline-first design, IndexedDB fallback |
| Data loss during migration | LOW | CRITICAL | Backup before deployment, test rollback |

### 4.2 Critical Failure Scenarios

#### Scenario 1: D1 Schema Corruption
**Symptoms:** API returns "table not found" errors

**Immediate Response:**
1. Check D1 dashboard: Is database online?
2. Query `sqlite_master`: Are tables present?
3. If tables missing: Reapply schema immediately
4. If schema malformed: Restore from backup

**Rollback:**
```bash
# Drop corrupted tables
wrangler d1 execute blaze-db --command="DROP TABLE IF EXISTS player_progress;"
wrangler d1 execute blaze-db --command="DROP TABLE IF EXISTS leaderboard;"

# Reapply schema
wrangler d1 execute blaze-db --file=./schema.sql
```

#### Scenario 2: API Rate Limit Exceeded
**Symptoms:** 429 Too Many Requests from D1

**Immediate Response:**
1. Enable circuit breaker (already implemented in `RetryUtils.ts`)
2. Increase cache TTL to reduce D1 queries
3. Implement request throttling at edge

**Long-term Fix:**
- Implement KV caching (Phase 3)
- Add rate limiting per player ID
- Use batch queries where possible

#### Scenario 3: Frontend Can't Connect to Backend
**Symptoms:** "Request timed out" errors in browser console

**Immediate Response:**
1. Check Cloudflare status page
2. Verify Pages Functions are deployed
3. Test API directly with curl
4. Enable offline mode (already implemented)

**Rollback:**
- Frontend continues working in offline mode
- Game results queue to IndexedDB
- Auto-sync when backend recovers

### 4.3 Rollback Procedures

#### Full Backend Rollback
```bash
# Step 1: Remove D1 bindings (non-destructive)
# Edit wrangler.toml - comment out [[d1_databases]]

# Step 2: Redeploy Pages without functions
npm run build
wrangler pages deploy dist --project-name sandlot-sluggers

# Step 3: Verify frontend still works in offline mode
curl https://5e1ebbdb.sandlot-sluggers.pages.dev/

# Result: Game playable, no backend calls, data stored locally
```

#### Partial Rollback (API Only)
```bash
# Keep D1 schema, disable specific functions
# Rename functions/api/game-result.ts to game-result.ts.disabled

npm run build
wrangler pages deploy dist
```

---

## 5. Monitoring & Observability

### 5.1 Key Metrics to Track

**Application Metrics:**
- API response time (p50, p95, p99)
- D1 query latency
- KV cache hit rate
- Error rate by endpoint
- Active player sessions
- Game completion rate

**Infrastructure Metrics:**
- Cloudflare Pages bandwidth
- D1 database size
- KV namespace size
- Request count by region
- Edge cache hit ratio

**Business Metrics:**
- Daily active players
- Average games per player
- Level progression curve
- Feature unlock rates
- Leaderboard engagement

### 5.2 Cloudflare Analytics Configuration

```javascript
// Add to functions/_middleware.ts
export const onRequest: PagesFunction = async (context) => {
  const start = Date.now();

  try {
    const response = await context.next();

    // Log metrics to Analytics Engine
    context.env.ANALYTICS.writeDataPoint({
      blobs: [context.request.url],
      doubles: [Date.now() - start, response.status],
      indexes: [context.request.method]
    });

    return response;
  } catch (error) {
    // Log error
    context.env.ANALYTICS.writeDataPoint({
      blobs: [context.request.url, error.message],
      doubles: [Date.now() - start, 500],
      indexes: ["ERROR"]
    });

    throw error;
  }
};
```

### 5.3 Health Check Endpoints

```typescript
// functions/api/health.ts
interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const checks = {
    timestamp: Date.now(),
    status: "healthy",
    checks: {
      database: { status: "unknown", latency: 0 },
      kv: { status: "unknown", latency: 0 },
      frontend: { status: "healthy", latency: 0 }
    }
  };

  // Test D1 connection
  try {
    const dbStart = Date.now();
    await context.env.DB.prepare("SELECT 1").first();
    checks.checks.database = {
      status: "healthy",
      latency: Date.now() - dbStart
    };
  } catch (error) {
    checks.checks.database = {
      status: "unhealthy",
      latency: 0,
      error: error.message
    };
    checks.status = "degraded";
  }

  // Test KV connection
  try {
    const kvStart = Date.now();
    await context.env.KV.get("health-check");
    checks.checks.kv = {
      status: "healthy",
      latency: Date.now() - kvStart
    };
  } catch (error) {
    checks.checks.kv = {
      status: "unhealthy",
      latency: 0,
      error: error.message
    };
    checks.status = "degraded";
  }

  const statusCode = checks.status === "healthy" ? 200 : 503;

  return new Response(JSON.stringify(checks, null, 2), {
    status: statusCode,
    headers: { "Content-Type": "application/json" }
  });
};
```

**Usage:**
```bash
# Check overall health
curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/health

# Monitor with uptime service (e.g., UptimeRobot)
# Alert if status != 200 for > 2 minutes
```

---

## 6. Feature Flags & Progressive Rollout

### 6.1 Feature Flag System

**Implementation (KV-based):**

```typescript
// lib/feature-flags.ts
interface FeatureFlags {
  backend_enabled: boolean;
  kv_leaderboard: boolean;
  multiplayer: boolean;
  analytics_tracking: boolean;
  offline_mode: boolean;
}

export class FeatureFlagService {
  private flags: FeatureFlags = {
    backend_enabled: false,
    kv_leaderboard: false,
    multiplayer: false,
    analytics_tracking: true,
    offline_mode: true
  };

  async load(env: { KV: KVNamespace }): Promise<void> {
    const stored = await env.KV.get("feature-flags", "json");
    if (stored) {
      this.flags = { ...this.flags, ...stored };
    }
  }

  isEnabled(feature: keyof FeatureFlags): boolean {
    return this.flags[feature] === true;
  }

  async enable(env: { KV: KVNamespace }, feature: keyof FeatureFlags): Promise<void> {
    this.flags[feature] = true;
    await env.KV.put("feature-flags", JSON.stringify(this.flags));
  }
}
```

**Usage in Frontend:**

```typescript
// src/main.ts
const flags = new FeatureFlagService();
await flags.load({ KV: env.KV });

if (flags.isEnabled("backend_enabled")) {
  // Use API for progression
  const api = new ProgressionAPI("/api");
  await api.recordGameResult(playerId, result);
} else {
  // Offline-only mode
  OfflineStorage.cachePlayerProgress(playerId, localProgress);
}
```

### 6.2 Rollout Strategy

**Phase 1: Dark Launch (0% traffic)**
- Deploy D1 schema + API functions
- Flags: `backend_enabled: false`
- Test with internal player IDs only
- Monitor: API latency, error rates

**Phase 2: Canary (5% traffic)**
- Enable for 5% of new players
- Flags: `backend_enabled: true` for specific IDs
- Monitor: Completion rate, error rate vs offline
- Duration: 48 hours

**Phase 3: Gradual Rollout (25% → 50% → 100%)**
- Increase traffic gradually
- Monitor metrics at each step
- Pause if error rate > 1%
- Full rollout after 7 days of stability

**Rollout Command:**
```bash
# Enable backend for all players
wrangler kv:key put --namespace-id=1b4e56b25c1442029c5eb3215f9ff636 \
  "feature-flags" '{"backend_enabled":true,"kv_leaderboard":true}'

# Verify
wrangler kv:key get --namespace-id=1b4e56b25c1442029c5eb3215f9ff636 \
  "feature-flags"
```

---

## 7. Testing Strategy

### 7.1 Unit Tests (Backend Functions)

```typescript
// tests/functions/game-result.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { unstable_dev } from "wrangler";

describe("/api/game-result", () => {
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev("functions/api/game-result.ts", {
      experimental: { disableExperimentalWarning: true },
    });
  });

  it("should create new player on first game", async () => {
    const response = await worker.fetch("/api/game-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId: "test-new-player",
        won: true,
        runsScored: 3,
        hitsRecorded: 5,
        homeRunsHit: 1
      })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.games_played).toBe(1);
    expect(data.wins).toBe(1);
  });

  it("should calculate XP correctly", async () => {
    // XP = 100 (base) + 50 (win) + 15 (3 runs) + 15 (5 hits) + 10 (1 HR)
    const expectedXP = 190;

    const response = await worker.fetch("/api/game-result", {
      method: "POST",
      body: JSON.stringify({
        playerId: "test-xp-calc",
        won: true,
        runsScored: 3,
        hitsRecorded: 5,
        homeRunsHit: 1
      })
    });

    const data = await response.json();
    expect(data.xp_gained).toBe(expectedXP);
  });

  it("should detect level ups", async () => {
    // Create player with 950 XP (near level up)
    await setupTestPlayer("test-levelup", { experience: 950 });

    // Add 100 XP -> should level up
    const response = await worker.fetch("/api/game-result", {
      method: "POST",
      body: JSON.stringify({
        playerId: "test-levelup",
        won: true,
        runsScored: 0,
        hitsRecorded: 0,
        homeRunsHit: 0
      })
    });

    const data = await response.json();
    expect(data.leveled_up).toBe(true);
    expect(data.current_level).toBe(2);
  });
});
```

### 7.2 Integration Tests

```bash
#!/bin/bash
# tests/integration/full-flow.sh

echo "Running full integration test..."

# Create unique test player
PLAYER_ID="test-$(date +%s)"

# Step 1: New player should have default stats
echo "Testing new player..."
RESPONSE=$(curl -s "https://5e1ebbdb.sandlot-sluggers.pages.dev/api/progress/$PLAYER_ID")
GAMES=$(echo "$RESPONSE" | jq '.gamesPlayed')

if [ "$GAMES" -ne 0 ]; then
  echo "❌ FAILED: New player should have 0 games"
  exit 1
fi
echo "✅ New player test passed"

# Step 2: Record first game
echo "Recording first game..."
RESPONSE=$(curl -s -X POST "https://5e1ebbdb.sandlot-sluggers.pages.dev/api/game-result" \
  -H "Content-Type: application/json" \
  -d "{\"playerId\":\"$PLAYER_ID\",\"won\":true,\"runsScored\":5,\"hitsRecorded\":8,\"homeRunsHit\":2}")

GAMES=$(echo "$RESPONSE" | jq '.games_played')
if [ "$GAMES" -ne 1 ]; then
  echo "❌ FAILED: Games played should be 1"
  exit 1
fi
echo "✅ First game test passed"

# Step 3: Verify persistence
echo "Verifying persistence..."
sleep 1
RESPONSE=$(curl -s "https://5e1ebbdb.sandlot-sluggers.pages.dev/api/progress/$PLAYER_ID")
WINS=$(echo "$RESPONSE" | jq '.wins')

if [ "$WINS" -ne 1 ]; then
  echo "❌ FAILED: Wins should persist"
  exit 1
fi
echo "✅ Persistence test passed"

echo "✅ All integration tests passed!"
```

### 7.3 Load Testing

```javascript
// tests/load/k6-script.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 50 },   // Spike to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // Less than 1% errors
  },
};

export default function () {
  const playerId = `load-test-${__VU}-${__ITER}`;

  // Test 1: Get progress
  let response = http.get(`https://5e1ebbdb.sandlot-sluggers.pages.dev/api/progress/${playerId}`);
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Post game result
  response = http.post(
    'https://5e1ebbdb.sandlot-sluggers.pages.dev/api/game-result',
    JSON.stringify({
      playerId,
      won: Math.random() > 0.5,
      runsScored: Math.floor(Math.random() * 10),
      hitsRecorded: Math.floor(Math.random() * 15),
      homeRunsHit: Math.floor(Math.random() * 3),
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response has games_played': (r) => JSON.parse(r.body).games_played >= 1,
  });

  sleep(2);
}
```

**Run Load Test:**
```bash
npm install -g k6
k6 run tests/load/k6-script.js
```

---

## 8. Success Metrics & Validation

### 8.1 Phase 1 Success Criteria (D1 Deployment)

**Must Pass (P0):**
- ✅ D1 schema applied without errors
- ✅ Can query `player_progress` table
- ✅ Indexes created successfully
- ✅ Pages Functions can connect to D1

**Should Pass (P1):**
- ⚠️ Query latency < 100ms (p95)
- ⚠️ No schema conflicts with existing data
- ⚠️ Backup procedure tested and works

**Nice to Have (P2):**
- ℹ️ D1 dashboard shows table metrics
- ℹ️ Can export data to JSON for backup

### 8.2 Phase 2 Success Criteria (API Validation)

**Must Pass (P0):**
- ✅ All 5 manual tests pass
- ✅ Automated test script passes
- ✅ Can create player, record game, retrieve progress
- ✅ CORS headers present for cross-origin requests

**Should Pass (P1):**
- ⚠️ API response time < 500ms (p95)
- ⚠️ Error rate < 1%
- ⚠️ XP calculation matches expected values
- ⚠️ Level-up detection works correctly

**Nice to Have (P2):**
- ℹ️ API handles 100 req/s without errors
- ℹ️ Graceful degradation on D1 timeout
- ℹ️ Detailed error messages in responses

### 8.3 Phase 3 Success Criteria (KV Cache)

**Must Pass (P0):**
- ✅ KV namespace accessible from Pages Functions
- ✅ Leaderboard endpoint returns valid JSON
- ✅ Cache TTL expires after configured time

**Should Pass (P1):**
- ⚠️ Cache hit rate > 80% after warmup
- ⚠️ KV read latency < 50ms (p95)
- ⚠️ D1 query count reduced by 5x

**Nice to Have (P2):**
- ℹ️ Cache warming on deploy
- ℹ️ Staggered cache expiry to prevent stampede
- ℹ️ Cache versioning for schema changes

### 8.4 Overall System Health

**Post-Deployment Validation (24 hours after each phase):**

```bash
# Check API health
curl https://5e1ebbdb.sandlot-sluggers.pages.dev/api/health

# Monitor error rate
# (Use Cloudflare Analytics dashboard)

# Check D1 database size
wrangler d1 info blaze-db

# Check KV usage
wrangler kv:namespace list

# Review logs for errors
wrangler pages deployment tail --project-name sandlot-sluggers
```

**Key Performance Indicators (KPIs):**
- API Uptime: > 99.9%
- Response Time (p95): < 500ms
- Error Rate: < 1%
- D1 Query Latency: < 100ms
- KV Cache Hit Rate: > 80%
- Player Data Loss: 0 (critical)

---

## 9. API Contracts

### 9.1 RESTful Endpoints

#### GET /api/progress/{playerId}

**Description:** Retrieve player progression data.

**Request:**
```http
GET /api/progress/abc123
Host: 5e1ebbdb.sandlot-sluggers.pages.dev
Accept: application/json
```

**Response (200 OK):**
```json
{
  "playerId": "abc123",
  "gamesPlayed": 15,
  "wins": 10,
  "losses": 5,
  "totalRuns": 75,
  "totalHits": 120,
  "totalHomeRuns": 8,
  "unlockedCharacters": ["rocket", "ace", "comet"],
  "unlockedStadiums": ["dusty_acres", "frostbite"],
  "currentLevel": 3,
  "experience": 2450
}
```

**Response (200 OK - New Player):**
```json
{
  "playerId": "new-player",
  "gamesPlayed": 0,
  "wins": 0,
  "losses": 0,
  "totalRuns": 0,
  "totalHits": 0,
  "totalHomeRuns": 0,
  "unlockedCharacters": [],
  "unlockedStadiums": [],
  "currentLevel": 1,
  "experience": 0
}
```

**Error Responses:**
- `400 Bad Request`: Invalid player ID format
- `500 Internal Server Error`: Database connection failed

---

#### POST /api/game-result

**Description:** Record completed game and update progression.

**Request:**
```http
POST /api/game-result
Host: 5e1ebbdb.sandlot-sluggers.pages.dev
Content-Type: application/json

{
  "playerId": "abc123",
  "won": true,
  "runsScored": 5,
  "hitsRecorded": 8,
  "homeRunsHit": 2
}
```

**Request Schema:**
```typescript
interface GameResultRequest {
  playerId: string;          // Required, alphanumeric
  won: boolean;              // Required
  runsScored: number;        // Required, >= 0
  hitsRecorded: number;      // Required, >= 0
  homeRunsHit: number;       // Required, >= 0
}
```

**Response (200 OK):**
```json
{
  "player_id": "abc123",
  "games_played": 16,
  "wins": 11,
  "losses": 5,
  "total_runs": 80,
  "total_hits": 128,
  "total_home_runs": 10,
  "current_level": 3,
  "experience": 2649,
  "unlocked_characters": ["rocket", "ace", "comet"],
  "unlocked_stadiums": ["dusty_acres", "frostbite"],
  "xp_gained": 199,
  "leveled_up": false
}
```

**XP Calculation:**
```typescript
const BASE_XP = 100;
const WIN_BONUS = 50;
const RUN_XP = 5;
const HIT_XP = 3;
const HR_XP = 10;

xpGained = BASE_XP
  + (won ? WIN_BONUS : 0)
  + (runsScored * RUN_XP)
  + (hitsRecorded * HIT_XP)
  + (homeRunsHit * HR_XP);
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `400 Bad Request`: Invalid data types (e.g., negative numbers)
- `500 Internal Server Error`: Database write failed

---

#### GET /api/leaderboard

**Description:** Retrieve top players by stat (cached in KV).

**Request:**
```http
GET /api/leaderboard?stat=wins&limit=100
Host: 5e1ebbdb.sandlot-sluggers.pages.dev
Accept: application/json
```

**Query Parameters:**
- `stat` (optional): Stat to rank by. Options: `wins`, `home_runs`, `total_runs`. Default: `wins`
- `limit` (optional): Number of results. Range: 1-1000. Default: `100`

**Response (200 OK):**
```json
{
  "data": [
    {
      "player_id": "top-player-1",
      "games_played": 500,
      "wins": 375,
      "current_level": 15,
      "total_home_runs": 150
    },
    ...
  ],
  "cached": true,
  "timestamp": 1699564800000
}
```

**Headers:**
- `X-Cache: HIT` (if served from KV)
- `X-Cache: MISS` (if queried from D1)

---

#### GET /api/health

**Description:** Health check endpoint for monitoring.

**Request:**
```http
GET /api/health
Host: 5e1ebbdb.sandlot-sluggers.pages.dev
```

**Response (200 OK - Healthy):**
```json
{
  "timestamp": 1699564800000,
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "latency": 45 },
    "kv": { "status": "healthy", "latency": 12 },
    "frontend": { "status": "healthy", "latency": 0 }
  }
}
```

**Response (503 Service Unavailable - Degraded):**
```json
{
  "timestamp": 1699564800000,
  "status": "degraded",
  "checks": {
    "database": {
      "status": "unhealthy",
      "latency": 0,
      "error": "Connection timeout"
    },
    "kv": { "status": "healthy", "latency": 15 },
    "frontend": { "status": "healthy", "latency": 0 }
  }
}
```

---

## 10. Next Steps & Recommendations

### 10.1 Immediate Actions (This Week)

1. **Fix Wrangler Dependency Issue:**
   ```bash
   cd /Users/AustinHumphrey/Sandlot-Sluggers
   npm install @cloudflare/workerd-darwin-arm64 --save-optional
   npm install
   ```

2. **Deploy D1 Schema:**
   ```bash
   wrangler d1 execute blaze-db --file=./schema.sql
   ```

3. **Run API Tests:**
   ```bash
   chmod +x scripts/test-api.sh
   ./scripts/test-api.sh
   ```

4. **Monitor First 24 Hours:**
   - Check Cloudflare Analytics dashboard
   - Review error logs
   - Measure API response times

### 10.2 Short-Term Enhancements (Next 2 Weeks)

1. **Implement KV Leaderboard Cache** (Phase 3)
2. **Add Automated Testing** (CI/CD pipeline)
3. **Create Monitoring Dashboard** (Grafana or Cloudflare Analytics)
4. **Document API with OpenAPI Spec**
5. **Optimize D1 Queries** (indexes, batch operations)

### 10.3 Long-Term Roadmap (Next 3 Months)

1. **Multiplayer Support** (Durable Objects - Phase 4)
2. **Cross-Platform Sync** (OAuth + player accounts)
3. **Advanced Analytics** (player behavior, A/B testing)
4. **Content Updates** (new characters, stadiums via API)
5. **Mobile App Packaging** (PWA to native app stores)

### 10.4 Technical Debt to Address

- [ ] Remove hardcoded API base URL (`/api`) - use environment variable
- [ ] Add request/response validation with Zod schemas
- [ ] Implement proper logging infrastructure (structured logs)
- [ ] Add rate limiting per player ID (prevent abuse)
- [ ] Create database migration system (version control for schema)
- [ ] Document offline sync conflict resolution strategy
- [ ] Add end-to-end tests with Playwright
- [ ] Set up automated backups for D1 database

---

## Appendix A: File Artifacts to Create

### A.1 Deployment Scripts

**File:** `/Users/AustinHumphrey/Sandlot-Sluggers/scripts/deploy-backend.sh`
```bash
#!/bin/bash
set -euo pipefail

echo "Deploying Sandlot Sluggers Backend..."

# Step 1: Verify environment
echo "Verifying environment..."
wrangler whoami || { echo "Not logged in to Cloudflare"; exit 1; }

# Step 2: Apply D1 schema
echo "Applying D1 schema..."
wrangler d1 execute blaze-db --file=./schema.sql

# Step 3: Build frontend
echo "Building frontend..."
npm run build

# Step 4: Deploy to Pages
echo "Deploying to Cloudflare Pages..."
npm run deploy

# Step 5: Verify health
echo "Verifying deployment..."
sleep 5
curl -f https://5e1ebbdb.sandlot-sluggers.pages.dev/api/health || {
  echo "Health check failed!";
  exit 1;
}

echo "✅ Deployment complete!"
```

### A.2 Monitoring Dashboard Config

**File:** `/Users/AustinHumphrey/Sandlot-Sluggers/monitoring/cloudflare-analytics.json`
```json
{
  "dashboard": "Sandlot Sluggers - Production Metrics",
  "widgets": [
    {
      "type": "timeseries",
      "title": "API Response Time (p95)",
      "query": "SELECT quantile(0.95)(duration) FROM analytics WHERE blob1 LIKE '%/api/%'"
    },
    {
      "type": "counter",
      "title": "Total Requests (24h)",
      "query": "SELECT count(*) FROM analytics WHERE timestamp > now() - interval '24 hours'"
    },
    {
      "type": "gauge",
      "title": "Error Rate (%)",
      "query": "SELECT (countIf(doubles[1] >= 400) / count(*)) * 100 FROM analytics"
    },
    {
      "type": "table",
      "title": "Top Endpoints (24h)",
      "query": "SELECT blob1 as endpoint, count(*) as requests FROM analytics GROUP BY endpoint ORDER BY requests DESC LIMIT 10"
    }
  ]
}
```

---

## Appendix B: Troubleshooting Guide

### B.1 Common Issues

#### Issue: "table not found" when calling API

**Symptoms:**
```json
{
  "error": "D1_ERROR: no such table: player_progress"
}
```

**Solution:**
```bash
# Verify D1 binding in wrangler.toml
cat wrangler.toml | grep -A 3 "d1_databases"

# Reapply schema
wrangler d1 execute blaze-db --file=./schema.sql

# Verify tables exist
wrangler d1 execute blaze-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

#### Issue: CORS errors in browser console

**Symptoms:**
```
Access to fetch at 'https://5e1ebbdb.sandlot-sluggers.pages.dev/api/game-result'
from origin 'https://example.com' has been blocked by CORS policy
```

**Solution:**
1. Check `/api/game-result.ts` has CORS headers:
   ```typescript
   headers: {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Methods": "POST, OPTIONS",
     "Access-Control-Allow-Headers": "Content-Type"
   }
   ```

2. Verify OPTIONS handler exists:
   ```typescript
   export const onRequestOptions: PagesFunction<Env> = async () => {
     return new Response(null, { status: 204, headers: { ... } });
   };
   ```

---

#### Issue: Wrangler command not found

**Solution:**
```bash
# Install globally
npm install -g wrangler

# Or use npx
npx wrangler d1 info blaze-db
```

---

#### Issue: High D1 query latency (>500ms)

**Solutions:**
1. **Add indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_player_id_fast ON player_progress(player_id);
   ```

2. **Enable KV caching** (Phase 3)

3. **Use batch queries:**
   ```typescript
   // Instead of N queries
   for (const playerId of playerIds) {
     await db.prepare("SELECT * FROM player_progress WHERE player_id = ?").bind(playerId).first();
   }

   // Use single query with IN clause
   await db.prepare(`
     SELECT * FROM player_progress
     WHERE player_id IN (${playerIds.map(() => '?').join(',')})
   `).bind(...playerIds).all();
   ```

---

## Appendix C: Database Schema Reference

### C.1 Current Schema (v1.0)

**Table: player_progress**
```sql
CREATE TABLE IF NOT EXISTS player_progress (
  player_id TEXT PRIMARY KEY,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  total_home_runs INTEGER DEFAULT 0,
  unlocked_characters TEXT DEFAULT '[]',
  unlocked_stadiums TEXT DEFAULT '[]',
  current_level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_player_level` on `current_level`
- `idx_player_wins` on `wins DESC`

**Table: leaderboard**
```sql
CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  player_name TEXT,
  stat_type TEXT NOT NULL,
  stat_value INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES player_progress(player_id)
);
```

**Index:**
- `idx_leaderboard_type_value` on `(stat_type, stat_value DESC)`

### C.2 Future Schema Migrations

**v1.1 (Planned):**
- Add `player_name TEXT` to `player_progress`
- Add `favorite_character TEXT` to `player_progress`
- Add `last_login TIMESTAMP` for activity tracking

**v1.2 (Planned):**
- Add `achievements` table for unlock tracking
- Add `daily_challenges` table
- Add `friend_connections` table for social features

---

## Document Metadata

**Author:** Staff Engineer (Claude)
**Reviewed By:** Austin Humphrey
**Last Updated:** 2025-11-06
**Version:** 1.0.0
**Classification:** Internal - Deployment Guide
**Related Documents:**
- `/Users/AustinHumphrey/Sandlot-Sluggers/README.md`
- `/Users/AustinHumphrey/Sandlot-Sluggers/schema.sql`
- `/Users/AustinHumphrey/Sandlot-Sluggers/wrangler.toml`

**Change Log:**
- 2025-11-06: Initial architecture document created
- 2025-11-06: Added comprehensive deployment sequences
- 2025-11-06: Documented all API contracts

---

**END OF DOCUMENT**
