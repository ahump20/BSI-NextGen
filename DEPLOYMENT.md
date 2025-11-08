# Cloudflare Deployment Playbook

This playbook documents how BlazeSportsIntel ships to production on Cloudflare Pages + Workers with D1, KV, and R2.

## Architecture Overview

- **Front-end**: `packages/web` – Next.js 14 built with `@cloudflare/next-on-pages` and deployed to Cloudflare Pages.
- **API**: `packages/worker` – Cloudflare Worker exposing the analytics endpoints.
- **Data**: Cloudflare D1 (structured game data) + KV (caching) + R2 (assets).

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `CF_ACCOUNT_ID` | Cloudflare account identifier (used by Wrangler + GitHub Actions). |
| `CF_API_TOKEN` | Token with Pages Deployments + Workers KV/D1/R2 permissions. |
| `BSI_D1_DATABASE_ID` | D1 database binding referenced in `wrangler.toml`. |
| `BSI_KV_NAMESPACE_ID` | Production KV namespace id. |
| `BSI_KV_PREVIEW_ID` | Preview KV namespace id for dev. |
| `NEXT_PUBLIC_API_BASE_URL` | Worker endpoint consumed by the Next.js app. |
| `NEXT_PUBLIC_ASSETS_BASE_URL` | Public R2 asset domain. |

Populate these locally via `.env` (see `.env.example`) and mirror them in GitHub > Settings > Secrets and variables.

## Local Validation

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
pnpm --filter @bsi/worker dev # optional: run worker locally
```

## GitHub Actions (recommended)

Create `.github/workflows/cloudflare-pages.yml` with two jobs:

1. **web** – install deps, run lint/test/build, execute `npx @cloudflare/next-on-pages@latest --experimental-minify` inside `packages/web`, publish using `cloudflare/pages-action`.
2. **worker** – run `pnpm --filter @bsi/worker deploy --env production` after the web job succeeds.

Both jobs require `CF_ACCOUNT_ID` and `CF_API_TOKEN` secrets.

## Manual Deploy Steps

### Worker API

```bash
cd packages/worker
pnpm deploy
```

### Next.js Front-end

```bash
cd packages/web
pnpm build
npx @cloudflare/next-on-pages@latest --experimental-minify
echo "Deploy the output/. directory via Cloudflare Pages UI or CLI"
```

## Data Lifecycle

- Apply database schema: `pnpm --filter @bsi/worker exec tsx scripts/migrate.ts`.
- Seed analytics data via D1 console or future migrations.
- KV cache is warmed automatically by Worker requests; clear using `wrangler kv:key delete` if needed.

## Troubleshooting

| Issue | Fix |
| --- | --- |
| Missing bindings | Verify Wrangler uses the same names as `wrangler.toml` (`BSI_DB`, `BSI_CACHE`, `BSI_ASSETS`). |
| 403 during deploy | Ensure API token includes `Workers Scripts`, `Pages`, `KV`, `D1`, and `R2` permissions. |
| Next.js build exceeds limits | Use `NEXT_ON_PAGES_DISABLE_UPLOAD_WORKERS=true` and keep assets in R2. |
| API returning stale data | Delete KV key via `wrangler kv:key delete BSI_CACHE dashboard:*`. |
| Database errors | Run migrations again or inspect tables using `wrangler d1 execute`. |

## Rollback Strategy

- Cloudflare Pages keeps prior deployments; click **Rollback** in the Pages dashboard.
- Workers maintain version history; use `wrangler deployments list` and `wrangler deployments rollback <id>`.

Document every production deploy in GitHub Releases so the entire stack remains audit-ready.
