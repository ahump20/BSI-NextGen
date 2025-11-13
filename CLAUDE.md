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
├── shared/           # @bsi/shared - Common types and utilities
├── api/              # @bsi/api - Sports data adapters
├── web/              # @bsi/web - Next.js web application
└── sports-dashboard/ # Sports dashboard components
```

### Package Dependencies

```
@bsi/web → @bsi/api → @bsi/shared
                 ↘
          sports-dashboard
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
- `CollegeBaseballAdapter` - ESPN API + enhanced box scores

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
│   │       └── college-baseball/
│   └── sports/
│       ├── mlb/              # MLB pages
│       ├── nfl/              # NFL pages
│       └── college-baseball/ # College baseball pages
├── components/               # React components
├── lib/                      # Utilities
└── public/                   # Static assets
```

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
GET /api/sports/mlb/games?date=2025-01-11
GET /api/sports/mlb/standings?divisionId=200
GET /api/sports/mlb/teams

GET /api/sports/nfl/games?week=1&season=2025
GET /api/sports/nfl/standings?season=2025
GET /api/sports/nfl/teams

GET /api/sports/nba/games?date=2025-01-11
GET /api/sports/nba/standings
GET /api/sports/nba/teams

GET /api/sports/ncaa_football/games?week=1
GET /api/sports/ncaa_football/standings?conference=12

GET /api/sports/college_baseball/games?date=2025-01-11
GET /api/sports/college_baseball/standings?conference=ACC
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

### Netlify

**Build Command:** `pnpm build`
**Publish Directory:** `packages/web/.next`

**Environment Variables:**
- Set in Netlify Dashboard → Site Settings → Environment Variables
- Add `SPORTSDATAIO_API_KEY`

**Auto-deploy:**
- Pushes to `main` branch deploy automatically
- PR previews enabled

### Vercel

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

### Documentation Files

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

```typescript
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

- `README.md` - Project overview and quick start
- `QUICK_START.md` - Detailed setup instructions
- `DEPLOYMENT.md` - Deployment procedures
- `docs/IMPLEMENTATION_SUMMARY.md` - Infrastructure implementation roadmap
- `docs/INFRASTRUCTURE.md` - Complete architecture mapping
- `docs/OPERATIONAL_RUNBOOKS.md` - Operations procedures
- `.claude/README.md` - Claude Code web setup documentation
