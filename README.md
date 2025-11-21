# BSI-NextGen – Blaze Sports Intel Platform

BSI-NextGen is a professional sports intelligence platform built as a TypeScript monorepo with pnpm workspaces. It delivers real, production data across MLB, College Baseball, NFL, NBA, NCAA Football, NCAA Basketball, Youth Sports, and analytics services like the Major Moments Index (MMI). Everything is mobile-first, timezone-aware (America/Chicago), and free of placeholders.

## Production Status & Recent Updates

- **Status:** ✅ Live on Netlify (`https://blazesportsintelligence.netlify.app`) with the alternate domain `https://www.blazesportsintel.com`.
- **Latest deploy:** November 20, 2025 (`HEAD 9700561`) with automatic cache purge and `/api/health` verification.
- **Monitoring:** `/api/health` returns `healthy` with structured logs, and `scripts/monitor-production.sh` watches `/`, `/api/health`, `/sports/mlb`, and `/trends`.

**Recent P0/P1 fixes (Nov 20, 2025):**
- P0: Production health check endpoint deployed plus automated monitoring script and documentation (`MONITORING.md`).
- P1: Security hardening (7/7 headers enforced), console logging cleanup, and legacy debug endpoints removed.
- P1: Cache-control overhaul (HTML limited to 60 s on CDN, API responses at 5 min/10 min) with `CACHE-FIX-IMPLEMENTATION.md` documenting the change set.

## Key Highlights

- Real sports data via MLB Stats API, SportsDataIO (NFL/NBA), and ESPN public APIs for NCAA and youth pipelines.
- College baseball priority: full box scores, batting/pitching lines, and 30-second refresh cadence.
- Major Moments Index (MMI) analytics for high-leverage baseball insights plus an MCP (Model Context Protocol) server for data tooling.
- Observability-first build: structured logging, metrics, tracing, circuit breakers, and Cloudflare Analytics-driven monitoring with defined SLOs.
- Cloudflare Workers for trends, content, ingestion, and Longhorns Baseball coverage to keep data fresh at the edge.
- Aggressive cache strategy with automated staleness watchdogs and CI-managed cache purges after deploys.

## Architecture & Packages

The monorepo stitches shared types, data adapters, analytics services, Cloudflare Workers, and the Next.js frontend together.

```
bsi-nextgen/
├── packages/
│   ├── shared/
│   ├── api/
│   ├── web/
│   ├── sports-dashboard/
│   ├── mcp-sportsdata-io/
│   └── mmi-baseball/
├── cloudflare-workers/
│   ├── blaze-trends/
│   ├── blaze-content/
│   ├── blaze-ingestion/
│   └── longhorns-baseball/
└── observability/
```

### Major Packages

#### `@bsi/shared`
- Common types for teams, games, standings, users, and meta payloads.
- Utility helpers (`formatDate`, `calculateWinPercentage`, `getTodayInChicago`) that enforce the America/Chicago timezone.
- Shared auth interfaces for Auth0 + JWT flows.

#### `@bsi/api`
- Sports data adapters for MLB, NFL, NBA, NCAA Football/Basketball, College Baseball, Youth Sports, and command-center aggregations.
- Centralized error handling, cache metadata, and data-source attribution for all downstream consumers.
- Exposes strongly typed factories consumed by the web app, Cloudflare Workers, and the MCP server.

#### `@bsi/web`
- Next.js 14 App Router experience with Tailwind CSS, responsive components, and `/trends` integration.
- API routes for every sport plus health checks, cookies/privacy pages, and command-center dashboards.
- Implements security headers, cache behavior, and mobile-first layouts.

#### `@bsi/mcp-sportsdata-io`
- Model Context Protocol server exposing eight tools (`fetch_college_baseball_data`, `fetch_mlb_data`, `fetch_nfl_data`, `fetch_ncaa_basketball_data`, `fetch_college_football_data`, `stream_live_game_data`, `fetch_historical_stats`, `fetch_odds_and_projections`).
- Prioritizes College Baseball coverage with SportsDataIO support for MLB/NFL/NBA.
- Local dev: `pnpm --filter @bsi/mcp-sportsdata-io dev`, deploy via `pnpm --filter @bsi/mcp-sportsdata-io deploy`.
- Documentation: `packages/mcp-sportsdata-io/README.md`.

#### `@bsi/mmi-baseball`
- Python analytics engine for the Major Moments Index (MMI) with play-by-play scoring, win probability, and high-leverage detection.
- Surfaces via `/api/sports/mlb/mmi/*` endpoints with dedicated health, game, and high-leverage routes.
- Documentation: `packages/mmi-baseball/README.md`, `MMI_INTEGRATION_COMPLETE.md`, `MMI_DEPLOYMENT_SUMMARY.md`.

## Cloudflare Workers

| Worker | Path | Purpose | Key Commands / Docs |
| --- | --- | --- | --- |
| Blaze Trends | `cloudflare-workers/blaze-trends/` | Real-time news & AI-driven trend identification with D1 + KV storage and cron-triggered monitoring. | `pnpm trends:dev`, `pnpm trends:deploy`, docs in `README.md` & `DEPLOYMENT.md`. |
| Blaze Content | `cloudflare-workers/blaze-content/` | Content ingestion/curation (ESPN, RSS, scraping) feeding dashboards and CMS views. | `wrangler dev`, `wrangler deploy`, see `README.md`. |
| Blaze Ingestion | `cloudflare-workers/blaze-ingestion/` | Multi-sport ingestion worker for MLB/NFL/NBA/NCAA feeds powering the shared data lake. | `wrangler dev`, `wrangler deploy`, see `README.md`. |
| Longhorns Baseball | `cloudflare-workers/longhorns-baseball/` | Texas Longhorns-specific scraping, validation, and publishing worker with CLI + deploy scripts. | `deploy.sh`, `README.md`, `DEPLOYMENT_PLAN.md`. |

Full worker topology and lifecycle procedures live in `docs/INFRASTRUCTURE.md` and related worker-specific READMEs.

## Observability & Reliability

All services emit structured logs with correlation IDs, metrics, and tracing hooks defined in `observability/helpers/*`. Circuit breakers protect external APIs, and Cloudflare Analytics Engine captures request/latency distributions.

### Service Level Objectives (SLOs)
- **Page Load Performance:** P95 < 2 s, user-facing error rate < 0.1%.
- **API Response Time:** P99 < 200 ms, 5xx rate < 0.5%.
- **Data Freshness:** Live games < 30 s, standings & trends < 5 min.
- **External API Reliability:** ≥ 99.5% success for SportsDataIO/ESPN/MLB adapters.
- **Cache Staleness:** HTML cache < 60 s, API cache <= 10 min, static assets immutable.

### Monitoring & Alerting Setup
- `observability/README.md`, `QUICK_START.md`, and `RUNBOOK.md` detail setup, dashboards, and incident playbooks.
- `observability/helpers/telemetry.ts`, `middleware.ts`, and `circuit-breaker.ts` instrument every request with IDs, timing, and circuit state.
- `scripts/monitor-production.sh` polls `/`, `/api/health`, `/sports/mlb`, `/trends`, and sends email/Slack based on `ALERT_EMAIL` and `SLACK_WEBHOOK_URL`.
- `scripts/check-cache-staleness.sh` enforces cache age with optional Slack alerts (`MAX_CACHE_AGE`, `SLACK_WEBHOOK_URL`).
- Cloudflare Logs + Analytics Engine track edge metrics; `observability/PRODUCTION_DEPLOYMENT_GUIDE.md` explains dashboard wiring.

## Cache Control Strategy & Monitoring

- **API routes:** `public, max-age=300, s-maxage=600` (5 min browser / 10 min CDN) to prevent stale JSON while giving headroom for SportsDataIO rate limits.
- **HTML routes:** `public, max-age=0, s-maxage=60, must-revalidate` enforced in `packages/web/next.config.js` to avoid React hydration mismatches.
- **Static assets:** `public, max-age=31536000, immutable` for `_next/static/*` because filenames are content-addressed.
- **Monitoring:** `scripts/check-cache-staleness.sh` validates TTLs, and `.github/workflows/deploy-with-cache-purge.yml` purges Cloudflare + Netlify caches on deploy.
- Reference `CACHE-FIX-IMPLEMENTATION.md` for rationale and troubleshooting steps.

## Quick Start

### Prerequisites
- Node.js ≥ 18.0.0
- pnpm ≥ 8.0.0
- SportsDataIO API key (NFL/NBA data)

### Installation

```bash
git clone https://github.com/ahump20/BSI-NextGen.git
cd BSI-NextGen

pnpm install
cp .env.example .env
# Populate all required env vars (see below)

pnpm build               # shared → api → web
pnpm dev                 # Next.js dev server http://localhost:3000
```

### Authentication Setup
1. Create an Auth0 tenant and Regular Web Application.
2. Allowed callbacks/logout/origins: `http://localhost:3000`.
3. Copy credentials into `.env`:
   ```bash
   AUTH0_DOMAIN=your-tenant.us.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   AUTH0_AUDIENCE=https://your-api-audience
   JWT_SECRET=$(openssl rand -base64 32)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SPORTSDATAIO_API_KEY=your_sportsdataio_api_key
   ```
4. Restart `pnpm dev`.

## Development Workflow

```bash
# Web dev server
pnpm dev

# API package watch mode
pnpm dev:api

# Lint / format / clean
pnpm lint
pnpm format
pnpm clean

# Package-specific commands
pnpm --filter @bsi/shared build
pnpm --filter @bsi/api build
pnpm --filter @bsi/mcp-sportsdata-io dev
```

## Deployment & Release Management

### Current Production Deployment
- **Platform:** Netlify (`packages/web` as base).
- **Build command:** `cd ../.. && CI='' pnpm install --frozen-lockfile && pnpm build`.
- **Publish directory:** `packages/web/.next`.
- **Node version:** 18.x.
- **Environment variables:** `SPORTSDATAIO_API_KEY` (required) plus optional API keys for MLB/ESPN overrides.
- **Security headers (all enforced):**
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`
  - `Content-Security-Policy: default-src 'self'; ...` (see `packages/web/next.config.js`)
  - `Referrer-Policy: origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Deployment Workflow
- GitHub Actions (`.github/workflows/deploy-with-cache-purge.yml`) runs tests, builds, deploys to Netlify, purges Cloudflare caches, validates `/api/health`, and posts notifications.
- Manual scripts:
  - `deploy-production.sh` / `deploy-vercel-api.sh` / `deploy-to-blazesportsintel.sh` for ad-hoc pushes.
  - `verify-deployment.sh` validates key endpoints post-release.
- Cache purge + monitoring:
  - Automatic Cloudflare purge on success, plus optional manual `curl` purge.
  - `scripts/monitor-production.sh` stays running for 15 minutes after deploy to ensure stability.

### Deployment Checklist
1. `pnpm test` (unit + integration) & `npx playwright test` (install browsers if needed).
2. `pnpm build` (shared → api → web) with no TypeScript errors.
3. Verify `.env` / Netlify/Vercel secrets (`SPORTSDATAIO_API_KEY`, Auth0 credentials, optional keys).
4. Run `scripts/check-cache-staleness.sh` to confirm TTLs.
5. Confirm `/api/health` returns `healthy`.
6. Deploy via CI or `deploy-production.sh`.
7. Tail `scripts/monitor-production.sh` + Cloudflare Analytics for at least 15 minutes.

## API Surface

### College Baseball (Priority)
```
GET /api/sports/college-baseball/games?date=YYYY-MM-DD
GET /api/sports/college-baseball/games/[gameId]
GET /api/sports/college-baseball/rankings?week=N
GET /api/sports/college-baseball/standings?conference=ACC
```

### MLB
```
GET /api/sports/mlb/games?date=YYYY-MM-DD
GET /api/sports/mlb/standings?divisionId=200
GET /api/sports/mlb/teams
```

### MLB Major Moments Index (MMI)
```
GET /api/sports/mlb/mmi/games/:gameId
GET /api/sports/mlb/mmi/high-leverage
GET /api/sports/mlb/mmi/health
```

### NFL
```
GET /api/sports/nfl/games?week=1&season=2025
GET /api/sports/nfl/standings?season=2025
GET /api/sports/nfl/teams
```

### NBA
```
GET /api/sports/nba/games?date=YYYY-MM-DD
GET /api/sports/nba/standings
GET /api/sports/nba/teams
```

### NCAA Football
```
GET /api/sports/ncaa/football/games?week=1
GET /api/sports/ncaa/football/standings?conference=12
```

### NCAA Basketball
```
GET /api/sports/ncaa/basketball/games?date=YYYY-MM-DD
GET /api/sports/ncaa/basketball/standings
```

### Youth Sports
```
GET /api/sports/youth-sports/games
GET /api/sports/youth-sports/teams
```

### Command Center & System Health
```
GET /api/sports/command-center/dashboard
GET /api/health
```

### Authentication
```
GET /api/auth/login?returnTo=/profile
GET /api/auth/callback?code=xxx&state=yyy
GET /api/auth/me
GET /api/auth/logout?returnTo=/
```

## Environment Variables

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Authentication (Auth0)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://your-api-audience
JWT_SECRET=your-random-secret

# Sports data keys
SPORTSDATAIO_API_KEY=your_sportsdataio_key
MLB_API_KEY=optional_mlb_key
NCAA_API_KEY=optional_ncaa_key
NEXT_PUBLIC_API_URL=https://www.blazesportsintel.com
```

See `.env.example` for additional options (R2 storage, Auth0 audience overrides, etc.). Never commit `.env`.

## Technology Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, Playwright for E2E tests.
- **Backend:** Next.js API Routes, Cloudflare Workers, Model Context Protocol server.
- **Languages:** TypeScript (monorepo) + Python (MMI).
- **Package Manager:** pnpm with workspace linking.
- **Hosting:** Netlify (primary), Vercel optional preview, Cloudflare Workers for edge compute.
- **CI/CD:** GitHub Actions with cache purge + health verification.

## Testing

### Mobile Regression Tests
```bash
.claude/tests/mobile-regression.sh --create-baseline
.claude/tests/mobile-regression.sh --performance
npx playwright test tests/mobile-visual-regression.spec.ts
.claude/tests/mobile-regression.sh --all
```

### Playwright Tests
```bash
npx playwright install
npx playwright test
npx playwright test --ui
npx playwright show-report
```

## AI Assistant Guidelines & Best Practices

- Always use real sports data—never fabricate placeholder scores or teams.
- Default to mobile-first UI decisions and ensure components scale up to tablets/desktops.
- College baseball coverage is priority #1; keep box scores, standings, and timelines authoritative.
- Respect cache headers (HTML 60 s CDN, API 5 min/10 min) and run `scripts/check-cache-staleness.sh` when changing caching layers.
- Guard secrets: never log API keys, never commit `.env`, and validate env vars before use.
- Instrument everything: include `requestId`, `traceId`, and metadata (`timezone: 'America/Chicago'`, `dataSource`) in responses/logs.
- Handle external API failures with circuit breakers, retries, and descriptive errors.
- Keep UTC→America/Chicago conversions consistent via `@bsi/shared` helpers.

## Documentation Index

- **Getting Started**
  - `README.md` (this file)
  - `QUICK_START.md`
  - `.claude/README.md` (Claude Code web setup)
  - `CLAUDE.md` (AI assistant handbook)
- **Architecture & Infrastructure**
  - `docs/IMPLEMENTATION_SUMMARY.md`
  - `docs/INFRASTRUCTURE.md`
  - `docs/PRODUCTION_SETUP.md`
  - `docs/DOMAIN_SETUP_GUIDE.md`
- **Observability & Operations**
  - `observability/README.md`
  - `observability/QUICK_START.md`
  - `observability/RUNBOOK.md`
  - `observability/PRODUCTION_DEPLOYMENT_GUIDE.md`
  - `MONITORING.md`
  - `CACHE-FIX-IMPLEMENTATION.md`
- **Deployment & Release Management**
  - `DEPLOYMENT.md`
  - `DEPLOYMENT-READY-STATUS.md`
  - `DEPLOYMENT_LOG.md`
  - `verify-deployment.sh`, `deploy-production.sh`, `deploy-vercel-api.sh`
- **Analytics & Feature Guides**
  - `MMI_INTEGRATION_COMPLETE.md`
  - `MMI_DEPLOYMENT_SUMMARY.md`
  - `BLAZE-TRENDS-IMPLEMENTATION.md`
  - `COLLEGE-BASEBALL-IMPLEMENTATION.md`
  - `SPORTSDATAIO_INTEGRATION.md`
  - `BLAZE-3D-IMPLEMENTATION-SUMMARY.md`
- **Cloudflare Workers & Edge**
  - `cloudflare-workers/blaze-trends/README.md`
  - `cloudflare-workers/blaze-trends/DEPLOYMENT.md`
  - `cloudflare-workers/blaze-content/README.md`
  - `cloudflare-workers/blaze-ingestion/README.md`
  - `cloudflare-workers/longhorns-baseball/README.md`
- **Legal & Compliance**
  - `legal/README.md`
  - `legal/QUICK-START.md`
  - `legal/LEGAL-COMPLIANCE-SUMMARY.md`
  - `legal/compliance/*.md` (policies)

----

**Built with real data. No placeholders. Mobile-first.**

Blaze Sports Intel © 2025