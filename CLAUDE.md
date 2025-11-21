# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

This is a **dual-application monorepo** combining:

1. **Sandlot Sluggers** - A mobile-first baseball game built with Babylon.js, WebGPU, and Havok Physics
2. **Blaze Sports Intel Dashboard** - A React-based sports analytics platform with real-time college baseball coverage

Both applications share Cloudflare infrastructure (D1, KV, Pages Functions) and are deployed together.

---

## Common Commands

### Development

```bash
# Start game dev server (Vite)
npm run dev                          # http://localhost:5173

# Start API dev server (Wrangler)
npm run dev:functions                # http://localhost:8788

# Run both concurrently
npm run dev:full

# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing

```bash
# Run unit tests
npm run test                         # Watch mode
npm run test:unit                    # Single run

# Run E2E tests
npm run test:e2e                     # Playwright headless
npm run test:e2e:ui                  # Playwright UI mode

# Test coverage
npm run test:coverage
```

### Database

```bash
# Apply migrations locally
npm run db:migrate

# Apply migrations to production
npm run db:migrate:production

# Execute SQL on D1 database
wrangler d1 execute blaze-db --file=migrations/your_migration.sql

# Interactive query (local)
wrangler d1 execute blaze-db --local --command="SELECT * FROM player_progress LIMIT 10"

# Interactive query (production)
wrangler d1 execute blaze-db --command="SELECT * FROM player_progress LIMIT 10"
```

### Code Quality

```bash
# Lint code
npm run lint
npm run lint:fix                     # Auto-fix issues

# Format code
npm run format
npm run format:check

# Type check
npm run typecheck
```

### Deployment

```bash
# Deploy to Cloudflare Pages
npm run deploy

# Deploy to staging
npm run deploy:staging

# Direct wrangler deployment
wrangler pages deploy dist --project-name sandlot-sluggers --branch main
```

---

## Architecture

### Two Entry Points

The project has **two separate HTML entry points** that initialize different applications:

#### 1. Game Application (`index.html` → `src/main.ts`)
- **Purpose:** Babylon.js 3D baseball game
- **Framework:** Vanilla TypeScript + Babylon.js
- **Entry:** Browser loads `index.html` → boots `src/main.ts`
- **Key Features:**
  - Character selection (10 original characters + unlockables)
  - Stadium selection (5 unique stadiums)
  - Gameplay with Havok Physics
  - Progression tracking (levels, XP, unlocks)
  - Leaderboards and championships

#### 2. Dashboard Application (`dashboard.html` → `src/dashboard.tsx`)
- **Purpose:** Sports analytics dashboard
- **Framework:** React + React Router
- **Entry:** Browser loads `dashboard.html` → boots `src/dashboard.tsx`
- **Key Features:**
  - College baseball box scores with play-by-play
  - D1Baseball Top 25 rankings
  - Conference standings
  - User authentication (Auth0 OAuth)
  - Protected routes for premium features

### Shared Backend (Cloudflare Pages Functions)

Both applications share the same API layer at `functions/api/`:

```
functions/api/
├── progress/[playerId].ts           # Game progression tracking
├── stats/                           # Game statistics
├── college-baseball/                # NCAA box scores, rankings, standings
├── auth/                            # OAuth login/logout/callback
└── mlb/                             # MLB analytics (future)
```

**Routing Pattern:**
- Pages Functions use file-based routing
- `[param]` = dynamic route segment
- `[[param]]` = optional catch-all route

**Example:**
- `functions/api/college-baseball/games/[gameId].ts` → `GET /api/college-baseball/games/123`
- `functions/api/stats/leaderboard/[[stat]].ts` → `GET /api/stats/leaderboard/home_runs`

### Path Aliases

TypeScript paths are configured to avoid `../../../` hell:

```typescript
import { NCAAAdapter } from '@adapters/ncaa-adapter';      // lib/adapters/
import { verifyToken } from '@auth/middleware';            // lib/auth/
import { BoxScore } from '@/components/sports/BoxScore';   // src/
import { fetchWithTimeout } from '@utils/http';            // lib/utils/
```

**Available Aliases:**
- `@/*` → `src/*`
- `@lib/*` → `lib/*`
- `@adapters/*` → `lib/adapters/*`
- `@auth/*` → `lib/auth/*`
- `@api/*` → `lib/api/*`
- `@utils/*` → `lib/utils/*`
- `@db/*` → `lib/db/*`
- `@functions/*` → `functions/*`
- `@types/*` → `types/*`

### Cloudflare Bindings

Environment bindings are configured in `wrangler.toml`:

- **D1 Database** (`DB`) - SQLite database for player progression, game history, user sessions
- **KV Namespace** (`KV`) - Low-latency cache for leaderboards, API responses
- **R2 Bucket** (`GAME_ASSETS`) - Object storage for 3D models (currently disabled, using dist/assets/)

**Accessing in Functions:**
```typescript
export async function onRequest(context: any) {
  const { env } = context;

  // Query D1
  const result = await env.DB.prepare('SELECT * FROM player_progress WHERE player_id = ?')
    .bind(playerId)
    .first();

  // Cache in KV
  await env.KV.put(`player:${playerId}`, JSON.stringify(result), { expirationTtl: 300 });

  // Read from KV
  const cached = await env.KV.get(`player:${playerId}`, 'json');
}
```

---

## Database Schema

The D1 database uses **SQLite** with migrations in `migrations/`.

### Core Tables

**Game Application:**
- `player_progress` - Player stats, level, XP, unlocked content
- `game_history` - Individual game results with detailed stats
- `character_unlocks` - Track when characters are unlocked
- `stadium_unlocks` - Track when stadiums are unlocked

**Dashboard Application:**
- `users` - Auth0 user accounts (id, email, display_name, role)
- `sessions` - Session tokens for authentication (7-day expiry)

### Migration Workflow

1. Create migration file: `migrations/000X_description.sql`
2. Apply locally: `npm run db:migrate`
3. Test changes
4. Apply to production: `npm run db:migrate:production`

**Migration Example:**
```sql
-- migrations/0003_add_user_roles.sql
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';

CREATE INDEX idx_users_role ON users(role);
```

---

## Authentication System

The dashboard uses **Auth0 OAuth 2.0** with JWT tokens and session cookies.

### Flow

1. **Login:** `GET /api/auth/login?returnTo=/profile`
   - Generates CSRF state token
   - Stores in KV (10 min TTL)
   - Redirects to Auth0

2. **Callback:** `GET /api/auth/callback?code=xxx&state=yyy`
   - Validates state token
   - Exchanges code for access token
   - Fetches user info from Auth0
   - Upserts user in D1
   - Creates session (7 day expiry)
   - Sets HttpOnly cookie: `blaze_session=<token>`

3. **Logout:** `POST /api/auth/logout`
   - Deletes session from D1
   - Clears cookie
   - Redirects to Auth0 logout

4. **Protected Routes:**
   ```typescript
   import ProtectedRoute from '@/components/auth/ProtectedRoute';

   <ProtectedRoute requiredRole="premium">
     <PremiumFeature />
   </ProtectedRoute>
   ```

### Role Hierarchy

- `user` (default) - Free tier access
- `premium` - Paid tier features
- `admin` - Full platform access

**Middleware Example:**
```typescript
import { requireAuth, requireRole } from '@auth/middleware';

export async function onRequest(context: any) {
  const authResult = await requireRole(context.request, context.env, 'premium');
  if (authResult instanceof Response) return authResult; // 401/403

  const { user } = authResult;
  // ... proceed with authenticated user
}
```

---

## Sports Data Integration

### NCAA Adapter (`lib/adapters/ncaa-adapter.ts`)

Fetches college baseball data from NCAA Stats API.

**Key Methods:**
```typescript
class NCAAAdapter {
  async getGame(gameId: string): Promise<NCAABoxScore>
  async getGames(date: string): Promise<NCAAGame[]>
  async getTeamSchedule(teamId: string, season: number): Promise<NCAAGame[]>
}
```

**Cache Strategy:**
- Live games: 30 seconds TTL
- Final games: 5 minutes TTL
- Store in D1 for historical analysis

### D1Baseball Adapter (`lib/adapters/d1baseball-adapter.ts`)

Fetches Top 25 rankings and conference standings.

**Key Methods:**
```typescript
class D1BaseballAdapter {
  async getRankings(week?: string): Promise<D1BaseballRanking[]>
  async getConferenceStandings(conference: string): Promise<ConferenceStandings>
}
```

**Cache Strategy:**
- Rankings: 1 hour TTL (weekly updates)
- Standings: 1 hour TTL

### Adding New Sport Adapters

1. Create adapter: `lib/adapters/mlb-adapter.ts`
2. Implement data transformation
3. Create API endpoint: `functions/api/mlb/standings.ts`
4. Add React page: `src/pages/MLBStandings.tsx`
5. Add route in `src/dashboard.tsx`

---

## React Component Library

Reusable components live in `src/components/`:

### Primitives (`src/components/primitives/`)
- `Button.tsx` - Accessible button with variants (primary, secondary, outline)
- `Card.tsx` - Container with CardHeader, CardContent, CardFooter
- `Table.tsx` - Sortable data table with mobile responsiveness
- `Modal.tsx` - Accessible modal dialog with focus trap

### Sports (`src/components/sports/`)
- `BoxScore.tsx` - Complete game box score (batting/pitching stats)
- `Standings.tsx` - League/conference standings table
- `LiveScoreCard.tsx` - Real-time game score card with auto-refresh

### Common (`src/components/common/`)
- `LoadingState.tsx` - Loading spinner with optional message
- `ErrorBoundary.tsx` - React error boundary for graceful failures

### Layout (`src/components/layout/`)
- `MobileNav.tsx` - Mobile-responsive navigation drawer

**Usage Example:**
```typescript
import Card, { CardHeader, CardContent } from '@/components/primitives/Card';
import { BoxScore } from '@/components/sports/BoxScore';

<Card>
  <CardHeader>
    <h2>Cardinals vs Cubs</h2>
  </CardHeader>
  <CardContent>
    <BoxScore
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      homeBatting={homeBatting}
      awayBatting={awayBatting}
      homePitching={homePitching}
      awayPitching={awayPitching}
    />
  </CardContent>
</Card>
```

---

## Testing Strategy

### Unit Tests (Vitest)

Located in `tests/unit/`:

```bash
# Run specific test file
npm run test -- lib/adapters/ncaa-adapter.test.ts

# Run tests matching pattern
npm run test -- --grep "NCAA Adapter"

# Watch mode
npm run test
```

**Example Test:**
```typescript
import { describe, it, expect } from 'vitest';
import { NCAAAdapter } from '@adapters/ncaa-adapter';

describe('NCAAAdapter', () => {
  it('should fetch game data', async () => {
    const adapter = new NCAAAdapter({ apiKey: 'test' });
    const game = await adapter.getGame('12345');
    expect(game.game.id).toBe('12345');
  });
});
```

### E2E Tests (Playwright)

Located in `tests/e2e/`:

```bash
# Run E2E tests
npm run test:e2e

# Run specific test
npx playwright test tests/e2e/college-baseball.spec.ts

# Debug mode
npx playwright test --debug

# UI mode
npm run test:e2e:ui
```

**Example Test:**
```typescript
import { test, expect } from '@playwright/test';

test('college baseball schedule loads', async ({ page }) => {
  await page.goto('http://localhost:5173/dashboard.html');
  await page.click('text=College Baseball');
  await expect(page.locator('h1')).toContainText('Schedule');
});
```

---

## Deployment

### Cloudflare Pages Configuration

**Production URL:** `https://sandlot-sluggers.pages.dev`

**Branch Deployments:**
- `main` → Production
- `staging` → `https://staging.sandlot-sluggers.pages.dev`

**Build Settings:**
- Build command: `npm run build`
- Build output directory: `dist`
- Node version: 18

### Environment Variables (Production)

Set in Cloudflare Dashboard → Pages → Settings → Environment Variables:

**Required:**
```
AUTH0_DOMAIN=your-domain.us.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_CALLBACK_URL=https://sandlot-sluggers.pages.dev/api/auth/callback
AUTH0_AUDIENCE=blazesportsintel-api
JWT_SECRET=your_rs256_public_key
NCAA_API_KEY=your_ncaa_api_key
D1BASEBALL_API_KEY=your_d1baseball_api_key
```

**Optional:**
```
SENTRY_DSN=your_sentry_dsn
```

### Deployment Checklist

1. **Local Testing:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Run Tests:**
   ```bash
   npm run test:unit
   npm run test:e2e
   npm run typecheck
   ```

3. **Database Migrations:**
   ```bash
   npm run db:migrate:production
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Verify Deployment:**
   - Game: `https://sandlot-sluggers.pages.dev/`
   - Dashboard: `https://sandlot-sluggers.pages.dev/dashboard.html`
   - API Health: `https://sandlot-sluggers.pages.dev/api/health`

---

## Common Patterns

### Resilient KV Caching

Use `getKVWithResilience` to avoid KV timeouts blocking requests:

```typescript
import { getKVWithResilience } from '@/api/_resilience';

const cached = await getKVWithResilience<MyType>(
  env.KV,
  'cache:key',
  { type: 'json', timeoutMs: 3000 }
);

if (cached) {
  return jsonResponse({ data: cached, meta: { cached: true } });
}

// Fetch fresh data if cache miss
const fresh = await fetchData();
await env.KV.put('cache:key', JSON.stringify(fresh), { expirationTtl: 300 });
```

### API Response Helpers

Located in `functions/api/stats/_utils.ts`:

```typescript
import { jsonResponse, errorResponse, handleOptions } from '@/api/stats/_utils';

// CORS preflight
export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

// Success response
export async function onRequestGet(context: any) {
  const data = { stats: [/* ... */] };
  return jsonResponse(data, {
    origin: context.request.headers.get('Origin'),
    cacheControl: 'public, max-age=300'
  });
}

// Error response
export async function onRequestGet(context: any) {
  try {
    // ...
  } catch (error: any) {
    return errorResponse(error.message, 500, origin);
  }
}
```

### Data Transformation Pattern

Always transform external API data to internal format:

```typescript
class ExternalAdapter {
  private transformData(external: ExternalFormat): InternalFormat {
    return {
      id: external.externalId,
      name: external.fullName,
      stats: {
        batting: this.transformBatting(external.battingStats),
        pitching: this.transformPitching(external.pitchingStats),
      },
      meta: {
        dataSource: 'External API Name',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };
  }
}
```

---

## Known Limitations

### Game Application
- Fielding mechanics not implemented (swipes logged but no action)
- 3D models are placeholder capsules/spheres
- Camera doesn't follow ball during flight
- No AI opponents
- Leaderboard API not implemented
- No sound effects or music

### Dashboard Application
- Only college baseball coverage implemented
- MLB, NFL, NBA endpoints are placeholders
- No real-time WebSocket updates (polling only)
- Premium features not fully implemented

### Infrastructure
- R2 bucket disabled (using local dist/assets/ instead)
- Durable Objects commented out (no multiplayer)
- No CDN purge automation

---

## Project-Specific Notes

### Timezone

All timestamps use **America/Chicago** timezone. Always include in API responses:

```typescript
{
  data: { /* ... */ },
  meta: {
    lastUpdated: new Date().toISOString(),
    timezone: 'America/Chicago'
  }
}
```

### Mobile-First Design

All components are mobile-first responsive:

```css
/* Mobile (default) */
.container { padding: 1rem; }

/* Tablet */
@media (min-width: 768px) {
  .container { padding: 2rem; }
}

/* Desktop */
@media (min-width: 1024px) {
  .container { padding: 3rem; }
}
```

### Original IP Requirement

This project uses **100% original intellectual property**:
- No Humongous Entertainment assets
- No Backyard Baseball characters (Pablo Sanchez, Pete Wheeler, etc.)
- Original character names, designs, stadiums
- Inspired by the genre, not copying implementations

When adding content, ensure it's completely original.

---

## Resources

- **Babylon.js Docs:** https://doc.babylonjs.com/
- **Cloudflare Pages:** https://developers.cloudflare.com/pages/
- **D1 Database:** https://developers.cloudflare.com/d1/
- **KV Storage:** https://developers.cloudflare.com/kv/
- **React Router:** https://reactrouter.com/
- **Vitest:** https://vitest.dev/
- **Playwright:** https://playwright.dev/

---

## Documentation Files

- `README.md` - Game application setup and features
- `TASKS-1-5-COMPLETE.md` - Dashboard implementation details
- `LIVE-DEPLOYMENT-SUCCESS.md` - Previous deployment notes
- `package.json` - Available npm scripts
- `wrangler.toml` - Cloudflare bindings configuration
