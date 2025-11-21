# Observability Dashboards & Alerting

**Scope:** BlazeSportsIntel.com (Next.js edge APIs, Workers, and client interactions)
**Data Sources:** Cloudflare Analytics Engine, D1 monitoring logs, in-process dashboard buffers (see `/api/observability/dashboard`).

## Key Dashboards

| Signal | Data Source | How to View | Notes |
| --- | --- | --- | --- |
| Cache Hit Rate | Cloudflare KV cache metrics + `/api/observability/dashboard` | Cloudflare Analytics chart (query `worker.cache.hit`) and dashboard API JSON | Tracks KV hits/misses for Workers and API routes. |
| Latency (p50/p95) | `/api/observability/dashboard` | Grafana/Looker studio from API JSON feed | Uses per-request spans emitted by `withApiObservability` and Worker middleware. |
| Error Budgets | `/api/observability/dashboard` + Analytics Engine events | Dashboard JSON (`errorBudget`) and Analytics Engine indexes | Breaches recorded when status >=500 or duration >1s. |
| Core Web Vitals | `/api/observability/vitals` + Analytics Engine | Dashboard JSON (`coreWebVitals`) | Front-end sends CLS, INP, LCP, FCP, TTFB via `reportWebVitals`. |

### Cloudflare Queries (examples)
- **Cache hit rate:** `SELECT AVG(value) FROM METRICS WHERE name = 'worker.cache.hit' GROUP BY route`
- **Latency percentiles:** `SELECT APPROX_PERCENTILE(value, 0.95) FROM METRICS WHERE name = 'worker.request.duration' GROUP BY route`
- **Error budget burn:** `SELECT COUNT(*) FROM METRICS WHERE name = 'error_budget.breach' AND timestamp > NOW() - INTERVAL '1 hour'`

## Alerting Rules
- **Data Freshness > 90s:** Fires `alert.data-freshness` from Workers and `/api/status` responses. Route to PagerDuty/Slack.
- **Auth Failures:** `alert.auth-failures` emits when 401/403 detected in API wrappers.
- **Upstream Provider Errors >=10%:** `alert.upstream-errors` emitted from Workers and Analytics ingest handler when upstream errors occur.

### Wiring Alerts
- Subscribe Cloudflare Logpush or Analytics Engine to GitHub Actions or PagerDuty.
- Use `monitoring-dashboard.html` as a lightweight console viewer; replace data sources with `/api/observability/dashboard` JSON feed when deploying to Cloudflare Pages.

## Dashboards for Core Web Vitals
- **Endpoint:** `GET /api/observability/dashboard`
- **Client Feed:** `POST /api/observability/vitals` (called automatically by `app/reportWebVitals.ts`).
- **Budgets:** `packages/web/lighthouse-budgets.json` enforced in CI (`quality-audits` job).

## Ops Notes
- Dashboards run on Cloudflare + GitHub CI with Cloudflare KV/D1 storage as the default source of truth.
- Use `scripts/validate-lighthouse.js` + GitHub Action to prevent regressions before deploys.
- Worker metrics are also stored in `monitoring_logs` (D1) for long-term trending and RCA drills.
