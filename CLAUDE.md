# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**BSI-NextGen** is a professional sports intelligence platform built as a **TypeScript monorepo with pnpm workspaces**. The platform delivers real-time sports data from official APIs with mobile-first design.

**Core Mission:** Fill ESPN's gaps (especially college baseball box scores) with complete, real-time sports coverage.

---

## Monorepo Structure

### Workspace Packages

```
packages/
├── shared/             # @bsi/shared - Common types and utilities
├── api/                # @bsi/api - Sports data adapters
├── web/                # @bsi/web - Next.js web application
├── sports-dashboard/   # Sports dashboard components
├── mcp-sportsdata-io/  # Model Context Protocol server for SportsData.io
└── mmi-baseball/       # Major Moments Index for baseball analytics (Python)
```

### Package Dependencies

```
@bsi/web → @bsi/api → @bsi/shared
                 ↘
          sports-dashboard
          mcp-sportsdata-io → SportsData.io APIs
          mmi-baseball (Python package)
```

---

## Common Commands

### Development

```bash
# Install all dependencies
pnpm install

# Build all packages (required before first dev run)
pnpm build

# Start web dev server (Next.js)
pnpm dev                    # http://localhost:3000

# Start API in watch mode
pnpm dev:api                # TypeScript watch mode

# Build production
pnpm build                  # Builds shared → api → web in order
```

### Package-Specific Commands

```bash
# Run command in specific package
pnpm --filter @bsi/web dev
pnpm --filter @bsi/api build
pnpm --filter @bsi/shared test

# Run command in all packages
pnpm -r build               # Recursive build
pnpm -r clean               # Clean all packages
```

### Testing

```bash
# Playwright E2E tests
npx playwright install      # Install browsers (first time only)
npx playwright test         # Run all tests
npx playwright test --ui    # UI mode
npx playwright show-report  # Show test results

# Mobile regression tests
.claude/tests/mobile-regression.sh --create-baseline
.claude/tests/mobile-regression.sh --performance
.claude/tests/mobile-regression.sh --all

# SportsDataIO Integration Test
pnpm test:sportsdataio        # Test NFL and NBA API integration
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

### Clean & Reset

```bash
# Remove all build artifacts and node_modules
pnpm clean

# Full reset (clean + reinstall)
pnpm clean && pnpm install
```

### Cloudflare Workers

BSI-NextGen uses multiple Cloudflare Workers for edge computing:

#### Blaze Trends Worker

**Purpose:** Real-time sports news monitoring with AI-powered trend analysis

```bash
# Local development
pnpm trends:dev              # Start worker (http://localhost:8787)

# Deployment
pnpm trends:deploy           # Deploy to Cloudflare

# Monitoring
pnpm trends:tail             # View real-time logs
pnpm trends:health           # Health check all endpoints

# Database management
pnpm trends:db list          # List recent trends
pnpm trends:db stats         # Database statistics
pnpm trends:db errors        # View error logs
pnpm trends:db help          # Show all db commands

# Initial setup
pnpm trends:setup            # Run setup wizard
```

**Key Features:**
- AI-powered trend identification with OpenAI GPT-4 Turbo
- Multi-sport news aggregation via Brave Search API
- Automated monitoring every 15 minutes (cron)
- Edge computing with Cloudflare Workers
- D1 database for persistence
- KV caching for <10ms response times

**API Endpoints:**
- `GET /health` - Health check
- `GET /api/trends` - Get all trends
- `GET /api/trends?sport=college_baseball` - Filter by sport
- `GET /api/trends/:id` - Get specific trend
- `GET /cron/monitor` - Manual monitoring trigger

**Documentation:**
- `cloudflare-workers/blaze-trends/README.md` - Technical overview
- `cloudflare-workers/blaze-trends/DEPLOYMENT.md` - Deployment guide
- `cloudflare-workers/blaze-trends/scripts/README.md` - Script documentation
- `BLAZE-TRENDS-IMPLEMENTATION.md` - Complete implementation summary

**Frontend Integration:**
- `/trends` page in Next.js app
- Components: `TrendCard`, `SportFilter`
- Types: `packages/web/types/trends.ts`

#### Blaze Content Worker

**Purpose:** Content management and media handling

**Location:** `cloudflare-workers/blaze-content/`

**Features:**
- Media upload and storage
- Content delivery optimization
- Image processing and transformations

#### Blaze Ingestion Worker

**Purpose:** Data ingestion pipeline for sports data

**Location:** `cloudflare-workers/blaze-ingestion/`

**Features:**
- Real-time data ingestion from multiple sources
- Data transformation and normalization
- Queue management for batch processing

#### Longhorns Baseball Worker

**Purpose:** Texas Longhorns baseball specific data and features

**Location:** `cloudflare-workers/longhorns-baseball/`

**Features:**
- Team-specific schedules and scores
- Player statistics and rosters
- Game highlights and recaps

**Complete Infrastructure:**
See `docs/INFRASTRUCTURE.md` for complete worker mapping (72 total workers documented, 18 D1 databases, 20+ KV stores).

---

## Architecture

### Package: `@bsi/shared`

**Purpose:** Shared TypeScript types and utility functions used across all packages.

**Key Exports:**
```typescript
// Types
export type Team = { id: string; name: string; abbreviation: string; /* ... */ };
export type Game = { id: string; homeTeam: Team; awayTeam: Team; /* ... */ };
export type Standing = { team: Team; wins: number; losses: number; /* ... */ };

// Utilities
export function formatDate(date: Date): string;           // America/Chicago timezone
export function calculateWinPercentage(wins: number, losses: number): string;
export function getTodayInChicago(): string;              // YYYY-MM-DD format
```

**Location:** `packages/shared/src/`

### Package: `@bsi/api`

**Purpose:** Sports data adapters for fetching from official APIs.

**Adapters:**
- `MLBAdapter` - MLB Stats API (free, official)
- `NFLAdapter` - SportsDataIO (requires API key)
- `NBAAdapter` - SportsDataIO (requires API key)
- `NCAAFootballAdapter` - ESPN public API
- `NCAABasketballAdapter` - ESPN public API
- `CollegeBaseballAdapter` - ESPN API + enhanced box scores
- `YouthSportsAdapter` - Youth sports data management

**Usage Pattern:**
```typescript
import { MLBAdapter } from '@bsi/api';

const adapter = new MLBAdapter({ apiKey: process.env.MLB_API_KEY });

// Fetch games
const games = await adapter.getGames({ date: '2025-01-11' });

// Fetch standings
const standings = await adapter.getStandings({ divisionId: '200' });

// Fetch teams
const teams = await adapter.getTeams();
```

**Location:** `packages/api/src/adapters/`

### Package: `@bsi/web`

**Purpose:** Next.js 14 web application with mobile-first UI.

**Key Features:**
- App Router (Next.js 14)
- Tailwind CSS styling
- API Routes for serving sports data
- Real-time game updates
- Responsive design

**Directory Structure:**
```
packages/web/
├── app/
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout
│   ├── api/
│   │   └── sports/           # API routes
│   │       ├── mlb/
│   │       ├── nfl/
│   │       ├── nba/
│   │       ├── college-baseball/
│   │       ├── ncaa/
│   │       ├── youth-sports/
│   │       └── command-center/
│   ├── sports/
│   │   ├── mlb/              # MLB pages
│   │   ├── nfl/              # NFL pages
│   │   ├── nba/              # NBA pages
│   │   ├── college-baseball/ # College baseball pages
│   │   ├── ncaa-football/    # NCAA football pages
│   │   ├── ncaa-basketball/  # NCAA basketball pages
│   │   └── youth-sports/     # Youth sports pages
│   ├── trends/               # Blaze Trends page
│   ├── privacy/              # Privacy policy
│   └── cookies/              # Cookie settings
├── components/               # React components
├── lib/                      # Utilities
└── public/                   # Static assets
```

### Package: `@bsi/mcp-sportsdata-io`

**Purpose:** Model Context Protocol (MCP) server for SportsData.io API integration.

**Key Features:**
- 8 specialized tools for sports data retrieval
- Priority #1: College Baseball (fills ESPN gaps)
- Multi-sport support: MLB, NFL, NCAA Football, NCAA Basketball
- Real-time data with play-by-play feeds
- Cloudflare Workers deployment
- Intelligent caching and batching to minimize API calls
- Rate limit handling with exponential backoff

**Tools:**
1. `fetch_college_baseball_data` - Priority #1 college baseball coverage
   - Examples: "Get today's D1 baseball scores", "Fetch Texas Longhorns roster", "Show SEC standings"
   - Complete box scores, rosters, standings, player stats
2. `fetch_mlb_data` - MLB games, scores, player stats, team info, standings
   - Examples: "Get Cardinals game score", "Fetch current MLB standings", "Player stats for [name]"
3. `fetch_nfl_data` - NFL games, scores, player stats, team info, standings, injury reports
   - Examples: "Get Titans game score", "Current NFL standings", "Injury report for [team]"
4. `fetch_college_football_data` - College football with FCS focus
   - Examples: "Get FCS playoff scores", "Texas Longhorns schedule", "Top 25 rankings"
   - Priority on FCS and Group-of-Five programs
5. `fetch_ncaa_basketball_data` - NCAA basketball and March Madness
   - Examples: "Get today's games", "March Madness bracket", "Team stats for [school]"
6. `stream_live_game_data` - Real-time play-by-play updates
   - Examples: "Stream Cardinals game updates", "Live play-by-play for Texas vs Oklahoma"
   - Optimized for mobile push notifications
7. `fetch_historical_stats` - Historical season and career stats
   - Examples: "College baseball stats 2020-2024", "Cardinals franchise history", "Player career stats"
8. `fetch_odds_and_projections` - Betting lines, odds, statistical projections
   - Examples: "Get spread for [game]", "Win probability model inputs", "Over/under trends"
   - For analysis only

**Installation & Setup:**
```bash
# Install dependencies
cd packages/mcp-sportsdata-io
pnpm install

# Environment variables (create .env file)
SPORTSDATA_CFB_KEY=your_cfb_key_here
SPORTSDATA_MLB_KEY=your_mlb_key_here
SPORTSDATA_NFL_KEY=your_nfl_key_here
SPORTSDATA_NCAABB_KEY=your_ncaabb_key_here
```

**Usage:**
```bash
# Local development
cd packages/mcp-sportsdata-io
pnpm dev

# Build TypeScript
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy
```

**MCP Client Configuration:**
Add to your MCP client config (e.g., Claude Desktop):
```json
{
  "mcpServers": {
    "sportsdata-io": {
      "command": "node",
      "args": ["path/to/BSI-NextGen/packages/mcp-sportsdata-io/dist/sportsdata-io-mcp-server.js"],
      "env": {
        "SPORTSDATA_CFB_KEY": "your_cfb_key",
        "SPORTSDATA_MLB_KEY": "your_mlb_key",
        "SPORTSDATA_NFL_KEY": "your_nfl_key",
        "SPORTSDATA_NCAABB_KEY": "your_ncaabb_key"
      }
    }
  }
}
```

**Response Format:**
All responses follow this structure:
```json
{
  "sport": "college_baseball",
  "instruction": "Get today's SEC baseball scores",
  "timestamp": "Nov 9, 2024 12:30 PM CST",
  "data": [...],
  "source": "SportsData.io College Baseball API"
}
```

**API Rate Limits:**
- Trial: 1 call/second, 1000 calls/month
- Basic: 2 calls/second, 10,000 calls/month
- Pro: 5 calls/second, 100,000 calls/month

The MCP server implements intelligent caching and batching to minimize API calls.

**Timezone:** All timestamps use **America/Chicago** timezone to match the BSI-NextGen platform standard.

**Location:** `packages/mcp-sportsdata-io/`

**Documentation:** `packages/mcp-sportsdata-io/README.md`

### Package: `mmi-baseball`

**Purpose:** Major Moments Index (MMI) - Python package for baseball analytics.

**What is MMI?**
The **Moment Mentality Index (MMI)** is a per-pitch metric that quantifies how mentally demanding a moment is for a baseball player. MMI combines leverage, pressure, fatigue, execution difficulty, and bio-behavioral signals into a single, normalized score.

**MMI Formula:**
```
MMI = 0.35·z(LI) + 0.20·z(Pressure) + 0.20·z(Fatigue) + 0.15·z(Execution) + 0.10·z(Bio)
```

Where:
- **z()** = z-score normalization (standardized to league averages)
- **LI** = Leverage Index (win probability swing potential) - 35% weight
- **Pressure** = Game context pressure (closeness, crowd, stakes) - 20% weight
- **Fatigue** = Cumulative physical/mental wear - 20% weight
- **Execution** = Technical difficulty of the task - 15% weight
- **Bio** = Behavioral/physiological proxies - 10% weight

**Key Features:**
- Advanced baseball analytics and moment scoring
- Play-by-play analysis with per-pitch MMI calculation
- Win probability calculations and leverage index
- High-leverage situation detection
- Player-level aggregation and summaries
- Python-based analytics engine
- REST API for integration
- CLI tools for batch processing

**Installation:**
```bash
cd packages/mmi-baseball
pip install -e .

# Install dependencies
pip install -r requirements.txt
```

**Required Dependencies:**
- Python 3.11+
- pydantic
- requests
- numpy

**Optional Dependencies:**
- pandas (for CSV/Parquet export)
- fastapi + uvicorn (for REST API)
- scikit-learn (for validation experiments)
- matplotlib (for visualizations)

**Quick Start:**
```python
from datetime import date
from mmi.data_ingest import fetch_game_pitches
from mmi.scaling import create_default_scalers
from mmi.aggregate import compute_game_mmi

# Fetch game data
game_id = "662253"
pitches = fetch_game_pitches(game_id)

# Create or load scalers (normalization parameters)
scaler_set = create_default_scalers()
league_stats = scaler_set.to_league_stats()

# Compute MMI for all pitches (pitcher perspective)
mmi_results = compute_game_mmi(game_id, pitches, league_stats, role="pitcher")

# Print top 5 highest MMI pitches
top_moments = sorted(mmi_results, key=lambda r: r.mmi, reverse=True)[:5]
for result in top_moments:
    print(f"Pitch {result.pitch_id}: MMI = {result.mmi:.2f}")
```

**CLI Usage:**
```bash
# Fetch games for a date
mmi fetch-games --date 2024-06-15 --out games.json

# Compute MMI for a game
mmi compute-game --game-id 662253 --role pitcher --out game_mmi.json

# Summarize a season
mmi summarize-season --year 2024 --role pitcher --input season_data.json --out summaries.csv
```

**REST API:**
```bash
# Start the API server
uvicorn mmi.api:app --reload

# Query endpoints
curl http://localhost:8000/games/662253/mmi?role=pitcher
curl http://localhost:8000/games/date/2024-06-15
curl http://localhost:8000/health
```

**Integration:** Available via `/api/sports/mlb/mmi/*` endpoints

**MMI API Endpoints:**
- `GET /api/sports/mlb/mmi/games/:gameId` - Get MMI score for a game
- `GET /api/sports/mlb/mmi/high-leverage` - High-leverage moments
- `GET /api/sports/mlb/mmi/health` - MMI service health check

**Use Cases:**
1. **Identify Clutch Performers** - Find players with highest average MMI in high-leverage situations
2. **Pitcher Workload Management** - Track cumulative high-MMI exposure
3. **Game Narrative Analysis** - Find the most intense moment of a game

**Architecture:**
```
mmi/
├── models.py          # Pydantic data models
├── data_ingest.py     # MLB StatsAPI client and parsers
├── win_prob.py        # Win probability and leverage index
├── features.py        # Pressure, Fatigue, Execution, Bio calculators
├── scaling.py         # Z-score normalization
├── mmi_core.py        # Core MMI computation
├── aggregate.py       # Game and player aggregation
├── cli.py             # Command-line interface
├── api.py             # FastAPI REST API
└── config.py          # Configuration constants
```

**Location:** `packages/mmi-baseball/`

**Documentation:**
- `packages/mmi-baseball/README.md` - Complete package documentation
- `MMI_INTEGRATION_COMPLETE.md` - Integration guide
- `MMI_DEPLOYMENT_SUMMARY.md` - Deployment status

---

## Development Workflow

### Adding a New Sports Adapter

1. **Create adapter** in `packages/api/src/adapters/`:
   ```typescript
   // packages/api/src/adapters/hockey-adapter.ts
   import { Game, Team } from '@bsi/shared';

   export class HockeyAdapter {
     constructor(private config: { apiKey: string }) {}

     async getGames(params: { date: string }): Promise<Game[]> {
       // Fetch from API
       // Transform to shared types
       return games;
     }
   }
   ```

2. **Export from index**:
   ```typescript
   // packages/api/src/index.ts
   export * from './adapters/hockey-adapter';
   ```

3. **Build API package**:
   ```bash
   pnpm --filter @bsi/api build
   ```

4. **Create API route** in `packages/web/app/api/sports/hockey/`:
   ```typescript
   // packages/web/app/api/sports/hockey/games/route.ts
   import { HockeyAdapter } from '@bsi/api';
   import { NextRequest, NextResponse } from 'next/server';

   export async function GET(request: NextRequest) {
     const searchParams = request.nextUrl.searchParams;
     const date = searchParams.get('date') || getTodayInChicago();

     const adapter = new HockeyAdapter({
       apiKey: process.env.HOCKEY_API_KEY!
     });

     const games = await adapter.getGames({ date });

     return NextResponse.json(games);
   }
   ```

5. **Create frontend page**:
   ```typescript
   // packages/web/app/sports/hockey/page.tsx
   import { HockeySchedule } from '@/components/sports/HockeySchedule';

   export default function HockeyPage() {
     return <HockeySchedule />;
   }
   ```

### Adding Shared Types

1. **Add to shared package**:
   ```typescript
   // packages/shared/src/types.ts
   export interface Player {
     id: string;
     name: string;
     position: string;
     jerseyNumber: number;
   }
   ```

2. **Build shared package**:
   ```bash
   pnpm --filter @bsi/shared build
   ```

3. **Use in other packages** (no rebuild needed - workspace linking):
   ```typescript
   import { Player } from '@bsi/shared';
   ```

---

## API Routes

### Next.js API Route Pattern

```typescript
// packages/web/app/api/sports/[sport]/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Extract query params
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  // Fetch data
  const data = await fetchData(date);

  // Return JSON
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handle POST
  return NextResponse.json({ success: true });
}
```

### Available API Endpoints

```
# MLB
GET /api/sports/mlb/games?date=2025-01-11
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
GET /api/sports/nba/games?date=2025-01-11
GET /api/sports/nba/standings
GET /api/sports/nba/teams

# NCAA Football
GET /api/sports/ncaa/football/games?week=1
GET /api/sports/ncaa/football/standings?conference=12

# NCAA Basketball
GET /api/sports/ncaa/basketball/games?date=2025-01-11
GET /api/sports/ncaa/basketball/standings

# College Baseball
GET /api/sports/college-baseball/games?date=2025-01-11
GET /api/sports/college-baseball/games/:gameId
GET /api/sports/college-baseball/standings?conference=ACC
GET /api/sports/college-baseball/rankings

# Youth Sports
GET /api/sports/youth-sports/games
GET /api/sports/youth-sports/teams
GET /api/sports/youth-sports/perfect-game/tournaments
GET /api/sports/youth-sports/texas-hs-football/scores
GET /api/sports/youth-sports/texas-hs-football/standings

# Command Center (Multi-sport dashboard)
GET /api/sports/command-center
GET /api/sports/command-center/dashboard

# System Health
GET /api/health
```

---

## Environment Variables

### Required

```bash
# SportsDataIO (for NFL/NBA)
SPORTSDATAIO_API_KEY=your_api_key_here
```

### Optional

```bash
# Next.js environment
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://blazesportsintel.com

# API keys for additional sports
MLB_API_KEY=your_key_here
NCAA_API_KEY=your_key_here
```

### Environment Setup

1. Copy example: `cp .env.example .env`
2. Add your API keys to `.env`
3. Never commit `.env` to git (already in `.gitignore`)

---

## Deployment

### Current Production Deployment

**Platform:** Netlify
**Production URL:** https://blazesportsintelligence.netlify.app
**Alternate URL:** https://www.blazesportsintel.com
**Deployment Status:** ✅ Live

**Build Configuration:**
- **Build Command:** `cd ../.. && CI='' pnpm install --frozen-lockfile && pnpm build`
- **Publish Directory:** `packages/web/.next`
- **Node Version:** 18
- **Base Directory:** `packages/web`
- **Plugin:** `@netlify/plugin-nextjs`

**Environment Variables (Required):**
- `SPORTSDATAIO_API_KEY` - SportsDataIO API key for NFL/NBA data

**Auto-deploy:**
- ✅ Pushes to `main` branch deploy automatically
- ✅ PR previews enabled
- ✅ Automatic cache purge via GitHub Actions

**Security Headers (Deployed):**
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security: max-age=31536000
- ✅ Content-Security-Policy: Comprehensive CSP
- ✅ Referrer-Policy: origin-when-cross-origin
- ✅ Permissions-Policy: Restricted device permissions

**Configuration Files:**
- `netlify.toml` - Netlify build configuration
- `packages/web/next.config.js` - Next.js configuration with security headers

### Deployment Workflow

**GitHub Actions:** `.github/workflows/deploy-with-cache-purge.yml`

The deployment workflow includes:
1. ✅ **Test & Build** - Runs tests, builds all packages in dependency order
2. ✅ **Deploy to Netlify** - Automatic deployment on push to `main`
3. ✅ **Purge Cloudflare Cache** - Automatic cache purge after successful deployment
4. ✅ **Verify Deployment** - Checks critical endpoints are responding
5. ✅ **Notify Success** - Optional Slack/PagerDuty notifications

**Workflow Triggers:**
- Push to `main` branch → Production deployment
- Pull request → Preview deployment (no cache purge)
- Manual workflow dispatch → On-demand deployment

**Required GitHub Secrets:**
- `CLOUDFLARE_CACHE_PURGE_TOKEN` - Cloudflare API token with cache purge permission
- `NETLIFY_AUTH_TOKEN` - Netlify authentication token
- `NETLIFY_SITE_ID` - Netlify site identifier
- `SLACK_WEBHOOK_URL` - Optional Slack notifications
- `PAGERDUTY_INTEGRATION_KEY` - Optional PagerDuty alerts

**Manual Cache Purge:**
```bash
# Via Cloudflare Dashboard (Recommended)
# 1. Go to: https://dash.cloudflare.com/
# 2. Select: blazesportsintel.com
# 3. Caching → Configuration → Purge Everything

# Via API
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer {api_token}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

**Deployment Verification:**
```bash
# Check deployment status
curl -I https://blazesportsintelligence.netlify.app/

# Verify health endpoint
curl https://blazesportsintelligence.netlify.app/api/health | jq

# Check cache age
curl -sI https://blazesportsintel.com/ | grep "age:"
# Should show: age: < 90 seconds
```

### Deployment Checklist

**Before Deploying:**
- [ ] All tests passing (`pnpm test`)
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Type check passes (`pnpm type-check`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Environment variables configured in Netlify
- [ ] Cache headers reviewed (60s for HTML, 5min for API)
- [ ] Security headers verified (7/7 deployed)
- [ ] Health check endpoint responding locally
- [ ] Monitoring scripts tested
- [ ] Observability helpers integrated (if new endpoints)
- [ ] Error handling comprehensive
- [ ] API rate limits considered

**During Deployment:**
- [ ] GitHub Actions workflow triggered
- [ ] Build completes successfully
- [ ] Netlify deployment succeeds
- [ ] Cloudflare cache purge executes
- [ ] Verification checks pass

**After Deployment:**
- [ ] Verify homepage loads (https://blazesportsintelligence.netlify.app)
- [ ] Test critical API endpoints:
  - `/api/health` - Health check
  - `/api/sports/mlb/games` - MLB data
  - `/api/sports/nfl/games` - NFL data (if API key configured)
- [ ] Check `/api/health` endpoint response format
- [ ] Monitor error rates for 15 minutes (Cloudflare Dashboard)
- [ ] Verify cache headers with `curl -I https://blazesportsintel.com/`
- [ ] Check Cloudflare Analytics dashboard for anomalies
- [ ] Verify security headers present (all 7 headers)
- [ ] Test cache staleness script: `./scripts/check-cache-staleness.sh`
- [ ] Run production monitoring: `./scripts/monitor-production.sh`
- [ ] Document any issues in `DEPLOYMENT_LOG.md`

**Rollback Procedure:**
If deployment fails:
1. Check GitHub Actions logs for error details
2. Verify Netlify deployment status
3. Check Cloudflare cache purge status
4. If needed, manually purge cache via Cloudflare Dashboard
5. Revert commit if critical issue: `git revert HEAD`
6. Document issue in `DEPLOYMENT_LOG.md`

### Alternative: Vercel Deployment

**Framework Preset:** Next.js
**Root Directory:** `packages/web`
**Build Command:** `cd ../.. && pnpm build`
**Output Directory:** Default (`.next`)

**Environment Variables:**
- Set in Vercel Dashboard → Project → Settings → Environment Variables
- Add `SPORTSDATAIO_API_KEY`

**Auto-deploy:**
- Pushes to `main` → Production
- PR pushes → Preview deployments

### Deployment Documentation

- `DEPLOYMENT.md` - General deployment procedures
- `DEPLOYMENT-READY-STATUS.md` - Pre-deployment status
- `DEPLOYMENT_LOG.md` - Recent deployment history
- `CACHE-FIX-IMPLEMENTATION.md` - Cache control implementation
- `observability/PRODUCTION_DEPLOYMENT_GUIDE.md` - Observability deployment

---

## Testing Strategy

### Playwright E2E Tests

Located in `tests/` directory:

```typescript
// tests/mobile-visual-regression.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test('homepage loads on mobile', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page.locator('h1')).toBeVisible();
});
```

**Run Tests:**
```bash
# Headless mode
npx playwright test

# UI mode (interactive)
npx playwright test --ui

# Specific test file
npx playwright test tests/mobile-visual-regression.spec.ts

# Debug mode
npx playwright test --debug
```

### Mobile Regression Tests

**Create Baseline:**
```bash
.claude/tests/mobile-regression.sh --create-baseline
```

**Run Regression Tests:**
```bash
# Performance tests
.claude/tests/mobile-regression.sh --performance

# Visual tests
.claude/tests/mobile-regression.sh --visual

# All tests
.claude/tests/mobile-regression.sh --all
```

---

## Infrastructure & Operations

### Observability & Monitoring

**Location:** `observability/`

BSI-NextGen has comprehensive production observability infrastructure:

**Key Components:**
1. **Structured Logging** - JSON-formatted logs with correlation IDs
2. **Metrics Recording** - Cloudflare Analytics Engine integration
3. **Distributed Tracing** - OpenTelemetry-compatible tracing
4. **Circuit Breakers** - Automatic failure protection for external APIs
5. **Health Checks** - Production health monitoring endpoints

**Observability Helpers:**
- `observability/helpers/telemetry.ts` - Logging, metrics, tracing
- `observability/helpers/middleware.ts` - Request instrumentation
- `observability/helpers/circuit-breaker.ts` - Failure protection

**Service Level Objectives (SLOs):**

| SLO | File | Key Targets |
|-----|------|-------------|
| **Page Load Performance** | `observability/slos/page-load-performance.yaml` | P95 <2s, Error rate <0.1% |
| **API Response Time** | `observability/slos/api-response-time.yaml` | P99 <200ms, 5xx rate <0.5% |
| **Data Freshness** | `observability/slos/data-freshness.yaml` | Live games <30s, Standings <5min |
| **External API Reliability** | `observability/slos/external-api-reliability.yaml` | 99.5% success, <5 circuit trips/day |

**SLO Location:** `observability/slos/`

**Key Metrics:**
- **Request Metrics:**
  - `http.request.count` - Counter with dimensions: method, status, endpoint, sport
  - `http.request.duration` - Histogram with dimensions: method, endpoint, sport
  - `http.request.errors` - Counter with dimensions: method, endpoint, error_type

- **External API Metrics:**
  - `external_api.duration` - Histogram with dimensions: sport, endpoint, provider
  - `external_api.errors` - Counter with dimensions: sport, provider, error_type

- **Circuit Breaker Metrics:**
  - `circuit_breaker.state_change` - Counter with dimensions: circuit, from, to
  - `circuit_breaker.rejected` - Counter with dimensions: circuit, state

**Performance Overhead:**
- Structured Logging: <1ms
- Metrics Recording: <2ms
- Tracing: <1ms
- Circuit Breaker: <0.5ms
- **Total: ~5ms per request (<1% of typical request)**

**Documentation:**
- `observability/README.md` - Observability overview (START HERE)
- `observability/QUICK_START.md` - 5-minute quick start
- `observability/DEBUGGABILITY_CARD.md` - Incident response guide
- `observability/RUNBOOK.md` - Operational procedures
- `observability/PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment steps

**Monitoring Commands:**
```bash
# Check production health
curl https://www.blazesportsintel.com/api/health

# Monitor production endpoints
./scripts/monitor-production.sh

# Check cache staleness
./scripts/check-cache-staleness.sh
```

### Production Monitoring

**Health Check Endpoint:** `GET /api/health`

**Response Format:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-20T18:30:00.000Z",
  "timezone": "America/Chicago",
  "response_time_ms": 45,
  "checks": {
    "database": "not_configured",
    "external_apis": "healthy",
    "environment": "healthy"
  },
  "version": "1.0.0"
}
```

**Monitoring Script:** `scripts/monitor-production.sh`
- Monitors multiple endpoints (/, /api/health, /sports/mlb)
- Email alerts via ALERT_EMAIL environment variable
- Slack alerts via SLACK_WEBHOOK_URL
- Exit codes for CI/CD integration

**Documentation:** `MONITORING.md`

### Infrastructure Documentation

Located in `docs/`:

1. **[INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)** - Architecture overview
   - 72 Cloudflare Workers mapped
   - 18 D1 databases documented
   - 20+ KV stores tracked
   - Mermaid diagrams

2. **[R2_STORAGE_SETUP.md](./docs/R2_STORAGE_SETUP.md)** - HIGH PRIORITY
   - Media storage implementation guide
   - File upload/download workers
   - CORS configuration
   - Cost: ~$10/month

3. **[HYPERDRIVE_SETUP.md](./docs/HYPERDRIVE_SETUP.md)** - MEDIUM PRIORITY
   - Database connection pooling
   - 50-80% query performance improvement
   - Phased rollout strategy

4. **[DATABASE_MONITORING.md](./docs/DATABASE_MONITORING.md)** - MEDIUM PRIORITY
   - Monitoring worker implementation
   - Alerts and dashboards
   - Growth rate tracking

5. **[OPERATIONAL_RUNBOOKS.md](./docs/OPERATIONAL_RUNBOOKS.md)** - HIGH PRIORITY
   - Deployment procedures
   - Incident response
   - Backup/recovery
   - Security protocols

6. **[IMPLEMENTATION_SUMMARY.md](./docs/IMPLEMENTATION_SUMMARY.md)** - START HERE
   - Overview of all guides
   - Implementation roadmap
   - Success metrics

7. **[PRODUCTION_SETUP.md](./docs/PRODUCTION_SETUP.md)** - Production configuration
8. **[SENTRY-SETUP-GUIDE.md](./docs/SENTRY-SETUP-GUIDE.md)** - Error tracking setup

### Implementation Priorities

**Phase 1 (Week 1-2):** R2 Storage Setup
**Phase 2 (Week 3-6):** Hyperdrive Configuration
**Phase 3 (Week 7-8):** Database Monitoring

---

## Sports Data Sources

### MLB
- **API:** Official MLB Stats API (free)
- **Base URL:** `https://statsapi.mlb.com/api/v1`
- **Documentation:** [MLB Stats API](https://github.com/toddrob99/MLB-StatsAPI)
- **No API Key Required**

### NFL
- **API:** SportsDataIO
- **Base URL:** `https://api.sportsdata.io/v3/nfl`
- **Documentation:** [SportsDataIO NFL](https://sportsdata.io/developers/api-documentation/nfl)
- **Requires API Key:** `SPORTSDATAIO_API_KEY`

### NBA
- **API:** SportsDataIO
- **Base URL:** `https://api.sportsdata.io/v3/nba`
- **Documentation:** [SportsDataIO NBA](https://sportsdata.io/developers/api-documentation/nba)
- **Requires API Key:** `SPORTSDATAIO_API_KEY`

### NCAA Football
- **API:** ESPN Public API
- **Base URL:** `https://site.api.espn.com/apis/site/v2/sports/football/college-football`
- **No API Key Required**

### College Baseball
- **API:** ESPN Public API (enhanced)
- **Base URL:** `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball`
- **Enhancement:** Add complete box scores (ESPN gap filler)
- **No API Key Required**

### NCAA Basketball
- **API:** ESPN Public API
- **Base URL:** `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball`
- **No API Key Required**

### Youth Sports
- **Purpose:** Local youth sports leagues and tournaments
- **Data Management:** Internal API for community sports coverage
- **Features:** Schedules, scores, team rosters, standings
- **No External API Required**

---

## Common Patterns

### Data Transformation

Always transform external API data to shared types:

```typescript
import { Game, Team } from '@bsi/shared';

class ExternalAdapter {
  private transformGame(externalData: any): Game {
    return {
      id: externalData.gameId,
      homeTeam: this.transformTeam(externalData.home),
      awayTeam: this.transformTeam(externalData.away),
      startTime: externalData.scheduledTime,
      status: externalData.gameStatus,
      venue: externalData.venueName,
      // ... other fields
      meta: {
        dataSource: 'External API Name',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };
  }

  private transformTeam(externalTeam: any): Team {
    return {
      id: externalTeam.teamId,
      name: externalTeam.fullName,
      abbreviation: externalTeam.abbr,
      // ... other fields
    };
  }
}
```

### Error Handling

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

### Caching Strategy

**IMPORTANT:** BSI-NextGen uses aggressive cache control to prevent stale content and React hydration errors.

```typescript
// API Routes - Data endpoints
export async function GET(request: NextRequest) {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      // Browser cache: 5 minutes
      // CDN cache: 10 minutes
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
```

**HTML Pages Cache Control:**

Configured in `packages/web/next.config.js`:

```javascript
{
  // HTML pages: Short CDN cache to prevent stale content
  source: '/:path((?!_next|api).*)*',
  headers: [
    {
      key: 'Cache-Control',
      // Browser: always revalidate
      // CDN: cache for 60 seconds, then revalidate
      // Prevents hydration mismatches from stale HTML
      value: 'public, max-age=0, s-maxage=60, must-revalidate',
    },
  ],
},
{
  // Static assets: Long cache with immutable (versioned by Next.js)
  source: '/_next/static/:path*',
  headers: [
    {
      key: 'Cache-Control',
      // 1 year cache - safe because Next.js versions these files
      value: 'public, max-age=31536000, immutable',
    },
  ],
}
```

**Why This Matters:**
- Prevents 500 errors from HTML/JS version mismatches
- Ensures users always get fresh content after deployment
- Static assets still cached aggressively (1 year) with versioned URLs
- CDN cache limited to 60 seconds for HTML prevents stale content

**Cache Monitoring:**
```bash
# Check for cache staleness
./scripts/check-cache-staleness.sh

# Monitor with alerts
MAX_CACHE_AGE=90 SLACK_WEBHOOK_URL="..." ./scripts/check-cache-staleness.sh

# Manual cache check
curl -sI https://blazesportsintel.com/ | grep -i "cache\|age"
# Expected: cache-control: public, max-age=0, s-maxage=60, must-revalidate
# Expected: age: < 90 seconds
```

**Cache Strategy Summary:**
- **HTML Pages:** 60 seconds CDN cache (prevents stale content, React hydration errors)
- **API Endpoints:** 5 minutes browser, 10 minutes CDN (data freshness balance)
- **Static Assets:** 1 year immutable (safe, versioned by Next.js)
- **Automated Purge:** GitHub Actions purges cache after every deployment
- **Monitoring:** Alerts if cache exceeds 90 seconds

**Why This Matters:**
- Prevents 500 errors from HTML/JS version mismatches
- Ensures users always get fresh content after deployment
- Static assets still cached aggressively (1 year) with versioned URLs
- CDN cache limited to 60 seconds for HTML prevents stale content
- Automatic cache purge eliminates manual intervention

**Documentation:** `CACHE-FIX-IMPLEMENTATION.md`

---

## Timezone

All timestamps use **America/Chicago** timezone:

```typescript
import { getTodayInChicago, formatDateInChicago } from '@bsi/shared';

const today = getTodayInChicago();        // "2025-01-11"
const formatted = formatDateInChicago(new Date()); // "Jan 11, 2025 2:30 PM CST"
```

Always include timezone in API responses:

```typescript
{
  data: games,
  meta: {
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago'
  }
}
```

---

## Troubleshooting

### Build Fails

```bash
# Clean and reinstall
pnpm clean
pnpm install
pnpm build
```

### Type Errors in Web Package

```bash
# Rebuild shared and api packages
pnpm --filter @bsi/shared build
pnpm --filter @bsi/api build
```

### Dev Server Won't Start

```bash
# Make sure all packages are built first
pnpm build

# Then start dev server
pnpm dev
```

### Workspace Dependencies Not Updating

```bash
# Rebuild the dependency
pnpm --filter @bsi/shared build

# Restart dev server
pnpm dev
```

---

## Resources

- **Next.js 14:** https://nextjs.org/docs
- **pnpm Workspaces:** https://pnpm.io/workspaces
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Playwright:** https://playwright.dev/
- **TypeScript:** https://www.typescriptlang.org/docs
- **Netlify:** https://docs.netlify.com/
- **Vercel:** https://vercel.com/docs

---

## Production Status & Recent Updates

### Current Production Status (November 2025)

**Deployment:** ✅ Live on Netlify
**URL:** https://blazesportsintelligence.netlify.app
**Status:** Stable and monitored

**Recent Major Updates:**
1. ✅ **P0 Critical Fixes** (Nov 20, 2025)
   - Health check endpoint deployed (`/api/health`)
   - Production monitoring script implemented
   - Complete monitoring documentation (MONITORING.md)

2. ✅ **P1 Security Improvements** (Nov 20, 2025)
   - Security headers implemented (7/7 deployed)
   - Console logging cleanup in production routes
   - Debug endpoint removed
   - Security audit passed (0 vulnerabilities)

3. ✅ **Cache Control Fix** (Nov 20, 2025)
   - HTML cache reduced from 7 days to 60 seconds
   - Prevents React hydration errors from stale content
   - Automatic cache purge via GitHub Actions
   - Cache monitoring script implemented

4. ✅ **Homepage Enhancement** (Nov 20, 2025)
   - Full backend integration with real data
   - Alerts system with live data sources
   - Enhanced homepage with interactive design
   - Improved mobile responsiveness

5. ✅ **Observability Infrastructure** (Nov 20, 2025)
   - Structured logging with correlation IDs
   - Metrics recording with Cloudflare Analytics Engine
   - Distributed tracing support
   - Circuit breakers for external APIs
   - SLO definitions and monitoring

6. ✅ **MMI Integration** (2025)
   - Major Moments Index for baseball analytics
   - API endpoints for high-leverage situations
   - Win probability calculations
   - Play-by-play analysis

7. ✅ **MCP Server** (2025)
   - Model Context Protocol server for SportsData.io
   - 8 specialized tools for sports data
   - Priority on college baseball coverage
   - Cloudflare Workers deployment

**Season Updates:**
- ✅ All sports updated for 2025-2026 season
- ✅ MLB MMI with adaptive cache control
- ✅ NFL season data current
- ✅ NBA season data via ESPN adapter

**Known Limitations:**
- MMI service returns 503 (expected - service in development)
- Some API endpoints require SPORTSDATAIO_API_KEY

### Next Steps (Planned)

**P2 Enhancements:**
- Tighten CSP by removing 'unsafe-inline' and 'unsafe-eval'
- Add Subresource Integrity (SRI) for external scripts
- Implement rate limiting on API endpoints
- Set up automated security scanning in CI/CD
- Add request logging with correlation IDs

**Feature Development:**
- Youth sports league management expansion
- Enhanced analytics dashboard
- Real-time notifications system
- Mobile app development

---

## Project-Specific Notes

### Mobile-First Design

All components must be mobile-first:

```typescript
// Mobile (default)
className="p-4 text-sm"

// Tablet
className="p-4 text-sm md:p-6 md:text-base"

// Desktop
className="p-4 text-sm md:p-6 md:text-base lg:p-8 lg:text-lg"
```

### College Baseball Priority

College baseball gets **priority treatment** - it's the #1 gap in ESPN's coverage:

- Complete box scores with batting/pitching lines
- Play-by-play data
- Conference standings
- Real-time updates every 30 seconds

### No Placeholders

**Never use placeholder data.** All data must come from real APIs with proper error handling:

```typescript
// ❌ NEVER DO THIS
const games = [{ id: '1', homeTeam: 'Team A', /* ... */ }];

// ✅ ALWAYS DO THIS
const games = await adapter.getGames({ date });
if (!games.length) {
  return <EmptyState message="No games scheduled" />;
}
```

---

## AI Assistant Guidelines

### Working with this Codebase

**Key Principles:**
1. **Always use real data** - Never create placeholder or mock data
2. **Mobile-first approach** - Start with mobile design, scale up to desktop
3. **College baseball priority** - This is the #1 feature (fills ESPN gaps)
4. **Cache awareness** - Understand cache implications of changes
5. **Security first** - Never expose API keys or sensitive data
6. **Comprehensive error handling** - All external API calls must handle failures
7. **Timezone consistency** - Always use America/Chicago timezone

**Before Making Changes:**
1. Read relevant documentation in `docs/` and `observability/`
2. Check recent deployment logs in `DEPLOYMENT_LOG.md`
3. Verify production status with `/api/health` endpoint
4. Review SLOs in `observability/slos/`
5. Test locally before suggesting deployment

**When Adding New Features:**
1. Create adapter in `packages/api/src/adapters/`
2. Export from `packages/api/src/index.ts`
3. Build API package: `pnpm --filter @bsi/api build`
4. Create API route in `packages/web/app/api/sports/[sport]/`
5. Add frontend page in `packages/web/app/sports/[sport]/`
6. Update this CLAUDE.md with new endpoints and features
7. Add tests and verify functionality
8. Check monitoring and observability impact

**When Fixing Production Issues:**
1. Check `observability/DEBUGGABILITY_CARD.md` for common issues
2. Review logs in Cloudflare Dashboard
3. Check health endpoint: `curl https://www.blazesportsintel.com/api/health`
4. Verify external API connectivity
5. Check cache staleness with monitoring script
6. Document fix in `DEPLOYMENT_LOG.md`

**API Development Patterns:**
- Always transform external API responses to shared types (`@bsi/shared`)
- Include `meta` object with `dataSource`, `lastUpdated`, `timezone`
- Implement proper error handling with descriptive messages
- Use appropriate cache headers (see Caching Strategy section)
- Add observability metadata (requestId, traceId)

**Security Considerations:**
- Never commit `.env` files
- Never log API keys or sensitive data
- Always validate environment variables
- Use security headers (already configured in `next.config.js`)
- Follow OWASP top 10 guidelines

**Performance Guidelines:**
- Keep API response times under 200ms (P99)
- HTML pages cached for 60 seconds max (CDN)
- Static assets cached for 1 year (immutable)
- Monitor external API latency with circuit breakers
- Use Cloudflare Analytics Engine for metrics

**Testing Requirements:**
- Playwright tests for E2E functionality
- Integration tests for API endpoints
- Mobile regression tests for UI changes
- Performance tests before production deployment
- Health check verification after deployment

---

## Claude Code Web Support

This repository is configured for **Claude Code on the web** with automatic setup hooks and network access requirements.

### Automatic Setup

When you start a Claude Code web session, the `.claude/scripts/setup.sh` script runs automatically to:

1. ✅ Verify Node.js and pnpm installation
2. ✅ Install all dependencies with `pnpm install`
3. ✅ Build all packages in dependency order (@bsi/shared → @bsi/api → @bsi/web)
4. ✅ Check for `.env` file and environment variables
5. ✅ Display available commands and next steps

**Configuration:** `.claude/settings.json` contains SessionStart hooks that trigger setup automatically.

### Network Requirements

This project requires network access to the following domains:

**Required (Core Functionality):**
- `statsapi.mlb.com` - MLB Stats API (free, official)
- `site.api.espn.com` - ESPN APIs for NCAA/College sports (free, official)

**Required with API Keys:**
- `api.sportsdata.io` - SportsDataIO for NFL/NBA data (requires `SPORTSDATAIO_API_KEY`)
- `sportsdata.io` - SportsDataIO authentication

**Optional (Authentication):**
- `*.auth0.com` - Auth0 authentication (if configured)

**Network Access Level:** Requires **Full Internet Access** or domain allowlist with the above domains.

### Verifying Network Access

Run the network check script to validate API connectivity:

```bash
.claude/scripts/network-check.sh
```

This script tests all required sports data APIs and reports which ones are accessible. If required APIs fail, you may need to adjust network access settings in your Claude Code web environment.

### Environment Variables

**Required for full functionality:**

```bash
# SportsDataIO API (for NFL/NBA)
SPORTSDATAIO_API_KEY=your_api_key_here

# Auth0 (for authentication)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
JWT_SECRET=your_jwt_secret

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Setup:**
1. Copy `.env.example` to `.env`
2. Add your API keys
3. Never commit `.env` to version control

### Claude Code Web Limitations

**What works:**
- ✅ Automatic dependency installation via SessionStart hooks
- ✅ Full monorepo build process
- ✅ Development server (`pnpm dev`)
- ✅ API integration with external sports data sources
- ✅ Playwright E2E tests (after browser installation)

**Potential issues:**
- ⚠️ Network access may be restricted - use `.claude/scripts/network-check.sh` to verify
- ⚠️ Some APIs require environment variables - ensure `.env` is configured
- ⚠️ Playwright browser installation may timeout - run `npx playwright install` manually if needed

### Development Workflow in Claude Code Web

1. **Session starts** → Setup script runs automatically
2. **Verify environment:** Check that setup completed successfully
3. **Test network access:** Run `.claude/scripts/network-check.sh`
4. **Configure environment:** Ensure `.env` file has required API keys
5. **Start development:** Run `pnpm dev` to start Next.js server
6. **Make changes:** Edit code, Claude Code will help implement features
7. **Test changes:** Use Playwright tests or manual testing
8. **Commit & push:** Claude Code will help create commits and push to your branch

### Troubleshooting in Claude Code Web

**Setup fails with permission errors:**
```bash
# Manually run setup with verbose output
bash -x .claude/scripts/setup.sh
```

**Network access blocked:**
```bash
# Check which APIs are accessible
.claude/scripts/network-check.sh

# If required APIs are blocked, request Full Internet Access or domain allowlist
```

**Build fails during setup:**
```bash
# Clean and rebuild manually
pnpm clean
pnpm install
pnpm build
```

**Environment variables not working:**
```bash
# Verify .env file exists and has required keys
cat .env

# If missing, copy from template
cp .env.example .env
# Then edit .env with your API keys
```

### Additional Resources

- **Claude Code Documentation:** https://docs.anthropic.com/claude/docs/claude-code
- **SessionStart Hooks:** `.claude/settings.json` configuration
- **Setup Script:** `.claude/scripts/setup.sh` implementation
- **Network Check:** `.claude/scripts/network-check.sh` for API validation
- **Claude Code Configuration:** `.claude/README.md` for detailed setup notes

---

## Documentation Files

### Root Documentation

**Getting Started:**
- `README.md` - Project overview and quick start
- `QUICK_START.md` - Detailed setup instructions
- `CLAUDE.md` - **This file** - AI assistant guide and codebase overview

**Deployment & Operations:**
- `DEPLOYMENT.md` - General deployment procedures
- `DEPLOYMENT-READY-STATUS.md` - Pre-deployment status check
- `DEPLOYMENT_LOG.md` - Recent deployment history (P0/P1 fixes)
- `MONITORING.md` - Production monitoring setup guide
- `CACHE-FIX-IMPLEMENTATION.md` - Cache control implementation details
- `DEPLOYMENT-SUCCESS.md` - Deployment success confirmation
- `DEPLOYMENT-READY-STATUS.md` - Pre-deployment checklist

### Integration & Implementation

**API Integrations:**
- `SPORTSDATAIO_INTEGRATION.md` - SportsDataIO API integration guide
- `SPORTSDATAIO-INTEGRATION-COMPLETE.md` - Integration completion status

**Analytics & Features:**
- `MMI_INTEGRATION_COMPLETE.md` - Major Moments Index integration
- `MMI_DEPLOYMENT_SUMMARY.md` - MMI deployment status
- `BLAZE-TRENDS-IMPLEMENTATION.md` - Blaze Trends worker implementation
- `COLLEGE-BASEBALL-IMPLEMENTATION.md` - College baseball feature implementation
- `NCAA-FUSION-DASHBOARD.md` - NCAA multi-sport dashboard
- `NCAA_FUSION_COMPLETE.md` - NCAA fusion completion status
- `NCAA_FUSION_DEPLOYMENT_COMPLETE.md` - NCAA deployment status

**Analytics & 3D Features:**
- `ANALYTICS-DEPLOYMENT-GUIDE.md` - Analytics implementation guide
- `ANALYTICS-MIGRATION-COMPLETE-2025-11-20.md` - Analytics migration status
- `BLAZE-3D-IMPLEMENTATION-SUMMARY.md` - 3D visualization summary
- `BLAZE-3D-QUICK-START.md` - 3D visualization quick start
- `BLAZE-3D-VISUALIZATION-ARCHITECTURE.md` - 3D architecture details

### Infrastructure Documentation (`docs/`)

**Architecture & Setup:**
- `docs/INFRASTRUCTURE.md` - Complete architecture mapping (72 workers, 18 D1 DBs, 20+ KV stores)
- `docs/IMPLEMENTATION_SUMMARY.md` - Infrastructure implementation roadmap
- `docs/PRODUCTION_SETUP.md` - Production configuration
- `docs/DOMAIN_SETUP_GUIDE.md` - Domain configuration

**Storage & Performance:**
- `docs/R2_STORAGE_SETUP.md` - R2 media storage implementation (HIGH PRIORITY)
- `docs/HYPERDRIVE_SETUP.md` - Database connection pooling (MEDIUM PRIORITY)
- `docs/DATABASE_MONITORING.md` - Database monitoring setup (MEDIUM PRIORITY)

**Operations & Monitoring:**
- `docs/OPERATIONAL_RUNBOOKS.md` - Operations procedures (HIGH PRIORITY)
- `docs/DATABASE_MONITORING.md` - Database monitoring setup
- `docs/PERFORMANCE_TESTING.md` - Performance testing procedures
- `docs/SENTRY-SETUP-GUIDE.md` - Error tracking setup

**API & Data Management:**
- `docs/API_INVENTORY.md` - Complete API endpoint inventory
- `docs/LEAGUE_WIDE_DATA_MANAGEMENT.md` - League-wide data management
- `docs/LEAGUE_WIDE_IMPLEMENTATION_SUMMARY.md` - League-wide implementation
- `docs/UNIFIED_API_QUICKSTART.md` - Unified API quick start guide

**Phase Documentation:**
- `docs/PHASE_13_IMPLEMENTATION.md` - Phase 13 implementation details
- `docs/PHASE_14_IMPLEMENTATION.md` - Phase 14 implementation details
- `docs/PHASE_15_IMPLEMENTATION.md` - Phase 15 implementation details
- `docs/PHASE_16_IMPLEMENTATION.md` - Phase 16 implementation details

### Observability Documentation (`observability/`)

**Start Here:**
- `observability/README.md` - Observability overview (**START HERE**)
- `observability/QUICK_START.md` - 5-minute quick start guide

**Operational Guides:**
- `observability/DEBUGGABILITY_CARD.md` - Incident response guide
- `observability/RUNBOOK.md` - Operational procedures
- `observability/PRODUCTION_DEPLOYMENT_GUIDE.md` - Deployment steps
- `observability/IMPLEMENTATION_SUMMARY.md` - Technical implementation overview

**SLO Definitions:**
- `observability/slos/page-load-performance.yaml` - Page load SLO
- `observability/slos/api-response-time.yaml` - API response time SLO
- `observability/slos/data-freshness.yaml` - Data freshness SLO
- `observability/slos/external-api-reliability.yaml` - External API reliability SLO

**Helpers (TypeScript):**
- `observability/helpers/telemetry.ts` - Logging, metrics, tracing
- `observability/helpers/middleware.ts` - Request instrumentation
- `observability/helpers/circuit-breaker.ts` - Failure protection

### Cloudflare Workers Documentation

**Blaze Trends:**
- `cloudflare-workers/blaze-trends/README.md` - Blaze Trends worker technical overview
- `cloudflare-workers/blaze-trends/DEPLOYMENT.md` - Trends deployment guide
- `cloudflare-workers/blaze-trends/scripts/README.md` - Script documentation

**Other Workers:**
- `cloudflare-workers/blaze-content/` - Content management worker
- `cloudflare-workers/blaze-ingestion/` - Data ingestion pipeline
- `cloudflare-workers/longhorns-baseball/` - Texas Longhorns baseball worker

### Package-Specific Documentation

**MCP Server:**
- `packages/mcp-sportsdata-io/README.md` - MCP server complete documentation
  - 8 specialized tools
  - Installation and setup
  - MCP client configuration
  - API rate limits and usage

**MMI Analytics:**
- `packages/mmi-baseball/README.md` - MMI analytics package complete documentation
  - MMI formula and components
  - Installation and dependencies
  - CLI usage and REST API
  - Use cases and examples

### Claude Code Configuration (`.claude/`)

- `.claude/README.md` - Claude Code web setup documentation
- `.claude/scripts/setup.sh` - Automatic session setup script
- `.claude/scripts/network-check.sh` - API connectivity verification
- `.claude/settings.json` - SessionStart hooks configuration

### Legal & Compliance (`legal/`)

- `legal/README.md` - Legal documentation overview
- `legal/QUICK-START.md` - Legal compliance quick start
- `legal/LEGAL-COMPLIANCE-SUMMARY.md` - Compliance summary
- `legal/compliance/` - Compliance documentation
- `legal/policies/` - Policy documents
- `legal/templates/` - Legal templates
