# BSI-NextGen Observability Quick Start

**For**: Engineers deploying or debugging BSI-NextGen production
**Time to Read**: 5 minutes

---

## TL;DR

Comprehensive observability is now available for `https://www.blazesportsintel.com/`:

- ✅ **SLOs**: 4 measurable service level objectives
- ✅ **Logging**: Structured JSON logs with correlation IDs
- ✅ **Tracing**: Distributed traces with OpenTelemetry
- ✅ **Metrics**: Real-time metrics via Cloudflare Analytics Engine
- ✅ **Circuit Breakers**: Automatic failure protection for external APIs

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Production Site** | https://www.blazesportsintel.com/ |
| **Analytics Dashboard** | https://dash.cloudflare.com/analytics/bsi-nextgen-web |
| **Deployment History** | https://dash.cloudflare.com/pages/bsi-nextgen-web/deployments |
| **Cloudflare Status** | https://www.cloudflarestatus.com/ |

---

## Common Tasks

### Check if Site is Healthy

```bash
# Homepage
curl -I https://www.blazesportsintel.com/
# Expected: 200 OK with x-request-id header

# API endpoint
curl https://www.blazesportsintel.com/api/sports/mlb/games | jq '.meta'
# Expected: JSON with requestId, traceId, lastUpdated
```

### Find Error Logs

**Cloudflare Dashboard** → Workers & Pages → bsi-nextgen-web → Logs

```
# Search query
level:error | last 1h
```

### Trace a Specific Request

```bash
# Get trace ID from response
TRACE_ID=$(curl -s https://www.blazesportsintel.com/api/sports/mlb/games | jq -r '.meta.traceId')

# Search logs for that trace
# Cloudflare Dashboard → Logs → Filter: traceId:"$TRACE_ID"
```

### Check Circuit Breaker Status

```
# Cloudflare Dashboard → Analytics → Custom query
# Filter: blobs = "circuit_breaker.state_change"
# Last 1 hour
```

### Rollback Deployment

**Cloudflare Dashboard**:
1. Workers & Pages → bsi-nextgen-web
2. View deployments
3. Find last stable deployment
4. Click "..." → Rollback

---

## SLO Targets (Quick Reference)

| Metric | Target | Threshold |
|--------|--------|-----------|
| Page Load (P95) | <2s | ⚠️ >2s, 🔴 >4s |
| API Latency (P99) | <200ms | ⚠️ >500ms, 🔴 >2000ms |
| Error Rate | <0.1% | ⚠️ >1%, 🔴 >5% |
| Data Freshness (Live) | <30s | ⚠️ >60s, 🔴 >300s |
| Circuit Breaker Trips | <5/day | ⚠️ 5-10, 🔴 >10 |

---

## Emergency Response (30 seconds)

**Site Down?**

1. Check Cloudflare status: https://www.cloudflarestatus.com/
2. Test API: `curl -I https://www.blazesportsintel.com/api/sports/mlb/games`
3. Check recent deployments: Cloudflare Dashboard → Deployments
4. If bad deploy: Rollback (see above)
5. If Cloudflare outage: Wait and monitor
6. Otherwise: Page on-call engineer

---

## Key Files

```
observability/
├── slos/                           # SLO definitions (YAML)
├── helpers/
│   ├── telemetry.ts               # Logging, metrics, tracing
│   ├── middleware.ts              # Request wrapper
│   └── circuit-breaker.ts         # Failure protection
├── DEBUGGABILITY_CARD.md          # Incident response (START HERE)
├── RUNBOOK.md                      # Operational procedures
├── PRODUCTION_DEPLOYMENT_GUIDE.md # Deployment steps
└── IMPLEMENTATION_SUMMARY.md      # Technical overview
```

---

## When Things Break

### High Error Rate (5xx)

**Runbook**: [DEBUGGABILITY_CARD.md](/Users/AustinHumphrey/BSI-NextGen/observability/DEBUGGABILITY_CARD.md#issue-1-high-error-rate-5xx-errors)

```bash
# Check logs
cf-worker:bsi-nextgen-web | level:error | last 15m

# Check external APIs
curl https://statsapi.mlb.com/api/v1/schedule
curl -H "Ocp-Apim-Subscription-Key: $KEY" https://api.sportsdata.io/v3/nfl/scores/json/AreAnyGamesInProgress
```

### Slow Response Times

**Runbook**: [DEBUGGABILITY_CARD.md](/Users/AustinHumphrey/BSI-NextGen/observability/DEBUGGABILITY_CARD.md#issue-2-slow-response-times-high-latency)

```bash
# Check span durations in logs
cf-worker:bsi-nextgen-web | "Span ended" | last 1h | sort by duration desc

# Benchmark
ab -n 100 -c 10 https://www.blazesportsintel.com/api/sports/mlb/games
```

### Circuit Breaker Stuck Open

**Runbook**: [DEBUGGABILITY_CARD.md](/Users/AustinHumphrey/BSI-NextGen/observability/DEBUGGABILITY_CARD.md#issue-3-external-api-circuit-breaker-open)

```bash
# Check provider status
curl https://statsapi.mlb.com/api/v1/schedule  # MLB
curl https://status.sportsdata.io/             # SportsDataIO

# Circuit auto-recovers in 5 minutes if provider is healthy
```

### Stale Data

**Runbook**: [DEBUGGABILITY_CARD.md](/Users/AustinHumphrey/BSI-NextGen/observability/DEBUGGABILITY_CARD.md#issue-4-stale-data)

```bash
# Check freshness
curl https://www.blazesportsintel.com/api/sports/mlb/games | jq '.meta.lastUpdated'

# Purge cache
curl -X POST https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -d '{"files": ["https://www.blazesportsintel.com/api/sports/mlb/games"]}'
```

---

## Monitoring Queries

### Error Rate (Last 1 Hour)

**Cloudflare Analytics**:
```
# Requests by status code
SELECT statusCode, COUNT(*) as count
FROM requests
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY statusCode
ORDER BY count DESC
```

### P95 Latency by Endpoint

```
# Top 10 slowest endpoints
SELECT endpoint, APPROX_QUANTILE(duration, 0.95) as p95
FROM requests
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY endpoint
ORDER BY p95 DESC
LIMIT 10
```

### Circuit Breaker Events

```
# State changes in last 24 hours
SELECT circuit, state, COUNT(*) as count
FROM analytics_engine.bsi_analytics
WHERE blob = 'circuit_breaker.state_change'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY circuit, state
```

---

## Deployment Checklist

Before deploying:

- [ ] All tests pass
- [ ] PR approved
- [ ] No active incidents
- [ ] Off-peak hours

After deploying:

- [ ] Wait 2-3 minutes for propagation
- [ ] Curl test critical endpoints
- [ ] Monitor error rate for 15 minutes
- [ ] Check p95 latency in Analytics
- [ ] Verify no SLO violations

If issues:

- [ ] Rollback immediately
- [ ] Post in #incidents
- [ ] File postmortem

---

## Contact

- **Emergency**: PagerDuty
- **Questions**: #platform-engineering (Slack)
- **Incidents**: #incidents (Slack)

---

## Learn More

1. **New to Observability?** Read: [IMPLEMENTATION_SUMMARY.md](/Users/AustinHumphrey/BSI-NextGen/observability/IMPLEMENTATION_SUMMARY.md)
2. **Deploying?** Read: [PRODUCTION_DEPLOYMENT_GUIDE.md](/Users/AustinHumphrey/BSI-NextGen/observability/PRODUCTION_DEPLOYMENT_GUIDE.md)
3. **On-Call?** Read: [DEBUGGABILITY_CARD.md](/Users/AustinHumphrey/BSI-NextGen/observability/DEBUGGABILITY_CARD.md)
4. **Operations?** Read: [RUNBOOK.md](/Users/AustinHumphrey/BSI-NextGen/observability/RUNBOOK.md)

---

**Quick Start Version**: 1.0.0
**Last Updated**: 2025-11-20
