# BlazeSportsIntel NextGen

Cloudflare-first monorepo delivering the BlazeSportsIntel front-end (Next.js 14 App Router) and edge analytics API (Cloudflare Worker + D1 + KV + R2).

## Prerequisites

- Node.js >= 18
- pnpm >= 8
- Wrangler >= 3.50 (installed globally or via `pnpm wrangler`)
- Cloudflare account with D1, KV, and R2 enabled

## Install

```bash
pnpm install
```

## Useful scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Run the Next.js 14 experience locally. |
| `pnpm build` | Build the Next.js app and run a dry-run Worker deploy. |
| `pnpm lint` | Run ESLint across the web and worker packages. |
| `pnpm test` | Execute Worker unit tests via Vitest. |
| `pnpm --filter @bsi/worker dev` | Start the Worker against local D1/KV bindings. |

## Packages

- `packages/web`: BlazeSportsIntel App Router experience with Tailwind CSS, React Query, and storytelling components.
- `packages/worker`: Cloudflare Worker exposing `/api/v1/dashboard`, `/api/v1/teams/:id`, and `/api/v1/health` backed by D1, KV, and R2 bindings.

## Environment

Copy `.env.example` to `.env` and populate the Cloudflare identifiers plus public API/asset URLs.

```bash
cp .env.example .env
```

Set the same secrets in GitHub (for CI) and Cloudflare Pages/Workers dashboards.

## Deployment

1. Run `pnpm build` to ensure both the web client and worker compile.
2. Deploy the Worker: `pnpm --filter @bsi/worker deploy`.
3. Deploy the Next.js site to Cloudflare Pages using the generated `.vercel/output` (handled by Pages action) or run `npx @cloudflare/next-on-pages` inside `packages/web`.

For complete CI/CD automation, configure the provided GitHub Actions workflow in `.github/workflows` (see `DEPLOYMENT.md`).
