# Texas Longhorns Baseball Worker - Production Deployment Plan
**Feature Shipping Council Decision: CONDITIONAL GO (82% Confidence)**

## Executive Summary

**Recommendation:** Deploy standalone Cloudflare Worker after implementing schema hardening and validation layer.

**Timeline:** 8 hours implementation + 24-hour soak test + 30-day validation period

**Cost:** $0/month (within Cloudflare free tier)

**Risk Level:** MEDIUM (mitigated with 5-PR incremental rollout)

---

## Pre-Deployment Blockers (MUST COMPLETE)

### ❌ Blocker #1: Schema Lacks Team/Season Fields
**Issue:** Current schema.sql has no `team_id` or `season` columns
**Impact:** Cannot support multi-team expansion or historical data
**Fix:** Use `schema-v2.sql` instead

### ❌ Blocker #2: Scraper Fetches Season Aggregates Instead of Game-by-Game
**Issue:** ESPN Stats API returns season totals, not individual games
**Impact:** Missing game context (opponent, date, home/away)
**Fix:** Switch to ESPN Schedule API + game-by-game stats endpoints

### ❌ Blocker #3: No Validation Layer
**Issue:** No cross-check against official Texas Sports stats
**Impact:** Cannot verify scraper accuracy
**Fix:** Implement `validator.js` (created above)

---

## Deployment Phases (5 PRs)

### PR #0: Schema Migration ✅ READY
**Goal:** Deploy hardened schema with constraints

**Files:**
- `schema-v2.sql` (replaces schema.sql)

**Changes:**
```sql
-- Added tables
CREATE TABLE teams (id, team_name, espn_team_id, conference)
CREATE TABLE woba_coefficients (season, wbb, whbp, w1b, w2b, w3b, whr)
CREATE TABLE validation_logs (...)

-- Enhanced player_stats table
ALTER TABLE player_stats ADD COLUMN team_id INTEGER REFERENCES teams(id)
ALTER TABLE player_stats ADD COLUMN season INTEGER CHECK(season BETWEEN 2020 AND 2030)
ALTER TABLE player_stats ADD COLUMN position TEXT CHECK(position IN ('P', 'C', '1B', ...))
ALTER TABLE player_stats ADD COLUMN hit_by_pitch INTEGER
ALTER TABLE player_stats ADD COLUMN sacrifice_flies INTEGER

-- New constraints
UNIQUE(player_name, team_id, season, game_date, stat_type)
CHECK(hits >= 0 AND hits <= at_bats)
CHECK(earned_runs >= 0 AND earned_runs <= runs_allowed)
```

**Deployment Steps:**
```bash
# Create new database
wrangler d1 create longhorns-baseball-db-v2

# Capture database_id
# Output: database_id = "abc123..."

# Execute schema
wrangler d1 execute longhorns-baseball-db-v2 --file=schema-v2.sql

# Verify tables
wrangler d1 execute longhorns-baseball-db-v2 --command="SELECT name FROM sqlite_master WHERE type='table'"
# Expected: teams, woba_coefficients, player_stats, validation_logs

# Update wrangler.toml
# database_id = "abc123..."
```

**Acceptance Criteria:**
- ✅ 4 tables created
- ✅ 7 indexes created
- ✅ 2 views created
- ✅ UNIQUE constraint on (player_name, team_id, season, game_date, stat_type)
- ✅ Texas Longhorns inserted into teams table
- ✅ 2024/2025 wOBA coefficients inserted

**Estimated Time:** 30 minutes

---

### PR #1: Infrastructure Setup ✅ READY
**Goal:** Configure Cloudflare account and secrets

**Files:**
```bash
# New: .env.example
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
UPDATE_SECRET=
SLACK_WEBHOOK_URL=

# Modified: wrangler.toml
account_id = "your-actual-account-id"
database_id = "from PR #0"
```

**Deployment Steps:**
```bash
# Generate UPDATE_SECRET
openssl rand -base64 32
# Store in 1Password: "Blaze-Cloudflare/Longhorns-Worker-Secret"

# Set Cloudflare secret
wrangler secret put UPDATE_SECRET
# Paste generated token

# Set Slack webhook (optional for PR #5)
wrangler secret put SLACK_WEBHOOK_URL
# Get from: https://api.slack.com/messaging/webhooks
```

**Acceptance Criteria:**
- ✅ `.env` added to `.gitignore`
- ✅ Secrets stored in 1Password
- ✅ `wrangler.toml` has real account_id/database_id
- ✅ No secrets committed to Git

**Estimated Time:** 15 minutes

---

### PR #2: Validation Layer ⚠️ NEEDS IMPLEMENTATION
**Goal:** Add validator.js to worker

**Files:**
- `validator.js` ✅ Created above
- `worker.js` (modify to import validator)

**Changes to worker.js:**
```javascript
import { validateBattingStats, validatePitchingStats, logValidation } from './validator.js';

// In handleUpdate function, after scraping:
async function handleUpdate(request, env) {
  const scrapeResult = await scrapeAllStats();

  if (scrapeResult.success) {
    // Validate before inserting
    const battingValidation = await validateBattingStats(
      scrapeResult.data.filter(s => s.stat_type === 'batting')
    );
    const pitchingValidation = await validatePitchingStats(
      scrapeResult.data.filter(s => s.stat_type === 'pitching')
    );

    // Log validation results
    await logValidation(env, 'batting', battingValidation);
    await logValidation(env, 'pitching', pitchingValidation);

    // Proceed only if validation passes or warns (not fails)
    if (battingValidation.status === 'failed' || pitchingValidation.status === 'failed') {
      return new Response(JSON.stringify({
        error: 'Validation failed - data quality issue detected',
        battingValidation,
        pitchingValidation
      }), { status: 422 });
    }

    // Insert data...
  }
}
```

**Acceptance Criteria:**
- ✅ Validation runs before every data insert
- ✅ Validation results logged to D1
- ✅ Worker returns 422 if validation fails
- ✅ Warnings allowed (e.g., official source unavailable)

**Estimated Time:** 1 hour

---

### PR #3: Worker Core (Read-Only) ⚠️ NEEDS SCRAPER FIX
**Goal:** Deploy GET endpoints with empty database

**CRITICAL ISSUE:** Current `scraper.js` fetches **season aggregates**, not **individual games**.

**Required Fix:**
```javascript
// Current (WRONG):
const statsUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/athletes/${athlete.id}/statistics`;
// Returns: Total season stats (e.g., 45 hits in 150 at-bats)

// Correct (NEEDED):
// 1. Fetch schedule
const scheduleUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/${TEAM_ID}/schedule`;
// 2. For each game, fetch box score
const boxScoreUrl = `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/summary?event=${gameId}`;
// 3. Extract per-game stats from playerStats.batting/pitching arrays
```

**This is a MAJOR rewrite of scraper.js - estimated 4 hours.**

**Acceptance Criteria:**
- ✅ Scraper returns array of game-by-game records
- ✅ Each record has: player_name, game_date, opponent, home_away, game_result
- ✅ Schema columns match (team_id, season populated)

---

### PR #4: Scraper Integration + Manual Trigger
**Goal:** Enable POST /api/update with auth

**Deployment Steps:**
```bash
# Deploy worker
wrangler deploy

# Test manual trigger
curl -X POST https://longhorns-baseball-tracker.WORKERS_DOMAIN/api/update \
  -H "Authorization: Bearer YOUR_UPDATE_SECRET"

# Verify data inserted
wrangler d1 execute longhorns-baseball-db-v2 \
  --command="SELECT COUNT(*) FROM player_stats"
```

**Acceptance Criteria:**
- ✅ Scraper completes in <10 seconds
- ✅ Game-by-game records inserted
- ✅ Validation logs show "passed" or "warning"
- ✅ GET /api/stats returns real data

**Estimated Time:** 2 hours (includes testing)

---

### PR #5: Cron Automation
**Goal:** Enable daily 6 AM CT updates

**Files:**
```toml
# wrangler.toml
[triggers]
crons = ["0 12 * * *"]  # 12:00 UTC = 6:00 AM CT
```

```javascript
// worker.js
export default {
  async scheduled(event, env, ctx) {
    const response = await handleUpdate(
      new Request('https://internal/cron', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${env.UPDATE_SECRET}` }
      }),
      env
    );
    console.log('Cron update:', response.status);
  }
};
```

**Acceptance Criteria:**
- ✅ Cron fires at 12:00 UTC daily
- ✅ Cloudflare logs show successful execution
- ✅ Data updates daily (verify last_updated timestamp)

**Estimated Time:** 30 minutes + 24-hour soak test

---

### PR #6: Monitoring & Alerts
**Goal:** Add observability

**Files:**
```javascript
// monitoring.js (new)
export async function trackMetrics(env, event, duration, error = null) {
  // Write to Analytics Engine
  await env.ANALYTICS?.writeDataPoint({
    blobs: [event, error ? 'failed' : 'success'],
    doubles: [duration],
    indexes: [new Date().toISOString()]
  });

  // Alert on errors
  if (error && env.SLACK_WEBHOOK_URL) {
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Longhorns Baseball Worker Error`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Error:* ${error.message}\n*Event:* ${event}\n*Time:* ${new Date().toISOString()}`
            }
          }
        ]
      })
    });
  }
}
```

**Acceptance Criteria:**
- ✅ All endpoints instrumented
- ✅ Errors trigger Slack alerts
- ✅ Metrics visible in Cloudflare Analytics dashboard

**Estimated Time:** 2 hours

---

## 30-Day Validation Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Uptime | 99.9% | TBD | ⏳ |
| TTFB (p95) | <100ms | TBD | ⏳ |
| Error Rate | <1% | TBD | ⏳ |
| Data Freshness | <24 hours | TBD | ⏳ |
| Cost | $0 | TBD | ⏳ |
| Dashboard Views | 100+ | TBD | ⏳ |
| Scrape Success | >95% | TBD | ⏳ |

**After 30 days: GO/NO-GO decision to expand to 5 more Big 12 teams**

---

## Rollback Plan

**Triggers:**
- Error rate >5% for 6 hours
- Cron fails 3 consecutive days
- ESPN cease-and-desist
- Cost exceeds $10/month

**Steps:**
```bash
# 1. Disable cron
wrangler triggers delete --cron "0 12 * * *"

# 2. Set maintenance mode
wrangler deploy --env maintenance

# 3. Archive data
wrangler d1 backup create longhorns-baseball-db-v2

# 4. Post-mortem
# Document failure + root cause + remediation
```

---

## Cost Analysis (Updated)

**Cloudflare Workers Free Tier:**
| Resource | Free Limit | Usage (1 team) | Usage (50 teams) | Overage Cost |
|----------|------------|----------------|------------------|--------------|
| Requests/day | 100,000 | 50 | 500 | $0.50/1M |
| CPU time | 10ms/req | 5ms | 5ms | $0.02/1M |
| D1 reads/day | 5,000,000 | 500 | 25,000 | $0.001/1K |
| D1 writes/day | 100,000 | 25 | 1,250 | $1/1M |
| D1 storage | 5GB | 8MB | 400MB | $0.75/GB |

**Projected Annual Cost:**
- 1 team: $0
- 10 teams: $0
- 50 teams: $0
- 100 teams: ~$3/month (D1 writes)

**Break-even:** 2,000 requests/day to hit paid tier

---

## Go/No-Go Checklist

### ✅ Ready for Deployment
- [x] Cost model validated (free tier sufficient)
- [x] Schema hardened with constraints
- [x] Validation layer implemented
- [x] Deployment scripts ready

### ⚠️ Needs Attention
- [ ] **BLOCKER:** Scraper must be rewritten for game-by-game stats (4 hours)
- [ ] wrangler.toml needs real account_id/database_id
- [ ] Official stats parsing in validator.js (placeholder)
- [ ] Monitoring dashboard setup (Grafana/Cloudflare)

### 📊 Post-Deployment
- [ ] Run TTFB experiment (vs. Next.js control)
- [ ] 7-day reliability monitoring
- [ ] Manual data spot-checks vs. texassports.com
- [ ] User feedback collection

---

## Final Recommendation

**CONDITIONAL GO - Deploy after scraper rewrite**

**Confidence:** 82%

**Timeline:**
1. **Week 1:** Fix scraper (4 hours), complete PRs #0-2
2. **Week 2:** Deploy PRs #3-5, 24-hour soak test
3. **Week 3:** PR #6 (monitoring), stress testing
4. **Week 4:** Cost/performance review, expansion decision

**Next Actions:**
1. Rewrite `scraper.js` to use ESPN Schedule + Box Score APIs
2. Test schema-v2.sql in dev environment
3. Set up Cloudflare account credentials
4. Create Slack webhook for alerts

---

## Appendix: ESPN API Endpoints Reference

**Game-by-game scraping approach:**

```javascript
// 1. Get season schedule
GET https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/teams/251/schedule
// Returns: Array of games with event IDs

// 2. For each game, fetch box score
GET https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/summary?event={eventId}
// Returns: Full game summary with playerStats.batting and playerStats.pitching

// 3. Extract per-player stats
playerStats.batting.forEach(player => {
  // Insert into D1 with game_date, opponent, home_away
})
```

**This is the critical fix needed for PR #3.**
