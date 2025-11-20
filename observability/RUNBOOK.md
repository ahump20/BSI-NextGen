# BSI-NextGen Production Runbook

**Last Updated**: 2025-11-20
**Owner**: Platform Engineering Team

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Monitoring & Alerts](#monitoring--alerts)
3. [Common Procedures](#common-procedures)
4. [Incident Response](#incident-response)
5. [Deployment Procedures](#deployment-procedures)
6. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### Infrastructure

- **Platform**: Cloudflare Pages + Workers
- **Runtime**: V8 Engine with nodejs_compat
- **Domain**: www.blazesportsintel.com
- **CDN**: Cloudflare Edge Network (300+ locations)

### Key Components

```
┌─────────────────────────────────────────────────┐
│           Cloudflare Edge Network               │
│  ┌──────────────────────────────────────────┐  │
│  │        Next.js App (36 Functions)        │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │  API Routes                        │  │  │
│  │  │  - /api/sports/mlb/*               │  │  │
│  │  │  - /api/sports/nfl/*               │  │  │
│  │  │  - /api/sports/nba/*               │  │  │
│  │  │  - /api/sports/college-baseball/*  │  │  │
│  │  └────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────┐  │  │
│  │  │  Static Pages (30 routes)          │  │  │
│  │  │  - Homepage, Sport Pages, etc.     │  │  │
│  │  └────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────┘  │
│                      │                          │
│                      │ Analytics Engine         │
│                      ▼                          │
│  ┌──────────────────────────────────────────┐  │
│  │      Cloudflare Analytics Engine         │  │
│  │      (bsi_analytics dataset)             │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │  External APIs         │
         │  - SportsDataIO (NFL,  │
         │    NBA)                │
         │  - MLB Stats API       │
         │  - ESPN API            │
         └────────────────────────┘
```

### Data Flow

1. **User Request** → Cloudflare Edge (nearest PoP)
2. **Edge Worker** → Processes request with observability
3. **External API** → Fetches sports data (with circuit breaker)
4. **Transform** → Normalizes data to internal format
5. **Cache** → CDN caches response (30s-3600s depending on endpoint)
6. **Response** → Returns JSON with trace headers

---

## Monitoring & Alerts

### Dashboards

1. **Primary Dashboard**: https://dash.cloudflare.com/analytics/bsi-nextgen-web
   - Traffic overview
   - Error rates
   - Performance metrics
   - Geographic distribution

2. **API Health Dashboard**: https://dash.cloudflare.com/analytics/bsi-nextgen-web/api
   - Per-endpoint latency
   - Success/error rates
   - External API status

3. **SLO Dashboard**: (Custom - to be built)
   - SLO compliance tracking
   - Burn rate alerts
   - Error budget remaining

### Alert Thresholds

| Alert | Threshold | Severity | Action |
|-------|-----------|----------|--------|
| Error Rate > 5% | 5 minutes | Critical | Page on-call |
| P95 Latency > 2000ms | 10 minutes | Warning | Investigate |
| Circuit Breaker Open | Immediate | Warning | Check provider |
| Zero Traffic | 5 minutes | Critical | Page on-call |
| External API Failure Rate > 10% | 5 minutes | Warning | Enable fallback |

### Key Metrics

```sql
-- Query Analytics Engine via GraphQL

query {
  viewer {
    accounts(filter: {accountTag: "$ACCOUNT_ID"}) {
      analyticsEngine {
        # Error rate
        errorRate: query(
          dataset: "bsi_analytics"
          filter: {blobs: ["http.request.count"]}
          aggregation: SUM
        ) {
          rows { blobs doubles indexes }
        }

        # Latency percentiles
        latencyP95: query(
          dataset: "bsi_analytics"
          filter: {blobs: ["http.request.duration"]}
          aggregation: P95
        ) {
          rows { blobs doubles indexes }
        }

        # Circuit breaker events
        circuitBreakers: query(
          dataset: "bsi_analytics"
          filter: {blobs: ["circuit_breaker.state_change"]}
        ) {
          rows { blobs doubles indexes }
        }
      }
    }
  }
}
```

---

## Common Procedures

### Handling 5xx Errors

**When to Use**: Error rate exceeds 1% or persistent 5xx errors

**Steps**:

1. **Identify Scope**
   ```bash
   # Check if all endpoints affected or specific ones
   curl -I https://www.blazesportsintel.com/
   curl -I https://www.blazesportsintel.com/api/sports/mlb/teams
   curl -I https://www.blazesportsintel.com/api/sports/nfl/games
   ```

2. **Check Worker Logs**
   ```
   # Cloudflare Dashboard → Workers & Pages → bsi-nextgen-web → Logs
   # Filter: level:error | last 15m
   ```

3. **Identify Root Cause**
   - **External API down**: Circuit breaker should open automatically
   - **Code bug**: Look for stack traces in logs
   - **Resource exhaustion**: Check worker CPU time

4. **Mitigate**
   - **External API issue**: Verify circuit breaker is working; wait for auto-recovery
   - **Code bug**: Rollback to previous deployment
   - **Unknown**: Enable maintenance mode and investigate offline

5. **Verify Resolution**
   ```bash
   # Curl affected endpoints
   curl https://www.blazesportsintel.com/api/sports/mlb/games | jq '.'

   # Check error rate in dashboard
   # Should drop below 0.1% within 5 minutes
   ```

6. **Post-Incident**
   - Write postmortem in #incidents channel
   - Update runbook with lessons learned
   - Create Jira ticket for permanent fix

---

### Optimizing Latency

**When to Use**: P95 latency > 1500ms or user complaints about slow loads

**Steps**:

1. **Identify Slow Endpoints**
   ```
   # Cloudflare Analytics → Performance → Sort by p95
   # Look for endpoints with p95 > 1000ms
   ```

2. **Analyze Span Durations**
   ```
   # Check logs for span timing
   cf-worker:bsi-nextgen-web | "Span ended" | last 1h | sort by duration desc
   ```

3. **Common Causes & Fixes**

   **Slow External API**:
   ```typescript
   // Increase timeout
   const response = await fetch(url, {
     signal: AbortSignal.timeout(5000), // 5s timeout
   });

   // Add caching
   return NextResponse.json(data, {
     headers: {
       'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
     },
   });
   ```

   **Large Payloads**:
   ```typescript
   // Implement pagination
   const limit = parseInt(searchParams.get('limit') || '20');
   const offset = parseInt(searchParams.get('offset') || '0');

   // Remove unnecessary fields
   const trimmedData = games.map(({ id, homeTeam, awayTeam, score }) => ({
     id,
     homeTeam: { name: homeTeam.name, abbreviation: homeTeam.abbreviation },
     awayTeam: { name: awayTeam.name, abbreviation: awayTeam.abbreviation },
     score,
   }));
   ```

   **Cold Start Delays**:
   ```bash
   # Add warmup cron job in wrangler.toml
   [triggers]
   crons = ["*/5 * * * *"]  # Run every 5 minutes

   # Warmup function
   export async function scheduled(event: ScheduledEvent, env: Env) {
     await fetch('https://www.blazesportsintel.com/api/sports/mlb/teams');
     await fetch('https://www.blazesportsintel.com/api/sports/nfl/games');
   }
   ```

4. **Verify Improvement**
   ```bash
   # Benchmark before and after
   ab -n 1000 -c 10 https://www.blazesportsintel.com/api/sports/mlb/games

   # Check p95 in Analytics Dashboard
   # Target: <500ms for API calls, <2000ms for page loads
   ```

---

### Circuit Breaker Management

**When to Use**: Circuit breaker is stuck open or needs manual intervention

**Understanding States**:

- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Failing, requests rejected immediately (fail fast)
- **HALF_OPEN**: Testing recovery, limited requests allowed

**Check Circuit Breaker Status**:

```bash
# Query circuit breaker metrics
curl https://www.blazesportsintel.com/api/admin/circuit-breakers/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Example response:
{
  "sportsdata_io": {
    "state": "open",
    "failureCount": 15,
    "lastFailureTime": 1700483730000,
    "lastStateChange": 1700483730000
  },
  "mlb_stats_api": {
    "state": "closed",
    "failureCount": 0
  }
}
```

**Manual Reset** (Use with caution):

```bash
# Reset specific circuit
curl -X POST https://www.blazesportsintel.com/api/admin/circuit-breakers/reset \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "circuit": "sportsdata_io"
  }'

# Reset all circuits
curl -X POST https://www.blazesportsintel.com/api/admin/circuit-breakers/reset-all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**When to Reset**:

- ✅ External API status page shows resolved
- ✅ Manual curl tests succeed
- ✅ More than 10 minutes have passed since last failure
- ❌ DO NOT reset if provider still showing outage
- ❌ DO NOT reset repeatedly (indicates deeper issue)

**Auto-Recovery Timeline**:

1. Circuit opens after 5 consecutive failures
2. Waits 5 minutes (timeout period)
3. Enters HALF_OPEN state
4. Allows 3 test requests
5. If 3 succeed → CLOSED (normal operation)
6. If any fail → OPEN (wait another 5 minutes)

---

### Data Freshness Management

**When to Use**: Data is stale or users report outdated information

**Check Data Freshness**:

```bash
# Check all sports endpoints
for sport in mlb nfl nba college-baseball; do
  echo "=== $sport ==="
  curl -s "https://www.blazesportsintel.com/api/sports/$sport/games" | \
    jq -r '.meta.lastUpdated'
done

# Expected: Timestamps within last 5 minutes for live games
```

**Cache Purge** (Force Fresh Data):

```bash
# Purge specific endpoint
curl -X POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      "https://www.blazesportsintel.com/api/sports/mlb/games",
      "https://www.blazesportsintel.com/api/sports/mlb/standings"
    ]
  }'

# Purge all cache (use sparingly)
curl -X POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purge_everything": true}'
```

**Verify Cache Behavior**:

```bash
# Check cache headers
curl -I https://www.blazesportsintel.com/api/sports/mlb/games

# Look for:
# - cf-cache-status: HIT (cached) or MISS (fresh)
# - cache-control: public, s-maxage=300 (5 min CDN cache)
# - age: 45 (seconds since cached)
```

**Adjust Cache TTLs** (if needed):

```typescript
// In API route handler
return NextResponse.json(data, {
  headers: {
    // Browser cache: 30s, CDN cache: 5min, stale-while-revalidate: 10min
    'Cache-Control': 'public, max-age=30, s-maxage=300, stale-while-revalidate=600',
  },
});

// Guidelines:
// - Live game data: 30-60s
// - Standings: 5-10 minutes
// - Team rosters: 1 hour
// - Historical data: 24 hours
```

---

### Emergency Response

**When to Use**: Complete site outage or critical production issue

**Immediate Actions**:

1. **Acknowledge Incident**
   ```
   # Post in #incidents Slack channel
   "🚨 INCIDENT: BSI-NextGen site down. Investigating. ETA: 15 minutes"
   ```

2. **Check Cloudflare Status**
   - Visit: https://www.cloudflarestatus.com/
   - If Cloudflare outage: Wait and monitor

3. **Quick Health Check**
   ```bash
   # Test homepage
   curl -I https://www.blazesportsintel.com/
   # Expected: 200 OK

   # Test API
   curl https://www.blazesportsintel.com/api/sports/mlb/teams | jq '.meta'
   # Expected: JSON with meta.lastUpdated
   ```

4. **Check Recent Deployments**
   - Cloudflare Dashboard → Pages → bsi-nextgen-web → Deployments
   - If recent deployment failed or looks suspicious → Rollback

5. **Rollback Procedure**
   ```
   # Via Cloudflare Dashboard:
   1. Go to Workers & Pages → bsi-nextgen-web
   2. Click "View deployments"
   3. Find last known good deployment (check git commit)
   4. Click "..." → "Rollback to this deployment"
   5. Confirm rollback
   6. Wait 2-3 minutes for propagation
   ```

6. **Verify Resolution**
   ```bash
   # Test all critical endpoints
   curl -I https://www.blazesportsintel.com/
   curl https://www.blazesportsintel.com/api/sports/mlb/games | jq '.'
   curl https://www.blazesportsintel.com/api/sports/nfl/games | jq '.'
   ```

7. **Update Incident Channel**
   ```
   "✅ RESOLVED: Site rolled back to commit abc123. Monitoring for stability."
   ```

**Post-Incident**:

1. Write postmortem within 24 hours
2. Identify root cause
3. Create Jira tickets for preventive measures
4. Update runbook with lessons learned

---

## Deployment Procedures

### Standard Deployment

**Pre-Deployment Checklist**:

- [ ] All tests passing in CI
- [ ] PR approved by 1+ reviewers
- [ ] No active incidents
- [ ] Deployment window (avoid peak traffic hours)

**Deployment Steps**:

1. **Merge to Main**
   ```bash
   git checkout main
   git pull origin main
   git merge feature/your-branch
   git push origin main
   ```

2. **Automatic Deployment**
   - Cloudflare Pages auto-deploys on push to main
   - Monitor deployment: https://dash.cloudflare.com/pages/bsi-nextgen-web/deployments

3. **Verify Deployment**
   ```bash
   # Wait 2-3 minutes for propagation

   # Check deployment ID in response headers
   curl -I https://www.blazesportsintel.com/ | grep cf-ray

   # Test critical paths
   curl https://www.blazesportsintel.com/api/sports/mlb/games | jq '.meta'
   curl https://www.blazesportsintel.com/api/sports/nfl/games | jq '.meta'
   ```

4. **Monitor Metrics**
   - Watch error rate for 15 minutes
   - Check p95 latency
   - Look for anomalies in Analytics Dashboard

5. **Rollback if Issues**
   - Error rate spikes > 1%
   - P95 latency > 2000ms
   - User reports of errors

### Hotfix Deployment

**When to Use**: Critical bug in production requiring immediate fix

**Steps**:

1. **Create Hotfix Branch**
   ```bash
   git checkout -b hotfix/critical-bug
   # Make minimal changes
   git commit -m "fix: Critical bug description"
   git push origin hotfix/critical-bug
   ```

2. **Fast-Track Review**
   - Tag on-call engineer for immediate review
   - Skip non-critical checks if time-sensitive

3. **Deploy**
   - Merge to main
   - Monitor deployment closely

4. **Verify Fix**
   - Test affected functionality
   - Check error rate drops to normal

---

## Performance Optimization

### CDN Cache Optimization

**Review Cache Hit Rates**:

```
# Cloudflare Analytics → Caching → Cache Hit Rate
# Target: >80% cache hit rate
```

**Optimize Cache Headers**:

```typescript
// Aggressive caching for static data
'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable'

// Standard caching for dynamic data
'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'

// Minimal caching for real-time data
'Cache-Control': 'public, max-age=10, s-maxage=30, stale-while-revalidate=60'
```

### Worker Performance

**Reduce Worker CPU Time**:

```typescript
// ❌ Inefficient
const filtered = data.filter(item => item.active)
  .map(item => ({ id: item.id, name: item.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// ✅ Efficient
const filtered = [];
for (const item of data) {
  if (item.active) {
    filtered.push({ id: item.id, name: item.name });
  }
}
filtered.sort((a, b) => a.name < b.name ? -1 : 1);
```

### External API Optimization

**Parallel Requests**:

```typescript
// ✅ Parallel
const [mlbGames, nflGames, nbaGames] = await Promise.all([
  mlbAdapter.getGames({ date }),
  nflAdapter.getGames({ week }),
  nbaAdapter.getGames({ date }),
]);

// ❌ Sequential (slow)
const mlbGames = await mlbAdapter.getGames({ date });
const nflGames = await nflAdapter.getGames({ week });
const nbaGames = await nbaAdapter.getGames({ date });
```

---

## Reference

### Environment Variables

```bash
# Required
SPORTSDATAIO_API_KEY=<api-key>

# Optional
NEXT_PUBLIC_APP_URL=https://www.blazesportsintel.com
NODE_ENV=production
```

### Key URLs

- **Production**: https://www.blazesportsintel.com
- **Analytics Dashboard**: https://dash.cloudflare.com/analytics/bsi-nextgen-web
- **Deployment History**: https://dash.cloudflare.com/pages/bsi-nextgen-web/deployments
- **Status Page**: https://www.cloudflarestatus.com/

### Contact

- **On-Call**: PagerDuty
- **Team Slack**: #platform-engineering
- **Incidents**: #incidents

---

**End of Runbook**
