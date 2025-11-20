# Debuggability Card: BSI-NextGen Production

**Service**: blazesportsintel.com
**Platform**: Cloudflare Pages + Workers
**Last Updated**: 2025-11-20
**Owner**: Platform Engineering

---

## How We'll Know It's Broken

### Primary Indicators

1. **High Error Rate Alert**
   - **Metric**: `http.request.errors > 5% over 5 minutes`
   - **Dashboard**: [Cloudflare Analytics - Errors](https://dash.cloudflare.com/analytics/bsi-nextgen-web/errors)
   - **User Impact**: Users see error messages or blank pages

2. **Elevated Response Time**
   - **Metric**: `http.request.duration p95 > 2000ms over 10 minutes`
   - **Dashboard**: [Cloudflare Analytics - Performance](https://dash.cloudflare.com/analytics/bsi-nextgen-web/performance)
   - **User Impact**: Slow page loads, degraded UX

3. **External API Failures**
   - **Metric**: `circuit_breaker.state = 'open'` for any provider
   - **Dashboard**: [External API Health](https://dash.cloudflare.com/analytics/bsi-nextgen-web/external-apis)
   - **User Impact**: Stale or missing sports data

4. **Zero Traffic**
   - **Metric**: `http.request.count = 0 over 5 minutes`
   - **Dashboard**: [Cloudflare Analytics - Traffic](https://dash.cloudflare.com/analytics/bsi-nextgen-web/traffic)
   - **User Impact**: Site completely down

### Key Metrics to Watch

| Metric | Normal | Warning | Critical |
|--------|--------|---------|----------|
| Error Rate | <0.1% | 0.1-1% | >1% |
| P95 Latency | <500ms | 500-1500ms | >1500ms |
| P99 Latency | <2000ms | 2000-4000ms | >4000ms |
| External API Success Rate | >99% | 95-99% | <95% |
| Circuit Breakers Open | 0 | 1 | 2+ |

---

## What to Check First

### 1. Check Cloudflare Analytics Dashboard

**URL**: `https://dash.cloudflare.com/analytics/bsi-nextgen-web`

**Quick Health Check**:
```bash
# Check homepage
curl -I https://www.blazesportsintel.com/

# Check API health
curl https://www.blazesportsintel.com/api/sports/mlb/teams | jq '.meta'

# Check specific sport endpoint
curl https://www.blazesportsintel.com/api/sports/nfl/games | jq '.'
```

**Expected Responses**:
- Homepage: `200 OK` with `x-trace-id` header
- API endpoints: `200 OK` with `meta.lastUpdated` timestamp
- Error responses include `requestId` for tracing

### 2. Check Worker Logs

**Query Recent Errors** (Cloudflare Dashboard):
```
cf-worker:bsi-nextgen-web | level:error | last 30m
```

**Common Log Patterns**:
```json
{
  "level": "error",
  "message": "Request error",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "endpoint": "/api/sports/mlb/games",
  "errorMessage": "API timeout",
  "timestamp": "2025-11-20T10:15:30.000Z"
}
```

### 3. Verify External API Status

**SportsDataIO**:
```bash
# Test NFL endpoint
curl -H "Ocp-Apim-Subscription-Key: $SPORTSDATAIO_API_KEY" \
  https://api.sportsdata.io/v3/nfl/scores/json/AreAnyGamesInProgress

# Test NBA endpoint
curl -H "Ocp-Apim-Subscription-Key: $SPORTSDATAIO_API_KEY" \
  https://api.sportsdata.io/v3/nba/scores/json/AreAnyGamesInProgress
```

**MLB Stats API**:
```bash
# Test schedule endpoint
curl https://statsapi.mlb.com/api/v1/schedule?sportId=1

# Test standings endpoint
curl https://statsapi.mlb.com/api/v1/standings?leagueId=103
```

**ESPN API**:
```bash
# Test NCAA Football
curl https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard

# Test College Baseball
curl https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard
```

### 4. Check Circuit Breaker Status

**View Circuit Breaker Stats**:
```bash
# Query Analytics Engine for circuit breaker events
# (Use Cloudflare GraphQL API)
curl -X POST https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { viewer { accounts(filter: {accountTag: \"$ACCOUNT_ID\"}) { analyticsEngine { query(dataset: \"bsi_analytics\", filter: {blobs: [\"circuit_breaker.state_change\"]}, limit: 100) { rows { blobs doubles indexes } } } } } }"
  }'
```

---

## Common Issues & Solutions

### Issue 1: High Error Rate (5xx Errors)

**Symptoms**:
- Users see "Internal Server Error" messages
- Error rate exceeds 1%
- Worker logs show repeated failures

**Investigation Steps**:
1. Check worker logs for stack traces:
   ```
   cf-worker:bsi-nextgen-web | level:error | last 1h
   ```

2. Identify failing endpoint:
   ```json
   {
     "endpoint": "/api/sports/mlb/games",
     "errorMessage": "TypeError: Cannot read property 'data' of undefined"
   }
   ```

3. Check if external API is down:
   ```bash
   curl -I https://statsapi.mlb.com/api/v1/schedule
   ```

**Solutions**:
- **External API down**: Circuit breaker should open automatically; verify fallback behavior
- **Code bug**: Rollback to previous deployment via Cloudflare Dashboard
- **Rate limiting**: Check API key quota and rate limits

**Runbook**: [Handling 5xx Errors](#handling-5xx-errors)

---

### Issue 2: Slow Response Times (High Latency)

**Symptoms**:
- P95 latency > 2000ms
- Users complain about slow page loads
- Timeouts on API requests

**Investigation Steps**:
1. Identify slow endpoints in Analytics:
   - Sort by `http.request.duration` descending
   - Look for endpoints with p95 > 1500ms

2. Check span duration in logs:
   ```json
   {
     "message": "Span ended: external_api_call",
     "duration": 5000,
     "span_name": "sportsdata_io.get_nfl_games"
   }
   ```

3. Verify cache hit rates:
   - Check `Cache-Control` headers on responses
   - Low cache hit rate indicates cache misses

**Solutions**:
- **Slow external API**: Increase timeout, implement caching
- **Cold start delays**: Pre-warm workers with cron job
- **Large response payloads**: Implement pagination, reduce payload size

**Runbook**: [Optimizing Latency](#optimizing-latency)

---

### Issue 3: External API Circuit Breaker Open

**Symptoms**:
- Circuit breaker state is `OPEN`
- Users see "Service temporarily unavailable" for specific sports
- Logs show "Circuit breaker is OPEN" errors

**Investigation Steps**:
1. Check which provider circuit is open:
   ```bash
   # Query circuit breaker metrics
   curl https://www.blazesportsintel.com/api/health/circuit-breakers
   ```

2. Verify provider API status:
   - SportsDataIO: https://status.sportsdata.io/
   - MLB Stats API: Manual curl test
   - ESPN API: Manual curl test

3. Check failure logs:
   ```
   cf-worker:bsi-nextgen-web | "circuit_breaker.failure" | last 30m
   ```

**Solutions**:
- **Provider outage**: Wait for circuit to enter `HALF_OPEN` after timeout (default: 5 minutes)
- **API key issue**: Verify API key is valid and has quota remaining
- **Manual reset**: Reset circuit breaker via admin API (use with caution)

**Manual Circuit Breaker Reset**:
```bash
# POST to admin endpoint (requires auth)
curl -X POST https://www.blazesportsintel.com/api/admin/circuit-breakers/reset \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"circuit": "sportsdata_io"}'
```

**Runbook**: [Circuit Breaker Management](#circuit-breaker-management)

---

### Issue 4: Stale Data

**Symptoms**:
- `meta.lastUpdated` timestamp is old (>10 minutes)
- Standings or scores don't match real-time data
- Users report outdated information

**Investigation Steps**:
1. Check data freshness in API response:
   ```bash
   curl https://www.blazesportsintel.com/api/sports/mlb/games | \
     jq '.meta.lastUpdated'
   ```

2. Compare with source data:
   ```bash
   # MLB Stats API
   curl https://statsapi.mlb.com/api/v1/schedule?sportId=1 | \
     jq '.dates[0].games[0].gameDate'
   ```

3. Check cache headers:
   ```bash
   curl -I https://www.blazesportsintel.com/api/sports/mlb/games | \
     grep -i cache-control
   ```

**Solutions**:
- **Cache stuck**: Purge Cloudflare cache for affected endpoints
- **Worker not updating**: Check cron job execution logs
- **External API delay**: Verify provider API is returning fresh data

**Cache Purge**:
```bash
# Purge specific endpoint via Cloudflare API
curl -X POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "files": [
      "https://www.blazesportsintel.com/api/sports/mlb/games",
      "https://www.blazesportsintel.com/api/sports/mlb/standings"
    ]
  }'
```

**Runbook**: [Data Freshness Management](#data-freshness-management)

---

### Issue 5: Complete Site Outage (Zero Traffic)

**Symptoms**:
- Homepage returns 521 (Web Server Down)
- All API endpoints timeout
- Zero traffic in Analytics dashboard

**Investigation Steps**:
1. Check Cloudflare Worker status:
   ```bash
   curl -I https://www.blazesportsintel.com/
   ```

2. Verify DNS resolution:
   ```bash
   dig www.blazesportsintel.com
   nslookup www.blazesportsintel.com
   ```

3. Check Cloudflare status page:
   - https://www.cloudflarestatus.com/

4. Review recent deployments:
   - Check Cloudflare Pages deployment history
   - Look for failed deployments

**Solutions**:
- **Bad deployment**: Rollback to last known good version
- **DNS issue**: Verify CNAME record points to `blazesportsintel.pages.dev`
- **Cloudflare outage**: Wait for resolution; check status page
- **Worker crash loop**: Review worker logs for startup errors

**Emergency Rollback**:
```bash
# Via Cloudflare Dashboard:
# 1. Go to Workers & Pages → bsi-nextgen-web
# 2. Click "View deployments"
# 3. Select last stable deployment
# 4. Click "Rollback to this deployment"
```

**Runbook**: [Emergency Response](#emergency-response)

---

## Relevant Log Queries

### Find Errors for Specific Request

**Cloudflare Workers Logs**:
```
cf-worker:bsi-nextgen-web | requestId:"550e8400-e29b-41d4-a716-446655440000"
```

### Find All Errors in Last Hour

```
cf-worker:bsi-nextgen-web | level:error | last 1h
```

### Find Slow Requests (>2s)

```
cf-worker:bsi-nextgen-web | duration:>2000 | last 30m
```

### Find Circuit Breaker Events

```
cf-worker:bsi-nextgen-web | "circuit_breaker" | last 1h
```

### Find Requests by Sport

```
cf-worker:bsi-nextgen-web | sport:"mlb" | last 1h
```

### Find External API Failures

```
cf-worker:bsi-nextgen-web | "external_api_call" AND level:error | last 1h
```

---

## Trace Analysis

### Normal Trace Pattern

A healthy request trace looks like:

```
http.request (200ms)
  ├── external_api_call: sportsdata_io (120ms)
  ├── data_transformation (15ms)
  └── json_serialization (5ms)
```

**Key Characteristics**:
- Total duration < 500ms
- External API calls < 200ms
- No errors in any span

### Anomaly Indicators

**High Latency**:
```
http.request (5000ms)  ← RED FLAG
  └── external_api_call: sportsdata_io (4800ms)  ← Slow API
```

**Errors**:
```
http.request (150ms)
  └── external_api_call: mlb_stats_api (100ms)
      └── error: "504 Gateway Timeout"  ← RED FLAG
```

**Circuit Breaker Triggered**:
```
http.request (10ms)
  └── error: "Circuit breaker is OPEN for sportsdata_io"  ← RED FLAG
```

---

## Dependencies

### Upstream Dependencies (We Depend On)

1. **SportsDataIO** (nfl, nba)
   - Impact: High - NFL/NBA data unavailable
   - Mitigation: Circuit breaker, 5-minute retry
   - Status: https://status.sportsdata.io/

2. **MLB Stats API** (mlb)
   - Impact: High - MLB data unavailable
   - Mitigation: Circuit breaker, caching
   - Status: Manual curl test

3. **ESPN API** (ncaa_football, college_baseball)
   - Impact: Medium - College sports unavailable
   - Mitigation: Circuit breaker, caching
   - Status: Manual curl test

4. **Cloudflare Workers**
   - Impact: Critical - Entire site down
   - Mitigation: None (platform dependency)
   - Status: https://www.cloudflarestatus.com/

### Downstream Dependencies (Depend On Us)

1. **Web Frontend** (blazesportsintel.com)
   - Impact: Users can't view sports data
   - SLA: 99.9% availability

2. **Mobile App** (future)
   - Impact: App shows errors or stale data
   - SLA: 99.5% availability

---

## Contact & Escalation

### On-Call

- **Primary**: Platform Engineering (PagerDuty)
- **Secondary**: Data Engineering (Slack: #data-alerts)

### Communication Channels

- **Incidents**: #incidents (Slack)
- **Status Updates**: #engineering (Slack)
- **User Reports**: support@blazesportsintel.com

### Escalation Policy

1. **Severity 1** (Site Down): Page on-call immediately
2. **Severity 2** (Degraded Performance): Alert in #incidents
3. **Severity 3** (Minor Issues): Create Jira ticket

---

## Additional Resources

- **Runbook**: [observability/RUNBOOK.md](/Users/AustinHumphrey/BSI-NextGen/observability/RUNBOOK.md)
- **SLOs**: [observability/slos/](/Users/AustinHumphrey/BSI-NextGen/observability/slos/)
- **Monitoring Dashboard**: https://dash.cloudflare.com/analytics/bsi-nextgen-web
- **Deployment History**: https://dash.cloudflare.com/pages/bsi-nextgen-web/deployments
