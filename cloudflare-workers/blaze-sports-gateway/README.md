# Blaze Sports Gateway Worker

Edge gateway that fronts all Blaze Sports Intel API routes with Cloudflare KV cache-first reads, upstream fallbacks, and D1-backed observability.

## Capabilities
- Caches `/api/sports/*` and `/api/unified/*` responses with Cloudflare KV using game-state/date aware keys.
- Falls back to upstream providers (Next.js API or direct data sources) when cache is empty or invalid.
- D1-backed session, event, and usage metrics logging for every request.
- Cache invalidation endpoint keyed by sport, game state, and event date.
- R2 binding for future media passthrough and CDN-friendly asset headers.

## Quick start
```bash
# Authenticate and deploy
cd cloudflare-workers/blaze-sports-gateway
npm install
wrangler whoami
wrangler kv:namespace create BSI_SPORTS_CACHE --env production
wrangler d1 create bsi-observability
wrangler deploy
```

## Environment variables
- `UPSTREAM_BASE_URL` – origin API host (e.g., Next.js deployment) used when cache misses.
- `CACHE_BYPASS_TOKEN` – optional header token to bypass cache for diagnostics.
- `INVALIDATION_TOKEN` – required for cache invalidation mutations.

## Cache invalidation
Send a signed POST to `/internal/cache/invalidate` with JSON payload:
```json
{
  "sport": "mlb",
  "date": "2025-03-01",
  "state": "live"
}
```

## Observability schema
D1 tables live in [`schema.sql`](./schema.sql) and are applied automatically in CI via `wrangler d1 migrations apply`.

## Deployment notes
- Routes are pre-wired for `api.blazesportsintel.com/api/sports/*` and `api.blazesportsintel.com/api/unified/*`.
- Use the GitHub Actions workflow (`.github/workflows/deploy-sports-gateway.yml`) to publish Workers, sync assets to R2, and apply D1 schema.
