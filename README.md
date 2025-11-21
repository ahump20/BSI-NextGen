# BSI-NextGen - Blaze Sports Intel Platform

BSI-NextGen is a professional sports intelligence platform built as a TypeScript monorepo with pnpm workspaces. It delivers real-time coverage across MLB, NCAA, college baseball, youth sports, and pro leagues with production-grade observability, cache discipline, and Cloudflare edge workers.

## 🔥 Key Features

- **Real Sports Data Stack**: MLB Stats API, SportsDataIO (NFL/NBA), ESPN (NCAA + college baseball) – no placeholders.
- **College Baseball First**: Enhanced ESPN data with full box scores, batting/pitching lines, and 30-second refreshes.
- **Cloudflare Edge Network**: 4 documented workers (trends, content, ingestion, Longhorns baseball) for latency-sensitive workloads.
- **Observability Built-In**: Structured logging, metrics, distributed tracing, and circuit breakers configured in `observability/`.
- **Security & Cache Discipline**: Tight cache-control strategy, hardened security headers, automated Cloudflare cache purge.
- **Mobile-First Delivery**: Tailwind-powered responsive UI delivered via Next.js 14 with aggressive performance budgets.

## 🏗️ Workspace Architecture

```
bsi-nextgen/
├── packages/
│   ├── shared/             # @bsi/shared - common types/utilities
│   ├── api/                # @bsi/api - adapters, auth helpers
│   ├── web/                # @bsi/web - Next.js app + API routes
│   ├── sports-dashboard/   # Shared dashboard components
│   ├── mcp-sportsdata-io/  # MCP server for SportsDataIO APIs
│   └── mmi-baseball/       # Major Moments Index analytics engine
├── cloudflare-workers/
│   ├── blaze-trends/
│   ├── blaze-content/
│   ├── blaze-ingestion/
│   └── longhorns-baseball/
├── docs/                   # Deployment + infrastructure guides
├── observability/          # Logging, metrics, tracing helpers
└── scripts/                # Monitoring & operational scripts
```

## 📦 Packages

### `@bsi/shared`
Shared TypeScript types (Team, Game, Standing, Player) and utilities (America/Chicago timezone helpers, win percentage, formatting). All consumers rely on these canonical contracts.

### `@bsi/api`
Sports adapters (MLB, NFL, NBA, NCAA football/basketball, college baseball, youth sports) plus Auth0/JWT helpers. Every adapter normalizes external APIs to `@bsi/shared` types and sets observability metadata.

### `@bsi/web`
Next.js 14 app with App Router, Tailwind, server components, and API routes under `app/api/sports/*`. Cache headers, security headers, and observability middleware are enforced here.

### `@bsi/mcp-sportsdata-io`
Model Context Protocol server (Cloudflare Worker-friendly) exposing 8 specialized tools:
- `fetch_college_baseball_data`, `fetch_mlb_data`, `fetch_nfl_data`, `fetch_ncaa_football_data`, `fetch_ncaa_basketball_data`
- `stream_live_game_data`, `fetch_historical_stats`, `fetch_odds_and_projections`

Location: `packages/mcp-sportsdata-io/`. See `README.md` inside the package for setup and deployment.

### `packages/mmi-baseball`
Major Moments Index (MMI) analytics engine for baseball:
- Play-by-play ingestion, moment scoring, win probability, high-leverage detection
- Serves `/api/sports/mlb/mmi/*` endpoints
- Python package with deployment notes in `MMI_INTEGRATION_COMPLETE.md` and `MMI_DEPLOYMENT_SUMMARY.md`

## ☁️ Cloudflare Workers

- **`cloudflare-workers/blaze-trends`** – AI-assisted trend discovery with cron triggers, Brave Search ingestion, D1 + KV persistence. Docs: `BLAZE-TRENDS-IMPLEMENTATION.md`.
- **`cloudflare-workers/blaze-ingestion`** – Data ingestion pipeline for official feeds, applying schema validation before storage or queueing.
- **`cloudflare-workers/blaze-content`** – Content rendering + transformation worker for dynamic pages/snippets.
- **`cloudflare-workers/longhorns-baseball`** – Dedicated Texas Longhorns baseball feed with fan-facing endpoints.

See `docs/INFRASTRUCTURE.md` for the full 72-worker map and routing layers.

## 🛰️ Observability & Monitoring

- **Stack**: Structured logging (`observability/helpers/telemetry.ts`), metrics/trace helpers, middleware instrumentation, and circuit breakers for every external API.
- **Service Level Objectives**
  - Page load P95 < 2s, error rate < 0.1%
  - API response P99 < 200 ms, 5xx rate < 0.5%
  - Data freshness: live games < 30 s, standings < 5 min
  - External API reliability: ≥ 99.5% success
- **Monitoring & Runbooks**
  - `scripts/monitor-production.sh` – hits `/`, `/api/health`, `/sports/mlb` with Slack/email hooks
  - `CACHE-FIX-IMPLEMENTATION.md` + `observability/PRODUCTION_DEPLOYMENT_GUIDE.md`
  - Incident response + debugging guides in `observability/README.md`, `observability/DEBUGGABILITY_CARD.md`, `MONITORING.md`

## 📡 Production Status (November 2025)

- **Status**: ✅ Live on Netlify (`https://blazesportsintelligence.netlify.app`, alias `https://www.blazesportsintel.com`)
- **Recent P0/P1 Fixes (Nov 20, 2025)**
  - Health endpoint + production monitoring shipped (`/api/health`, `scripts/monitor-production.sh`)
  - Cache control overhaul to prevent stale HTML (60 s CDN, 5 min API, 1-year static)
  - Security headers hardened (CSP + HSTS + Permissions-Policy)
  - Homepage refresh with real data + alerts module
  - Observability stack (structured logging, tracing, circuit breakers) enabled repo-wide
  - MMI integration + MCP worker deployment completed

## 🧊 Cache Control & Monitoring

- **HTML**: `packages/web/next.config.js` sets `public, max-age=0, s-maxage=60, must-revalidate` to avoid React hydration mismatches.
- **API Routes**: Every `NextResponse` returns `public, max-age=300, s-maxage=600`.
- **Static Assets**: Next.js-generated `_next/static` files ship with `public, max-age=31536000, immutable`.
- **Monitoring**: `scripts/check-cache-staleness.sh` (with optional `MAX_CACHE_AGE` + `SLACK_WEBHOOK_URL`) guards against stale CDN edges; GitHub Actions purges Cloudflare cache post-deploy.

## 🚢 Deployment Workflow & Checklist

### Current Production (Netlify)
- Build command: `cd ../.. && CI='' pnpm install --frozen-lockfile && pnpm build`
- Publish dir: `packages/web/.next`
- Node v18 runtime, `@netlify/plugin-nextjs`
- Auto-deploys on push to `main`, GitHub Actions purges Cloudflare cache afterward

### Security Headers (served via `packages/web/next.config.js`)
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy: <locked-down rules>`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: restricted device APIs`

### Workflow
1. `pnpm install && pnpm build` (shared → api → web)
2. `pnpm lint`, `pnpm test`, optional Playwright suite
3. `pnpm dev` for local verification
4. Push to `main` → Netlify build → automatic cache purge → verification scripts
5. Update `DEPLOYMENT_LOG.md` + `DEPLOYMENT-READY-STATUS.md` if relevant

### Deployment Checklist
- **Pre-deploy**: tests pass, build succeeds, env vars validated, cache headers reviewed, `scripts/check-cache-staleness.sh` passes.
- **Post-deploy**: verify `/` and `/api/health`, spot-check sports endpoints, monitor error rates for 15 min, confirm Cloudflare analytics + Slack alerts.
- Detailed instructions: `DEPLOYMENT.md`, `verify-deployment.sh`, `MONITORING.md`.

### Alternate Path (Vercel)
- Build command: `cd ../.. && pnpm build`
- Root directory: `packages/web`
- Preview deployments for PRs; ensure `SPORTSDATAIO_API_KEY` is set in project settings.

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- pnpm ≥ 8
- SportsDataIO API key (NFL/NBA adapters)

### Installation
```bash
git clone https://github.com/ahump20/BSI-NextGen.git
cd BSI-NextGen
pnpm install
cp .env.example .env   # add API keys + Auth0 credentials
pnpm build             # shared → api → web
pnpm dev               # http://localhost:3000
```

## 🔐 Authentication Setup

1. Create an Auth0 tenant + Regular Web Application (`BSI-NextGen`).
2. Configure:
   - Allowed Callback: `http://localhost:3000/api/auth/callback`
   - Allowed Logout: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
3. Populate `.env`:
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

## 🔧 Development Commands

```bash
pnpm dev                 # Next.js dev server
pnpm dev:api             # API adapters in watch mode
pnpm lint                # ESLint
pnpm format              # Prettier
pnpm clean               # Remove build artifacts
```

## 📚 Documentation Index

- **Getting Started & Roadmaps**
  - `README.md`, `QUICK_START.md`, `docs/IMPLEMENTATION_SUMMARY.md`
- **Architecture & Infrastructure**
  - `docs/INFRASTRUCTURE.md`, `docs/PRODUCTION_SETUP.md`, `docs/DOMAIN_SETUP_GUIDE.md`
- **Observability & Monitoring**
  - `observability/README.md`, `MONITORING.md`, `observability/PRODUCTION_DEPLOYMENT_GUIDE.md`, `CACHE-FIX-IMPLEMENTATION.md`
- **Deployment & Operations**
  - `DEPLOYMENT.md`, `DEPLOYMENT_LOG.md`, `DEPLOYMENT-READY-STATUS.md`, `verify-deployment.sh`, `scripts/monitor-production.sh`
- **Feature Implementations**
  - `COLLEGE-BASEBALL-IMPLEMENTATION.md`, `BLAZE-TRENDS-IMPLEMENTATION.md`, `BLAZE-3D-IMPLEMENTATION-SUMMARY.md`, `BLAZE-3D-VISUALIZATION-ARCHITECTURE.md`, `MMI_INTEGRATION_COMPLETE.md`, `SPORTSDATAIO_INTEGRATION.md`
- **Cloudflare Workers & Edge**
  - `cloudflare-workers/blaze-trends/README.md`, `cloudflare-workers/blaze-trends/DEPLOYMENT.md`, `cloudflare-workers/blaze-trends/scripts/README.md`
- **Compliance & Legal**
  - `legal/README.md`, `legal/compliance/*`, `LEGAL-COMPLIANCE-SUMMARY.md`
- **AI Assistant Guidance**
  - `CLAUDE.md` – required operating rules for anyone (or any AI) touching this repo.

## 📊 API Surface

```
# System Health
GET /api/health

# Command Center
GET /api/sports/command-center/dashboard

# College Baseball (priority)
GET /api/sports/college-baseball/games?date=YYYY-MM-DD
GET /api/sports/college-baseball/games/:gameId
GET /api/sports/college-baseball/rankings?week=N
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
```

Authentication endpoints remain under `/api/auth/*` (login, callback, me, logout).

## 🧠 AI Assistant Guidelines & Best Practices

- Always reference real APIs (no mock data) and honor the America/Chicago timezone helpers.
- Prioritize college baseball coverage; keep mobile-first UI constraints in mind.
- Preserve cache-control and security headers; consider CDN + Cloudflare implications.
- Instrument every new endpoint with logging/metrics metadata from `observability/helpers/*`.
- When editing, consult `CLAUDE.md` for workflow, deployment order, and validation requirements.
- Document fixes in `DEPLOYMENT_LOG.md` and update monitoring scripts when touching production paths.

## 🔐 Environment Variables

Copy `.env.example` to `.env` and populate:

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

See `.env.example` for additional deployment-specific flags (Auth0, cache monitoring, alerting).

## 🎨 Technology Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes + Cloudflare Workers
- **Language**: TypeScript (Node) + Python (MMI analytics)
- **Package Manager**: pnpm
- **Infra**: Netlify (web), Cloudflare Workers/D1/KV, optional Vercel previews
- **CI/CD**: GitHub Actions with automatic cache purge + monitoring hooks

## 📝 Data Sources

- MLB: Official MLB Stats API (no key)
- NFL/NBA: SportsDataIO (requires `SPORTSDATAIO_API_KEY`)
- NCAA Football/Basketball + College Baseball: ESPN public APIs w/ custom enhancements
- Youth Sports: Internal Blaze Sports Intel APIs
- All timestamps use **America/Chicago** helpers from `@bsi/shared`.

## 🤝 Contributing

1. Fork the repository.
2. `git checkout -b feature/amazing-feature`
3. Make changes + add tests.
4. `git commit -m 'Add amazing feature'`
5. `git push origin feature/amazing-feature`
6. Open a Pull Request; CI + Netlify/Vercel previews will run automatically.

## 🧪 Testing

### Mobile Regression Tests

```bash
.claude/tests/mobile-regression.sh --create-baseline
.claude/tests/mobile-regression.sh --performance
npx playwright test tests/mobile-visual-regression.spec.ts
.claude/tests/mobile-regression.sh --all
```

### Playwright Suite

```bash
npx playwright install
npx playwright test
npx playwright test --ui
npx playwright show-report
```

## 📄 License

MIT License – see `LICENSE`.

## 🙏 Acknowledgments

- MLB Stats API for open baseball data
- SportsDataIO for pro league coverage
- ESPN for NCAA + college baseball endpoints
- Blaze Sports Intel contributors delivering real-time coverage

---

**Built with real data. No placeholders. Mobile-first.**

Blaze Sports Intel © 2025