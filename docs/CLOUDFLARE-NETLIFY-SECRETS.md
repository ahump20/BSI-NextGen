# Cloudflare + Netlify secrets and environment configuration

This repository uses GitHub Actions to deploy Cloudflare Workers (with KV, D1, and R2 bindings) and the Next.js frontend on Cloudflare Pages, with Netlify kept as a fallback channel. Use the following guidance to keep deployments reproducible and auditable.

## Required secrets (GitHub Actions)

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with access to Workers, KV, D1, R2, and Pages deploys. Scope it to the specific account and projects. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID used by `wrangler` and the Pages deploy action. |
| `CLOUDFLARE_PAGES_PROJECT` | Cloudflare Pages project slug for the Next.js frontend. |
| `CLOUDFLARE_D1_DATABASE_ID` | D1 database identifier for data plane access and migrations. |
| `CLOUDFLARE_R2_BUCKET` | Default R2 bucket binding used by Workers and the Next.js asset pipeline. |
| `CLOUDFLARE_KV_NAMESPACE` | Namespace ID for KV used by Workers. |
| `NETLIFY_AUTH_TOKEN` | Token for optional Netlify fallback deploys. |
| `NETLIFY_SITE_ID` | Site ID for the Netlify fallback target. |

Store these values in GitHub repository *Secrets and variables → Actions* so they are available to the workflows. Use environment-level secrets for `staging` and `production` to enforce scoped credentials and manual approvals.

## Environment variables consumed by pipelines

Add environment variables in GitHub *Environments* that map to the bindings your Workers and Next.js app expect. Typical examples include:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_ANALYTICS_WRITE_KEY`
- `D1_DATABASE_ID` (mirrors `CLOUDFLARE_D1_DATABASE_ID` when exposed to Workers)
- `R2_BUCKET` and `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` for signed uploads
- `KV_NAMESPACE_ID`
- `WORKER_ENV` (e.g., `staging` or `production`)

Prefer storing sensitive values as environment secrets; fall back to environment variables only for non-sensitive defaults. For local development, mirror the same keys inside `.env.local` files that are **never committed**.

## Cloudflare bindings

- **Workers**: Bind D1 (`[[d1_databases]]`), KV (`kv_namespaces`), and R2 (`r2_buckets`) in each `wrangler.toml`. Use environment-specific sections (e.g., `[env.staging]` and `[env.production]`) to keep staging and production isolated.  
  > **Note:** If you plan to deploy to a `staging` environment (e.g., using `wrangler deploy --env staging`), ensure that a `[env.staging]` section exists in your `wrangler.toml` with the appropriate bindings. Example:
  > ```
  > [env.staging]
  > kv_namespaces = [{ binding = "MY_KV", id = "staging-namespace-id" }]
  > d1_databases = [{ binding = "MY_D1", database_id = "staging-d1-id" }]
  > r2_buckets = [{ binding = "MY_R2", bucket_name = "staging-bucket" }]
  > ```
- **Pages**: Provide the same bindings via `cloudflare_pages` config or environment variables so server-side rendering has identical access to data.
- **Netlify fallback**: Keep `netlify.toml` aligned with Pages bindings. If a Worker proxy is required, map the same environment variables and credentials through Netlify environment settings.

## Promotion and rollback

- Staging deploys run automatically on `main` and publish artifacts as `staging-release`. Promotion to production is performed by manually triggering the `promote_to_production` workflow, which uses the latest staged artifact and requires approval in the `production` environment.
- Production deploys are gated by the `production` environment in GitHub Actions, with required reviewers for manual approval. The workflow ensures correct job dependencies and conditions so promotion and rollback jobs run successfully.
- Rollbacks are performed by manually triggering the `rollback_production` workflow, which redeploys the most recent staged artifact to production. Ensure that the `staging` environment is defined in `wrangler.toml` if using environment-specific deploys.

## Operational tips

- Rotate tokens regularly and limit scope per environment.
- Keep Wrangler versions consistent across local and CI (`PNPM_VERSION`/`NODE_VERSION` are pinned in the workflow).
- Audit Lighthouse budget output artifacts (`lighthouse-report`) from the CI runs to verify performance and accessibility before promotion.
