# BSI-NextGen – Blaze Sports Intel Platform

A professional sports intelligence platform delivering **real-time, production-ready data** from official APIs. Built as a mobile-first TypeScript monorepo with pnpm workspaces and zero placeholder content.

## Platform Highlights

- **College baseball first**: Complete box scores and enhanced ESPN data
- **Real-time ingestion**: MLB Stats API + SportsDataIO (NFL/NBA) + ESPN public feeds
- **Observability by default**: Structured logs, metrics, tracing, circuit breakers, and SLOs
- **Secure deployments**: Hardened headers, automated cache purge, health verification
- **AI-native workflows**: MCP server plus documented assistant guardrails

## Monorepo Overview

```
/packages
├── shared             # @bsi/shared – shared types/utilities
├── api                # @bsi/api – sports adapters (MLB, NFL, NBA, NCAA, college baseball, youth)
├── web                # @bsi/web – Next.js 14 application
├── mmi-baseball       # Major Moments Index analytics engine (Python)
└── mcp-sportsdata-io  # Model Context Protocol server for SportsDataIO APIs
```

### Packages

#### `@bsi/shared`
- Canonical types (`Team`, `Game`, `Standing`, etc.) and timezone-aware helpers (`getTodayInChicago`, `formatDate`)
- Utility surface for cache metadata, win percentage, and auth types

#### `@bsi/api`
- Adapter layer for MLB Stats API, SportsDataIO (NFL/NBA), ESPN (NCAA/college baseball/basketball), and youth sports feeds
- Includes College Baseball gap fillers, standings, and enhanced box scores
- Exported from `packages/api/src/index.ts` for direct use in Next.js routes

#### `@bsi/web`
- Next.js App Router UI with Tailwind styling, responsive dashboards, `/trends` page, and API routes under `app/api/sports/*`
- Implements aggressive cache headers, Auth0 authentication, and production observability hooks

#### `@bsi/mcp-sportsdata-io`
- **Model Context Protocol (MCP) server** exposing eight SportsDataIO tools (college baseball priority, MLB/NFL/NBA, historical stats, live streaming, odds/projections)
- Cloudflare Worker ready (`pnpm dev`, `pnpm deploy`)
- Documentation: `packages/mcp-sportsdata-io/README.md`

#### `packages/mmi-baseball`
- **Major Moments Index (MMI)** analytics engine for MLB/college baseball
- Provides win probability, high-leverage detection, and play-by-play scoring consumed by `/api/sports/mlb/mmi/*`
- Documentation: `MMI_INTEGRATION_COMPLETE.md`, `MMI_DEPLOYMENT_SUMMARY.md`

### Sports Coverage Priority
1. **College Baseball** – ESPN gap filler with 30s refresh cadence
2. MLB
3. NFL
4. NCAA Football
5. NBA
6. NCAA Basketball and Youth Sports (newly documented endpoints below)

## Production Status (November 2025)

- ✅ **Live** on Netlify (`https://blazesportsintelligence.netlify.app`, `https://www.blazesportsintel.com`)
- ✅ **P0 Critical Fixes (Nov 20, 2025)**: `/api/health`, production monitoring script, MONITORING.md refresh
- ✅ **P1 Security Improvements (Nov 20, 2025)**: seven security headers, console cleanup, debug endpoint removal
- ✅ **Cache-Control remediation (Nov 20, 2025)**: HTML TTL 60s (s-maxage), automated CF purge, cache monitoring script
- ✅ **Homepage + Observability refresh**: live data cards, structured logging, metrics, tracing, circuit breakers
- ✅ **MMI + MCP rollouts**: MLB analytics endpoints + MCP SportsDataIO server with eight tools

## Observability & Monitoring

- **Instrumentation**: Structured logging with correlation IDs, OpenTelemetry-compatible tracing, Cloudflare Analytics Engine metrics, circuit breakers for external APIs
- **Artifacts**: `observability/README.md`, `observability/QUICK_START.md`, `observability/DEBUGGABILITY_CARD.md`, helper utilities under `observability/helpers/*`
- **SLOs**
  - Page load P95 < **2s**, error rate < **0.1%**
  - API response P99 < **200 ms**, 5xx rate < **0.5%**
  - Data freshness: live games < **30 s**, standings < **5 min**
  - External API reliability ≥ **99.5%**
- **Monitoring Setup**
  - `scripts/monitor-production.sh` – monitors `/`, `/api/health`, `/sports/mlb`
  - `./scripts/check-cache-staleness.sh` – cache age alerts (`MAX_CACHE_AGE`, `SLACK_WEBHOOK_URL`)
  - Cloudflare Analytics dashboards for worker metrics
  - Manual health check: `curl https://www.blazesportsintel.com/api/health`

## Cloudflare Workers (Documented 4/4)

| Worker | Purpose | Key Commands / Docs |
| --- | --- | --- |
| `blaze-content` | Content management + editorial automation | `cloudflare-workers/blaze-content/` |
| `blaze-ingestion` | Data ingestion pipeline + normalization | `cloudflare-workers/blaze-ingestion/` |
| `blaze-trends` | AI-powered trend detection with GPT-4 Turbo + Brave Search | `pnpm trends:dev`, `pnpm trends:deploy`, docs in `cloudflare-workers/blaze-trends/README.md` & `BLAZE-TRENDS-IMPLEMENTATION.md` |
| `longhorns-baseball` | Texas Longhorns-specific coverage | `cloudflare-workers/longhorns-baseball/` |

Full worker mapping: `docs/INFRASTRUCTURE.md`.

## Deployment

### Current Production Deployment

- **Platform**: Netlify (primary), Vercel optional
- **Build command**: `cd ../.. && CI='' pnpm install --frozen-lockfile && pnpm build`
- **Publish directory**: `packages/web/.next`
- **Node**: v18, pnpm workspace aware
- **Required env**: `SPORTSDATAIO_API_KEY`

### Security Headers (Active in `packages/web/next.config.js`)
- `Strict-Transport-Security: max-age=31536000`
- `Content-Security-Policy:` comprehensive CSP (remove `unsafe-inline/-eval` planned)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: origin-when-cross-origin`
- `Permissions-Policy: restricted`

### Deployment Workflow
1. Push/merge to `main`
2. GitHub Action runs lint/tests → Netlify build/deploy → Cloudflare cache purge
3. Health verification + alert routing
4. Optional Vercel preview for PRs

### Deployment Checklist
- **Pre-Deploy**
  - `pnpm test` and Playwright suite
  - `pnpm build` shared → api → web
  - Verify env vars, cache headers, and monitoring scripts
- **Post-Deploy**
  - Validate `/` and `/api/health`
  - Run `scripts/monitor-production.sh`
  - Verify cache headers via `curl -I`
  - Watch Cloudflare Analytics for 15 minutes

## Cache-Control Strategy & Monitoring

- **API Routes**: `public, max-age=300, s-maxage=600`
- **HTML Pages**: `public, max-age=0, s-maxage=60, must-revalidate` (prevents React hydration mismatches)
- **Static Assets** (`/_next/static/*`): `public, max-age=31536000, immutable`
- **MMI endpoints**: same as API routes plus `meta.timezone = America/Chicago`
- **Monitoring**: `./scripts/check-cache-staleness.sh` with Slack/email hooks and GitHub Action-based Cloudflare purge (see `CACHE-FIX-IMPLEMENTATION.md`)

## API Surface

### College Baseball (Priority)
```
GET /api/sports/college-baseball/games?date=YYYY-MM-DD
GET /api/sports/college-baseball/games/:gameId
GET /api/sports/college-baseball/rankings?week=N
GET /api/sports/college-baseball/standings?conference=ACC
```

### MLB
```
GET /api/sports/mlb/games?date=YYYY-MM-DD
GET /api/sports/mlb/standings?divisionId=200
GET /api/sports/mlb/teams

# Major Moments Index (MMI)
GET /api/sports/mlb/mmi/games/:gameId
GET /api/sports/mlb/mmi/high-leverage
GET /api/sports/mlb/mmi/health
```

### NFL / NBA
```
GET /api/sports/nfl/games?week=1&season=2025
GET /api/sports/nfl/standings?season=2025
GET /api/sports/nfl/teams

GET /api/sports/nba/games?date=YYYY-MM-DD
GET /api/sports/nba/standings
GET /api/sports/nba/teams
```

### NCAA + Youth Sports
```
GET /api/sports/ncaa/football/games?week=1
GET /api/sports/ncaa/football/standings?conference=12

GET /api/sports/ncaa/basketball/games?date=YYYY-MM-DD
GET /api/sports/ncaa/basketball/standings

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
GET /api/auth/callback
GET /api/auth/me
GET /api/auth/logout?returnTo=/
```

## Quick Start

### Prerequisites
- Node.js ≥ 18
- pnpm ≥ 8
- SportsDataIO API key (NFL/NBA)

### Setup
```bash
git clone https://github.com/ahump20/BSI-NextGen.git
cd BSI-NextGen
pnpm install
cp .env.example .env  # add keys per below
pnpm build            # builds shared → api → web
pnpm dev              # http://localhost:3000
```

### Auth0 Configuration
1. Create Auth0 tenant + Regular Web Application
2. Callback: `http://localhost:3000/api/auth/callback`
3. Logout URL/Web origin: `http://localhost:3000`
4. `.env` values:
   ```bash
   AUTH0_DOMAIN=your-tenant.us.auth0.com
   AUTH0_CLIENT_ID=your_client_id
   AUTH0_CLIENT_SECRET=your_client_secret
   AUTH0_AUDIENCE=https://your-api-audience
   JWT_SECRET=$(openssl rand -base64 32)
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SPORTSDATAIO_API_KEY=your_sportsdataio_api_key
   ```

### Development Commands
```bash
pnpm dev          # Next.js
pnpm dev:api      # Adapter watch mode
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm clean        # Remove build artifacts
```

### Testing
```bash
# Mobile regression helpers
.claude/tests/mobile-regression.sh --create-baseline
.claude/tests/mobile-regression.sh --performance
.claude/tests/mobile-regression.sh --all

# Playwright
npx playwright install
npx playwright test
npx playwright test --ui
npx playwright show-report
```

## Documentation Index

| Category | References |
| --- | --- |
| **Start Here** | `docs/IMPLEMENTATION_SUMMARY.md`, `QUICK_START.md` |
| **Deployment & Operations** | `DEPLOYMENT.md`, `DEPLOYMENT-READY-STATUS.md`, `DEPLOYMENT_LOG.md`, `MONITORING.md`, `scripts/monitor-production.sh` |
| **Infrastructure & Cloudflare** | `docs/INFRASTRUCTURE.md`, `BLAZE-TRENDS-IMPLEMENTATION.md`, `CLOUDFLARE-PAGES-SETUP.md`, `CLOUDFLARE-PAGES-GITHUB-SETUP.md` |
| **Observability & Reliability** | `observability/README.md`, `observability/QUICK_START.md`, `observability/DEBUGGABILITY_CARD.md`, `CACHE-FIX-IMPLEMENTATION.md`, `docs/DATABASE_MONITORING.md` |
| **Storage & Database Enhancements** | `docs/R2_STORAGE_SETUP.md`, `docs/HYPERDRIVE_SETUP.md`, `docs/PRODUCTION_SETUP.md` |
| **Analytics & MCP/MMI** | `MMI_INTEGRATION_COMPLETE.md`, `MMI_DEPLOYMENT_SUMMARY.md`, `packages/mcp-sportsdata-io/README.md`, `ANALYTICS-DEPLOYMENT-GUIDE.md` |
| **Sports Feature Guides** | `COLLEGE-BASEBALL-IMPLEMENTATION.md`, `BLAZE-TRENDS-IMPLEMENTATION.md`, `SPORTSDATAIO_INTEGRATION.md` |
| **Legal & Compliance** | `legal/README.md`, `legal/compliance/*`, `LEGAL-COMPLIANCE-SUMMARY.md` |

## AI Assistant Guidelines & Best Practices

- Always fetch **real data** (no placeholders) and respect America/Chicago timezone
- Default to **mobile-first** UI decisions; scale up to tablet/desktop
- Prioritize **college baseball** features and accuracy
- Be **cache-aware**: HTML TTL 60 s, API TTL 5/10 min; avoid introducing stale content
- Preserve **security posture**: never log secrets, honor security headers, validate envs
- Maintain **observability hooks**: emit metadata, trace IDs, and structured logs in new code
- Follow existing docs (`CLAUDE.md`) when adding endpoints, adapters, or workers

## Environment Variables

```bash
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Auth / Security
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://your-api-audience
JWT_SECRET=your_random_secret

# Sports Data
SPORTSDATAIO_API_KEY=your_sportsdataio_key
MLB_API_KEY=optional_if_available
NCAA_API_KEY=optional_if_available
D1BASEBALL_API_URL=https://d1baseball.com/api  # optional
```

## Data Sources

- **MLB**: Official MLB Stats API
- **NFL/NBA**: SportsDataIO (API key)
- **College Baseball / NCAA Football / NCAA Basketball**: ESPN public APIs (enhanced box scores)
- **Youth Sports**: Internal ingestion via `blaze-ingestion` worker
- All timestamps use **America/Chicago**

## Contributing

1. Fork the repo
2. `git checkout -b feature/awesome-improvement`
3. `pnpm lint && pnpm test`
4. `git commit -m "feat: awesome improvement"`
5. `git push origin feature/awesome-improvement`
6. Open a Pull Request

## License & Credits

- MIT License (see `LICENSE`)
- Thanks to MLB Stats API, SportsDataIO, ESPN, and the Blaze Sports Intel community

---

**Built with real data. No placeholders. Mobile-first.**

Blaze Sports Intel © 2025