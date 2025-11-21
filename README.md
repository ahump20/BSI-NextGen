# BSI-NextGen - Blaze Sports Intel Platform

A professional sports intelligence platform with **real-time data** from official APIs. Built as a TypeScript pnpm monorepo with Netlify/Vercel deployments, Cloudflare Workers, and comprehensive observability. **No placeholders—ever.**

## Production Snapshot (November 2025)

- ✅ Live on Netlify: https://blazesportsintelligence.netlify.app (mirrored at https://www.blazesportsintel.com)
- ✅ `/api/health` responds with structured status, latency, and timezone metadata
- ✅ Security headers shipped in production: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security: max-age=31536000`, `Content-Security-Policy`, `Referrer-Policy: origin-when-cross-origin`, `Permissions-Policy`
- ✅ Cache-control fix deployed (HTML limited to 60s CDN cache, APIs 10 min, static assets 1 year immutable)

### Recent P0 / P1 Fixes

1. **P0: Production health check + monitoring (Nov 20, 2025)** – `/api/health`, `scripts/monitor-production.sh`, and MONITORING.md landed together.
2. **P1: Security hardening (Nov 20, 2025)** – Complete header set applied, debug endpoints removed, console noise eliminated.
3. **P1: Cache control remediation (Nov 20, 2025)** – HTML cache reduced from 7 days to 60 seconds; Cloudflare purge built into GitHub Actions; `scripts/check-cache-staleness.sh` monitors drift.

## 🔥 Key Features

- **Real Sports Data** – MLB Stats API, SportsDataIO (NFL/NBA), ESPN for NCAA + college baseball enhancements.
- **College Baseball Priority** – Full batting/pitching box scores and standings that fill ESPN’s gaps.
- **Real-Time Updates** – Live scoring refresh every 30 seconds with America/Chicago timezone fidelity.
- **Edge + MCP Tooling** – Cloudflare Workers plus Model Context Protocol server for SportsDataIO multi-sport tooling.
- **Observability Built-In** – Structured logging, metrics, tracing, circuit breakers, health checks, and SLO-driven monitoring.
- **Mobile-First UX** – Responsive layouts, Tailwind CSS, and Playwright mobile regression coverage.

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- SportsDataIO API key (required for NFL/NBA)

### Installation

```bash
# Clone the repository
git clone https://github.com/ahump20/BSI-NextGen.git
cd BSI-NextGen

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys (see Authentication Setup below)

# Build all packages (shared → api → web)
pnpm build

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the app.

### Authentication Setup

1. **Create Auth0 account** (free tier works) and tenant.
2. **Create Auth0 application** → “Regular Web Application” named “BSI-NextGen”.
3. **Configure settings**
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. **Copy credentials to `.env`**
   ```bash
   AUTH0_DOMAIN=your-tenant.us.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   AUTH0_AUDIENCE=https://your-api-audience
   JWT_SECRET=$(openssl rand -base64 32)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
5. **Add SportsDataIO API key**
   ```bash
   SPORTSDATAIO_API_KEY=your_sportsdataio_api_key
   ```
6. Restart dev server: `pnpm dev`.

## 🧱 Architecture Overview

```
bsi-nextgen/
├── packages/
│   ├── shared/             # @bsi/shared – types, utilities, timezone helpers
│   ├── api/                # @bsi/api – sports adapters (MLB, NFL, NBA, NCAA, college baseball)
│   ├── web/                # @bsi/web – Next.js 14 app router frontend + API routes
│   ├── mcp-sportsdata-io/  # @bsi/mcp-sportsdata-io – Model Context Protocol server
│   └── mmi-baseball/       # Python analytics package for MMI endpoints
├── cloudflare-workers/     # blaze-trends, blaze-content, blaze-ingestion, longhorns-baseball
├── observability/          # Telemetry helpers, SLOs, runbooks, deployment guides
├── docs/                   # Infrastructure, deployment, implementation guides
├── scripts/                # Monitoring + checks (cache, uptime, deployments)
├── netlify.toml            # Production deployment config
└── vercel.json             # Alternate hosting config
```

### Core Packages

#### `@bsi/shared`
Shared TypeScript types/utilities powering every package.
- Game / Team / Standing / Trend types, auth interfaces, timezone helpers.
- Utility functions like `getTodayInChicago`, `calculateWinPercentage`, and date formatting.

#### `@bsi/api`
Sports data adapters plus auth utilities.
- Includes adapters for MLB, NFL, NBA, NCAA football/basketball, college baseball, youth sports, and D1 baseball rankings.
- Handles data normalization into shared types and attaches metadata (dataSource, lastUpdated, timezone).
- Build with `pnpm --filter @bsi/api build`.

#### `@bsi/web`
Next.js 14 App Router frontend + API routes.
- Mobile-first UI, `/trends` integration, `/api/sports/*` routes, and security headers defined in `next.config.js`.
- Uses Tailwind CSS, server components, and caching strategy described below.

#### `@bsi/mcp-sportsdata-io`
Model Context Protocol (MCP) package exposing eight AI-ready tools for SportsDataIO + ESPN data.
- Tools: `fetch_college_baseball_data`, `fetch_mlb_data`, `fetch_nfl_data`, `fetch_college_football_data`, `fetch_ncaa_basketball_data`, `stream_live_game_data`, `fetch_historical_stats`, `fetch_odds_and_projections`.
- Run locally: `pnpm --filter @bsi/mcp-sportsdata-io dev`; deploy with `pnpm --filter @bsi/mcp-sportsdata-io deploy`.
- Docs: `packages/mcp-sportsdata-io/README.md`.

#### `packages/mmi-baseball`
Major Moments Index (MMI) analytics engine (Python).
- Calculates moment scores, win probability, and high-leverage situations.
- Powers `/api/sports/mlb/mmi/*` endpoints via a thin Next.js API wrapper.
- Docs: `packages/mmi-baseball/README.md`, `MMI_INTEGRATION_COMPLETE.md`, `MMI_DEPLOYMENT_SUMMARY.md`.

### Cloudflare Workers (Edge Layer)

- **blaze-trends** – AI-powered trend ingestion with Brave Search + GPT-4 Turbo. Endpoints `/health`, `/api/trends`, cron `/cron/monitor`. See `cloudflare-workers/blaze-trends/`.
- **blaze-content** – Editorial worker for publishing highlights, handles KV caching of CMS snippets. See `cloudflare-workers/blaze-content/`.
- **blaze-ingestion** – Data ingestion pipeline bridging external feeds to D1 storage / KV caches. See `cloudflare-workers/blaze-ingestion/`.
- **longhorns-baseball** – Texas-focused worker delivering hyper-local college baseball coverage and automated notifications. See `cloudflare-workers/longhorns-baseball/`.

## Observability & Monitoring

### Infrastructure

- `observability/README.md` (start here) + QUICK_START, RUNBOOK, PRODUCTION_DEPLOYMENT_GUIDE, DEBUGGABILITY_CARD.
- Structured logging with correlation IDs, metrics via Cloudflare Analytics Engine, distributed tracing hooks, and circuit breakers (`observability/helpers/{telemetry,circuit-breaker}.ts`).
- Monitoring scripts: `scripts/monitor-production.sh`, `.claude/tests/mobile-regression.sh`, and Playwright suites.

### Service Level Objectives (SLOs)

- **Page Load**: P95 < 2s, error rate < 0.1%.
- **API Response**: P99 < 200 ms, 5xx rate < 0.5%.
- **Data Freshness**: Live games < 30 s, standings < 5 min.
- **External API Reliability**: ≥ 99.5% success rate.

### Monitoring Setup

- `scripts/monitor-production.sh` checks `/`, `/api/health`, `/sports/mlb` with Slack/email hooks.
- `./scripts/check-cache-staleness.sh` ensures CDN caches never exceed 90 s; environment variables (`MAX_CACHE_AGE`, `SLACK_WEBHOOK_URL`) control thresholds.
- `pnpm trends:tail` (Blaze Trends) and Cloudflare dashboards provide worker logs.
- Health verification: `curl https://www.blazesportsintel.com/api/health`.

## Cache Control Strategy & Monitoring

- **API Routes**: `Cache-Control: public, max-age=300, s-maxage=600` (5-min browser / 10-min CDN). Ensures fast revalidation without thrashing upstream APIs.
- **HTML Pages**: `public, max-age=0, s-maxage=60, must-revalidate` to prevent mismatched React builds after deploys.
- **Static Assets**: `public, max-age=31536000, immutable` thanks to Next.js fingerprinting.
- **Monitoring**: `CACHE-FIX-IMPLEMENTATION.md` documents the remediation; `scripts/check-cache-staleness.sh` enforces it; Cloudflare purge triggered post-deploy through GitHub Actions.

## 📚 Documentation Index

### Quick Start & Orientation
- `README.md` (this file)
- `QUICK_START.md`
- `docs/IMPLEMENTATION_SUMMARY.md` (**start here** roadmap)

### Architecture & Infrastructure
- `docs/INFRASTRUCTURE.md`
- `docs/LEAGUE_WIDE_IMPLEMENTATION_SUMMARY.md`
- `docs/LEAGUE_WIDE_DATA_MANAGEMENT.md`
- `docs/PHASE_13_IMPLEMENTATION.md` → `docs/PHASE_16_IMPLEMENTATION.md`

### Deployment & Operations
- `DEPLOYMENT.md`, `DEPLOYMENT-READY-STATUS.md`, `DEPLOYMENT_LOG.md`, `DEPLOYMENT-SUCCESS.md`
- `docs/PRODUCTION_SETUP.md`, `docs/DOMAIN_SETUP_GUIDE.md`, `docs/R2_STORAGE_SETUP.md`
- `MONITORING.md`, `observability/PRODUCTION_DEPLOYMENT_GUIDE.md`, `observability/RUNBOOK.md`

### Observability & Monitoring
- `observability/README.md`, `observability/QUICK_START.md`, `observability/DEBUGGABILITY_CARD.md`
- `CACHE-FIX-IMPLEMENTATION.md`, `MONITORING.md`
- `observability/helpers/*` (telemetry, circuit breakers, middleware)

### Feature & Data Integrations
- `BLAZE-TRENDS-IMPLEMENTATION.md`, `BLAZE-TRENDS/VISUALIZATION` docs
- `COLLEGE-BASEBALL-IMPLEMENTATION.md`, `SPORTSDATAIO_INTEGRATION.md`
- `MMI_INTEGRATION_COMPLETE.md`, `MMI_DEPLOYMENT_SUMMARY.md`
- `cloudflare-workers/*/README.md`

### Legal & Compliance
- `legal/README.md`, `legal/QUICK-START.md`
- `legal/compliance/*`, `legal/policies/*`
- `LEGAL-COMPLIANCE-SUMMARY.md`

## 🎯 Sports Coverage Priority

1. **College Baseball** 🔥 – ESPN gap filler for full box scores.
2. **MLB** – Real-time games, standings, and MMI analytics.
3. **NFL** – SportsDataIO feeds, injuries, standings.
4. **NCAA Football** – ESPN data with conference focus.
5. **NBA** – SportsDataIO standings and live games.

## 🚢 Deployment

### Platforms & Security

- **Netlify (production)** – Base directory `packages/web`, build command `cd ../.. && CI='' pnpm install --frozen-lockfile && pnpm build`, publish `packages/web/.next`.
- **Vercel (alternate)** – Build `cd ../.. && pnpm build`, root `packages/web`.
- **Security Headers** (enforced via `next.config.js` + Netlify):  
  `X-Frame-Options=DENY`, `X-Content-Type-Options=nosniff`, `X-XSS-Protection=1; mode=block`, `Strict-Transport-Security=max-age=31536000`, `Content-Security-Policy` (no `unsafe-inline` for HTML), `Referrer-Policy=origin-when-cross-origin`, `Permissions-Policy` locking camera/mic/GPS.

### Deployment Workflow

1. `pnpm test && pnpm lint && pnpm build`.
2. Verify `.env` / Netlify env vars (SPORTSDATAIO_API_KEY, optional Auth0 creds, analytics keys).
3. Push to `main` → GitHub Actions builds, runs tests, deploys to Netlify, purges Cloudflare cache.
4. Monitor `DEPLOYMENT_LOG.md` with summary + links.
5. Post-deploy verification using `scripts/monitor-production.sh`, `curl /api/health`, Playwright smoke tests.

### Deployment Checklist

**Before deploy**
- [ ] Tests pass (`pnpm test`, Playwright, `.claude/tests/mobile-regression.sh --performance`)
- [ ] `pnpm build` succeeds locally
- [ ] Environment variables present (SPORTSDATAIO, Auth0, NEXT_PUBLIC_APP_URL, etc.)
- [ ] Cache headers reviewed against `CACHE-FIX-IMPLEMENTATION.md`
- [ ] Observability instrumentation intact (telemetry helpers not removed)

**After deploy**
- [ ] Homepage + `/trends` render without hydration warnings
- [ ] `/api/health` and `/api/sports/*` return 200
- [ ] Cloudflare cache purge confirmed
- [ ] Monitor error rate for 15 minutes via `scripts/monitor-production.sh`
- [ ] Document results in `DEPLOYMENT_LOG.md`

## 📊 API Surface

```
# College Baseball (priority)
GET /api/sports/college-baseball/games?date=YYYY-MM-DD
GET /api/sports/college-baseball/games/:gameId
GET /api/sports/college-baseball/rankings?week=#
GET /api/sports/college-baseball/standings?conference=ACC

# MLB
GET /api/sports/mlb/games?date=YYYY-MM-DD
GET /api/sports/mlb/standings?divisionId=200
GET /api/sports/mlb/teams

# MLB MMI (Major Moments Index)
GET /api/sports/mlb/mmi/games/:gameId
GET /api/sports/mlb/mmi/high-leverage
GET /api/sports/mlb/mmi/health

# NFL
GET /api/sports/nfl/games?week=1&season=2025
GET /api/sports/nfl/standings?season=2025
GET /api/sports/nfl/teams

# NBA
GET /api/sports/nba/games?date=YYYY-MM-DD
GET /api/sports/nba/standings
GET /api/sports/nba/teams

# NCAA Football
GET /api/sports/ncaa/football/games?week=1
GET /api/sports/ncaa/football/standings?conference=12

# NCAA Basketball
GET /api/sports/ncaa/basketball/games?date=YYYY-MM-DD
GET /api/sports/ncaa/basketball/standings

# Youth Sports
GET /api/sports/youth-sports/games
GET /api/sports/youth-sports/teams

# Command Center
GET /api/sports/command-center/dashboard

# System Health
GET /api/health
```

All responses include `meta.lastUpdated` timestamps and `timezone: "America/Chicago"`.

### Authentication

```
GET /api/auth/login?returnTo=/profile
GET /api/auth/callback?code=xxx&state=xxx
GET /api/auth/me
GET /api/auth/logout?returnTo=/
```

## AI Assistant Guidelines & Best Practices

- **Use real data** – Never fabricate box scores; always call adapters or document why data is unavailable.
- **Mobile-first** – Tailwind defaults for mobile, scale up with `md`/`lg` breakpoints.
- **College baseball first** – Prioritize `/college-baseball` endpoints when adding coverage.
- **Cache-aware** – Respect cache headers above; HTML must revalidate every 60 s to avoid hydration issues.
- **Security & compliance** – Never log API keys, keep `.env` out of git, maintain security headers.
- **Observability** – Preserve telemetry helpers, add `requestId` metadata, and update runbooks when behavior changes.
- **Docs + CLAUDE.md** – Update documentation alongside code so future AI assistants inherit context.

## 🔧 Development

```bash
# Start web dev server
pnpm dev

# Start API dev server (TypeScript watch mode)
pnpm dev:api

# Run linting
pnpm lint

# Format code
pnpm format

# Clean all build artifacts
pnpm clean
```

## 🔐 Environment Variables

Copy `.env.example` to `.env`:

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

# Sports Data
SPORTSDATAIO_API_KEY=your_sportsdataio_key
D1BASEBALL_API_URL=https://d1baseball.com/api  # Optional
```

See `.env.example` for extended configuration (Brave Search, Auth0, analytics, etc.).

## 🎨 Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API routes + Cloudflare Workers
- **Language**: TypeScript (monorepo) + Python (MMI)
- **Package Manager**: pnpm workspaces
- **Deployment**: Netlify (prod) + Vercel (alt)
- **CI/CD**: GitHub Actions with cache purge + monitoring hooks

## 📝 Data Sources

- **MLB** – Official MLB Stats API (free)
- **NFL/NBA** – SportsDataIO (requires `SPORTSDATAIO_API_KEY`)
- **NCAA Football / Basketball / College Baseball** – ESPN public APIs (enhanced)
- **Youth Sports** – Internal data management APIs

All timestamps use **America/Chicago**.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit (`git commit -m 'Add amazing feature'`).
4. Push (`git push origin feature/amazing-feature`).
5. Open a Pull Request with tests + documentation.

## 🧪 Testing

### Mobile Regression Tests

```bash
# Create performance baseline
.claude/tests/mobile-regression.sh --create-baseline

# Run performance regression tests
.claude/tests/mobile-regression.sh --performance

# Run visual regression tests with Playwright
npx playwright test tests/mobile-visual-regression.spec.ts

# Run all regression tests
.claude/tests/mobile-regression.sh --all
```

### Playwright Tests

```bash
# Install Playwright browsers
npx playwright install

# Run all tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui

# Show test report
npx playwright show-report
```

## 📄 License

MIT License – see `LICENSE`.

## 🙏 Acknowledgments

- MLB Stats API for free, official baseball data.
- SportsDataIO for comprehensive NFL/NBA coverage.
- ESPN for college sports data feeds.
- Contributors building real-time sports intelligence tooling.

---

**Built with real data. No placeholders. Mobile-first.**

Blaze Sports Intel © 2025