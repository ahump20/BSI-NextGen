# Blaze Sports Intel SLAs & Resilience Playbook

## Data Access SLAs
- **Games & Linescores (MLB/NFL/NBA)**: 99.5% availability with p95 latency under 1.5s via Cloudflare CDN + origin caching.
- **Standings & Rankings**: refreshed at least every 5 minutes; tolerant of per-provider stale windows up to 15 minutes during upstream incidents.
- **Box Scores**: refreshed every 60 seconds during live play; cached 10 minutes post-final.

## Error Handling & Degradation
- **Retry + Backoff**: Exponential (750ms base, max 3 attempts) with per-provider circuit breakers to stop cascading failures.
- **Circuit Breakers**: Trips after 3 consecutive failures; auto-recovers after 30s cooldown. UI surfaces degraded state with provider-level messaging.
- **Validation Gate**: All adapter outputs are schema-validated (Zod). Invalid records are filtered before reaching the UI and tagged with a validation warning.
- **Partial Data Delivery**: If one provider fails, orchestration still returns available leagues plus aggregated confidence scores and structured error payloads.

## Client-Facing Signals
- **Unified Dashboard Banner**: Shows provider health (healthy/degraded), aggregated confidence, and last updated timestamp in Central Time.
- **API Metadata**: `/api/unified/*` responses include `meta` block with errors array, confidence, and count for downstream monitoring.

## Incident Runbook
1. Review circuit-breaker metrics (failures, cooldown ETA).
2. Inspect validation errors to identify upstream schema shifts.
3. Toggle to cached responses while upstream recovers; widen cache TTL to 5–10 minutes.
4. Communicate degraded providers in UI banner and status page; target recovery within SLA windows above.
