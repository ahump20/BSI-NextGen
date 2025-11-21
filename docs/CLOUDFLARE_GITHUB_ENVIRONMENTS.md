# Cloudflare + GitHub Environments

This guide explains how to wire GitHub Environments/secrets so the Cloudflare deployment workflow can build all workspaces, publish Pages + Workers, and keep cache and health checks aligned with each branch.

## Environment topology
- **production** → `main` branch, primary domain. Runs cache purges and smoke checks after every deploy.
- **preview** → any non-`main` branch (feature/*, release/*). Uses branch-specific preview domains derived from the base preview host secret.

> Branch slugs are lowercased with non-alphanumeric characters converted to `-` (e.g., `feature/fast-ingest` → `feature-fast-ingest`).

## Required GitHub secrets
Create the secrets below inside both the **production** and **preview** GitHub Environments unless noted otherwise. Values are consumed by `.github/workflows/cloudflare-pages.yml`.

### Cloudflare platform access
- `CLOUDFLARE_API_TOKEN` – token with Pages + Workers + KV/R2/D1 + cache purge privileges.
- `CLOUDFLARE_ACCOUNT_ID` – Cloudflare account ID.
- `CLOUDFLARE_ZONE_ID` – zone used for cache purges.
- `CF_PAGES_PROJECT` – Pages project name (`blazesportsintel`).

### Pages domains and health checks
- `CF_PAGES_PROD_DOMAIN` – canonical Pages hostname (e.g., `blazesportsintel.com`).
- `CF_PAGES_PREVIEW_BASE_DOMAIN` – base host for previews (e.g., `pages.blazesportsintel.com`); workflow prepends the branch slug.
- `CF_WEB_HEALTH_PROD` / `CF_API_HEALTH_PROD` – full URLs to production smoke-check endpoints.
- `CF_WEB_HEALTH_PREVIEW` / `CF_API_HEALTH_PREVIEW` – full URLs for previews (can point to branch-specific hosts).

### Worker bindings – production
- `CF_KV_SPORTS_CACHE_PROD` – KV namespace ID for `SPORTS_CACHE`.
- `CF_D1_BLAZE_DB_PROD` – D1 DB ID for `BLAZE_DB` (content + ingestion Workers).
- `CF_D1_TRENDS_DB_PROD` – D1 DB ID for `DB` in `blaze-trends`.
- `CF_KV_TRENDS_CACHE_PROD` – KV ID for `BLAZE_TRENDS_CACHE`.
- `CF_D1_LONGHORNS_DB_PROD` – D1 DB ID for `DB` in `longhorns-baseball`.
- `CF_R2_MEDIA_BUCKET_PROD` – R2 bucket binding ID used when present.

### Worker bindings – preview
- `CF_KV_SPORTS_CACHE_PREVIEW`
- `CF_D1_BLAZE_DB_PREVIEW`
- `CF_D1_TRENDS_DB_PREVIEW`
- `CF_KV_TRENDS_CACHE_PREVIEW`
- `CF_D1_LONGHORNS_DB_PREVIEW`
- `CF_R2_MEDIA_BUCKET_PREVIEW`

### External API keys
Store provider keys so Workers can pull secrets during deployment:
- `SPORTSDATAIO_API_KEY`, `OPENAI_API_KEY`, `BRAVE_API_KEY`, and any partner integrations used in the Workers. Map these secrets in the GitHub Environment so `wrangler` can set them via `wrangler secret put` or environment variables when needed.

## Environment creation steps
1. In GitHub, create two Environments: **production** (limited to `main`) and **preview** (allow `feature/*`, `release/*`).
2. Add the secrets listed above to each Environment. Use preview-specific IDs for KV/D1/R2 to keep non-prod traffic isolated.
3. For branch preview domains, set `CF_PAGES_PREVIEW_BASE_DOMAIN` once (e.g., `preview.blazesportsintel.com`); the workflow will publish to `{branch-slug}.{base}`.
4. Ensure `CLOUDFLARE_API_TOKEN` has permissions for Pages deploys, Workers deploys, KV/R2/D1 writes, and cache purging.

## How the workflow uses these secrets
- Runs `pnpm lint`, `pnpm type-check`, and builds every workspace before any deploy.
- Deploys **Pages** using the resolved branch/domain and **Workers** (`blaze-content`, `blaze-ingestion`, `blaze-trends`, `longhorns-baseball`) with environment-specific KV/R2/D1 bindings and a `DEPLOY_VERSION` stamp per run.
- Triggers a Cloudflare cache purge after deployments to ensure fresh content across CDN + KV-backed responses.
- Executes smoke checks against the web and API health endpoints; failures stop the workflow so broken releases do not remain live.
