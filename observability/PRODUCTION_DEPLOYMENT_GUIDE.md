# BSI-NextGen Observability Production Deployment Guide

**Status**: Ready for Deployment
**Created**: 2025-11-20
**Platform**: Cloudflare Pages + Workers

---

## Overview

This guide walks through deploying comprehensive observability for BSI-NextGen production at `https://www.blazesportsintel.com/`.

**What We're Deploying**:
- ✅ Service Level Objectives (SLOs) for key user journeys
- ✅ OpenTelemetry instrumentation with structured logging
- ✅ Distributed tracing with correlation IDs
- ✅ Metrics recording to Cloudflare Analytics Engine
- ✅ Circuit breakers for external API resilience
- ✅ Debuggability card and operational runbook

---

## Prerequisites

### Required Access

- [x] Cloudflare account with Pages and Workers access
- [x] GitHub repository write access
- [x] Analytics Engine binding configured
- [x] Production environment variables set

### Required Environment Variables

```bash
# Cloudflare Dashboard → Workers & Pages → bsi-nextgen-web → Settings → Variables

SPORTSDATAIO_API_KEY=<your-api-key>
NEXT_PUBLIC_APP_URL=https://www.blazesportsintel.com
NODE_ENV=production
```

### Analytics Engine Setup

Verify Analytics Engine binding in `wrangler.toml`:

```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "bsi_analytics"
```

---

## Deployment Steps

### Step 1: Review Changes

**Files Added**:
```
observability/
├── slos/
│   ├── page-load-performance.yaml
│   ├── api-response-time.yaml
│   ├── data-freshness.yaml
│   └── external-api-reliability.yaml
├── helpers/
│   ├── telemetry.ts
│   ├── middleware.ts
│   └── circuit-breaker.ts
├── DEBUGGABILITY_CARD.md
├── RUNBOOK.md
└── PRODUCTION_DEPLOYMENT_GUIDE.md (this file)

packages/web/src/app/api/sports/[sport]/[endpoint]/
└── route-instrumented.ts  # Full observability implementation
```

**Files Modified**:
```
packages/web/wrangler.toml  # Analytics Engine binding
packages/web/package.json    # Dependencies (none added)
```

### Step 2: Test Locally

**Run Development Server**:
```bash
cd /Users/AustinHumphrey/BSI-NextGen/packages/web
pnpm dev
```

**Test API Endpoints**:
```bash
# Homepage
curl -I http://localhost:3000/

# MLB Games API
curl http://localhost:3000/api/sports/mlb/games | jq '.meta'

# Check for observability metadata
curl http://localhost:3000/api/sports/mlb/games | \
  jq '{requestId: .meta.requestId, traceId: .meta.traceId, lastUpdated: .meta.lastUpdated}'
```

**Expected Response**:
```json
{
  "games": [...],
  "meta": {
    "dataSource": "MLB Stats API",
    "lastUpdated": "2025-11-20T15:30:00.000Z",
    "timezone": "America/Chicago",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "traceId": "7f3e1c2a-5b4d-9e8f-3a2c-1d4e5f6a7b8c"
  }
}
```

### Step 3: Integrate Instrumentation

**Option A: Gradual Rollout (Recommended)**

Replace existing API route incrementally:

```bash
# Backup original route
cp packages/web/src/app/api/sports/[sport]/[endpoint]/route.ts \
   packages/web/src/app/api/sports/[sport]/[endpoint]/route.backup.ts

# Copy instrumented route
cp packages/web/src/app/api/sports/[sport]/[endpoint]/route-instrumented.ts \
   packages/web/src/app/api/sports/[sport]/[endpoint]/route.ts
```

**Option B: Feature Flag (Advanced)**

Deploy both routes and toggle via environment variable:

```typescript
// route.ts
const USE_INSTRUMENTATION = process.env.ENABLE_OBSERVABILITY === 'true';

export const GET = USE_INSTRUMENTATION
  ? instrumentedHandler
  : originalHandler;
```

### Step 4: Deploy to Production

**Via Git Push** (automatic deployment):

```bash
cd /Users/AustinHumphrey/BSI-NextGen

# Commit observability changes
git add observability/ packages/web/
git commit -m "feat: Add comprehensive observability with OpenTelemetry

- Add SLO definitions for page load, API response time, data freshness
- Implement structured logging with correlation IDs
- Add distributed tracing with OpenTelemetry
- Configure Cloudflare Analytics Engine metrics
- Add circuit breakers for external API resilience
- Create debuggability card and operational runbook

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

**Monitor Deployment**:

1. Go to Cloudflare Dashboard → Pages → bsi-nextgen-web
2. Click "View deployments"
3. Wait for "Success" status (usually 2-3 minutes)
4. Check deployment logs for errors

### Step 5: Verify Production Deployment

**Health Check**:

```bash
# Homepage with trace headers
curl -I https://www.blazesportsintel.com/ | grep -i "x-"

# Expected:
# x-request-id: 550e8400-e29b-41d4-a716-446655440000
# x-trace-id: 7f3e1c2a-5b4d-9e8f-3a2c-1d4e5f6a7b8c

# API endpoint with observability metadata
curl https://www.blazesportsintel.com/api/sports/mlb/teams | jq '.meta'

# Expected:
{
  "dataSource": "MLB Stats API",
  "lastUpdated": "2025-11-20T15:30:00.000Z",
  "timezone": "America/Chicago",
  "requestId": "...",
  "traceId": "..."
}
```

**Test Circuit Breaker**:

```bash
# Simulate external API failure by calling invalid endpoint
curl https://www.blazesportsintel.com/api/sports/mlb/invalid-endpoint

# Expected 404 with requestId and traceId
```

### Step 6: Configure Monitoring

**Cloudflare Analytics Engine Query**:

```bash
# Install Cloudflare CLI (if not already installed)
npm install -g wrangler

# Query recent requests
wrangler analytics query \
  --dataset bsi_analytics \
  --query "SELECT blobs[1] as metric, SUM(doubles[1]) as value FROM bsi_analytics WHERE blobs[1] = 'http.request.count' GROUP BY metric"
```

**Set Up Alerts** (via Cloudflare Dashboard):

1. Go to Analytics → Alerts
2. Create alert: "High Error Rate"
   - Metric: Error rate
   - Threshold: > 5%
   - Window: 5 minutes
   - Notification: Email/Slack/PagerDuty

3. Create alert: "High Latency"
   - Metric: P95 request duration
   - Threshold: > 2000ms
   - Window: 10 minutes

4. Create alert: "Circuit Breaker Open"
   - Metric: Custom (circuit_breaker.state_change)
   - Threshold: state = 'open'
   - Immediate notification

---

## Validation Checklist

After deployment, verify:

### Logging

- [ ] Logs appear in Cloudflare Workers Logs dashboard
- [ ] Logs are JSON-formatted with consistent structure
- [ ] Request ID appears in every log entry
- [ ] Error logs include stack traces

**Test**:
```bash
# Trigger an error and check logs
curl https://www.blazesportsintel.com/api/sports/invalid-sport/games

# Check Cloudflare Dashboard → Workers & Pages → Logs
# Filter: level:error | last 5m
```

### Tracing

- [ ] Trace ID appears in API responses
- [ ] Trace ID in response headers (x-trace-id)
- [ ] Parent-child span relationships logged

**Test**:
```bash
# Call API and extract trace ID
TRACE_ID=$(curl -s https://www.blazesportsintel.com/api/sports/mlb/games | jq -r '.meta.traceId')

# Search logs for that trace
# Cloudflare Dashboard → Logs → Filter: traceId:"$TRACE_ID"
```

### Metrics

- [ ] Metrics appear in Analytics Engine dataset
- [ ] Request count metrics recorded
- [ ] Latency histogram metrics recorded
- [ ] Error count metrics recorded

**Test**:
```bash
# Query Analytics Engine via GraphQL
curl -X POST https://api.cloudflare.com/client/v4/graphql \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { viewer { accounts(filter: {accountTag: \"YOUR_ACCOUNT_ID\"}) { analyticsEngine { query(dataset: \"bsi_analytics\", filter: {blobs: [\"http.request.count\"]}, limit: 10) { rows { blobs doubles indexes } } } } } }"
  }'
```

### Circuit Breakers

- [ ] Circuit breaker initializes correctly
- [ ] Circuit opens after repeated failures
- [ ] Circuit auto-recovers after timeout
- [ ] Circuit metrics recorded

**Test**:
```bash
# This requires simulating external API failure
# For now, verify circuit breaker code is deployed and doesn't error
curl https://www.blazesportsintel.com/api/sports/mlb/games | jq '.meta.requestId'
```

### Performance

- [ ] API response times < 500ms (p95)
- [ ] Page load times < 2s (p95)
- [ ] No increase in error rate post-deployment
- [ ] Cache hit rate > 80%

**Test**:
```bash
# Benchmark API performance
ab -n 100 -c 10 https://www.blazesportsintel.com/api/sports/mlb/games

# Check results:
# - Time per request: <500ms (mean)
# - Failed requests: 0
```

---

## Rollback Plan

If issues occur after deployment:

### Immediate Rollback

```bash
# Via Cloudflare Dashboard:
# 1. Go to Workers & Pages → bsi-nextgen-web
# 2. Click "View deployments"
# 3. Find last stable deployment (before observability changes)
# 4. Click "..." → "Rollback to this deployment"
# 5. Confirm and wait 2-3 minutes
```

### Partial Rollback

If only observability is causing issues:

```bash
# Restore original API route
git checkout HEAD~1 -- packages/web/src/app/api/sports/[sport]/[endpoint]/route.ts
git commit -m "revert: Temporarily disable observability"
git push origin main
```

### Emergency Disable

Set environment variable to disable observability:

```bash
# Cloudflare Dashboard → Workers & Pages → Settings → Variables
ENABLE_OBSERVABILITY=false
```

---

## Post-Deployment Tasks

### Week 1: Monitoring & Tuning

- [ ] Review error logs daily for unexpected issues
- [ ] Verify SLO compliance (page load, API latency, error rate)
- [ ] Adjust cache TTLs if needed
- [ ] Fine-tune circuit breaker thresholds

### Week 2: Dashboard Setup

- [ ] Create Grafana dashboard (or use Cloudflare Analytics)
- [ ] Set up Slack notifications for alerts
- [ ] Document common log queries in runbook
- [ ] Create on-call playbook

### Week 3: Optimization

- [ ] Review span durations to identify slow operations
- [ ] Optimize external API calls (parallel requests, caching)
- [ ] Reduce payload sizes where possible
- [ ] Implement request sampling for high-traffic endpoints

### Ongoing

- [ ] Weekly SLO review meetings
- [ ] Monthly observability health check
- [ ] Quarterly runbook updates
- [ ] Annual SLO target adjustments

---

## Troubleshooting

### Issue: Logs Not Appearing

**Symptoms**: No logs in Cloudflare Workers Logs dashboard

**Solution**:
```bash
# Verify console.log is not being stripped
# Check wrangler.toml:
[build]
command = "npm run build"
# Should NOT have: minify = true

# Manually test logging
curl https://www.blazesportsintel.com/api/sports/mlb/games

# Wait 1-2 minutes, then check dashboard
```

### Issue: Metrics Not Recording

**Symptoms**: Analytics Engine queries return empty results

**Solution**:
```bash
# Verify Analytics Engine binding
# Check wrangler.toml has:
[[analytics_engine_datasets]]
binding = "ANALYTICS"
dataset = "bsi_analytics"

# Verify binding is accessible in worker
# Add debug log in route.ts:
console.log('Analytics Engine available:', !!env?.ANALYTICS);
```

### Issue: High Latency After Deployment

**Symptoms**: API response times > 1000ms

**Solution**:
```bash
# Check if observability overhead is causing delays
# Review span durations in logs

# If telemetry.ts is slow:
# - Reduce log verbosity (debug → info)
# - Sample traces (only 10% of requests)
# - Batch metrics writes

# Adjust in route-instrumented.ts:
const SAMPLING_RATE = 0.1; // 10%
if (Math.random() < SAMPLING_RATE) {
  // Enable tracing
}
```

### Issue: Circuit Breaker Stuck Open

**Symptoms**: All requests fail with "Circuit breaker is OPEN"

**Solution**:
```bash
# Check if external API recovered
curl https://statsapi.mlb.com/api/v1/schedule

# If API is up, circuit should auto-recover in 5 minutes
# Check circuit breaker logs:
# Filter: "circuit_breaker" | last 30m

# Manual reset (use with caution):
# POST /api/admin/circuit-breakers/reset
# (Requires admin endpoint implementation)
```

---

## Success Metrics

### Observability KPIs

Track these metrics to measure observability success:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Mean Time to Detect (MTTD) | <5 minutes | - | 🟡 Pending |
| Mean Time to Resolve (MTTR) | <30 minutes | - | 🟡 Pending |
| SLO Compliance | >99.9% | - | 🟡 Pending |
| Error Budget Remaining | >10% | - | 🟡 Pending |
| Log Search Speed | <10 seconds | - | 🟡 Pending |
| Trace Coverage | >95% requests | - | 🟡 Pending |

### Business Impact

- Faster incident detection and resolution
- Improved user experience through proactive monitoring
- Reduced downtime via circuit breakers
- Data-driven performance optimization
- Clear accountability with SLOs

---

## Resources

### Documentation

- [Debuggability Card](/Users/AustinHumphrey/BSI-NextGen/observability/DEBUGGABILITY_CARD.md)
- [Operational Runbook](/Users/AustinHumphrey/BSI-NextGen/observability/RUNBOOK.md)
- [SLO Definitions](/Users/AustinHumphrey/BSI-NextGen/observability/slos/)

### External Links

- [Cloudflare Analytics Engine Docs](https://developers.cloudflare.com/analytics/analytics-engine/)
- [OpenTelemetry Specification](https://opentelemetry.io/docs/specs/otel/)
- [SRE Book - Monitoring Distributed Systems](https://sre.google/sre-book/monitoring-distributed-systems/)

### Contact

- **Owner**: Platform Engineering Team
- **On-Call**: PagerDuty
- **Slack**: #platform-engineering
- **Email**: platform@blazesportsintel.com

---

**Deployment Sign-Off**:

- [ ] Deployment tested in local environment
- [ ] All validation checks passed
- [ ] Monitoring and alerts configured
- [ ] Runbook reviewed and approved
- [ ] Team trained on new observability tools
- [ ] Rollback plan documented and tested

**Approved By**: _________________________
**Date**: _________________________

---

**End of Deployment Guide**
