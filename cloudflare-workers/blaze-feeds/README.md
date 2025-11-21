# Blaze Feeds Worker

Cloudflare Worker that proxies MLB, NFL, NBA, NCAA Football, and College Baseball feeds through Blaze Sports Intel.
It normalizes upstream responses to shared types, stamps cache/ETag headers, and snapshots payloads into KV (fast reads),
D1 (auditable history), and R2 (media persistence).

## Features
- 30s edge tick cache with ETag/If-None-Match support
- Circuit-breaker fallback to Netlify functions when primary sources fail
- Snapshot persistence to `FEED_CACHE` (KV), `FEED_DB` (D1), and `MEDIA_BUCKET` (R2)
- Health and per-sport feed endpoints under `/feeds/:sport`

## Quickstart
```bash
cd cloudflare-workers/blaze-feeds
pnpm install
pnpm dev
```

Configure the bindings in `wrangler.toml` before deploying:
- `FEED_CACHE` — KV namespace for hot feed responses
- `FEED_DB` — D1 database for historical snapshots
- `MEDIA_BUCKET` — R2 bucket for media artifacts
- `UPSTREAM_BASE` — primary feed provider base URL
- `NETLIFY_FALLBACK_URL` — backup Netlify functions endpoint
