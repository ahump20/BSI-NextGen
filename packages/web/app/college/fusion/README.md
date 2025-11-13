# NCAA Fusion Dashboard

A production-ready, edge-cached intelligence board that fuses ESPN NCAA analytics with ncaa.com scoreboard data into a single pane of glass.

## Overview

The NCAA Fusion Dashboard combines three data sources:

1. **BSI Real API Server** (`REAL_API_BASE_URL`) - Provides ESPN-derived NCAA analytics:
   - Pythagorean expectation (expected wins vs actual wins)
   - Efficiency differential (points for/against)
   - Momentum tracking (win/loss streaks)

2. **NCAA API** (`NCAA_API_BASE_URL`) - Provides raw ncaa.com data:
   - Live scoreboard feeds
   - Game schedules and results
   - Team rankings and records

3. **Edge Fusion Layer** - Combines both sources at the edge with intelligent caching

## Features

- **Team Intelligence Card** - Logo, record, location, momentum indicator
- **Pythagorean Reality Check** - Compare actual wins vs statistical expectation
- **Efficiency Metrics** - Offensive/defensive efficiency with differential
- **Live Game Detection** - Automatically finds today's/next game from scoreboard
- **Standings Snapshot** - Multiple scope views (overall, conference, home/away)
- **Edge Runtime** - Fast response with 30-second cache
- **Mobile-First Design** - Responsive grid layout with Diamond Insights styling

## Usage

### Basic URL Pattern

```
/college/fusion?sport={sport}&teamId={teamId}&year={year}&week={week}
```

### Query Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `sport` | No | `basketball` | One of: `basketball`, `football`, `baseball` |
| `teamId` | No | _(varies)_ | ESPN team ID for analytics data |
| `year` | No | `2024` | Season year for scoreboard data |
| `week` | No | `1` | Week/day number for scoreboard window |

### Examples

**Basketball - Duke Blue Devils (Team ID: 150)**
```
/college/fusion?sport=basketball&teamId=150&year=2024&week=5
```

**Football - Alabama Crimson Tide (Team ID: 333)**
```
/college/fusion?sport=football&teamId=333&year=2024&week=13
```

**Baseball - Vanderbilt Commodores (Team ID: 238)**
```
/college/fusion?sport=baseball&teamId=238&year=2024&week=20
```

## Environment Setup

Add these environment variables to your `.env` file:

```bash
# BSI Real API Server - ESPN NCAA analytics
REAL_API_BASE_URL=http://localhost:4000

# NCAA API - ncaa.com scoreboard proxy
NCAA_API_BASE_URL=https://ncaa-api.henrygd.me
```

### Local Development

If running both APIs locally:

```bash
# Terminal 1 - BSI Real API Server
cd /path/to/bsi-api
npm run dev  # Runs on port 4000

# Terminal 2 - NCAA API
cd /path/to/ncaa-api
bun run dev  # Runs on port 3000

# Terminal 3 - Next.js Web App
cd BSI-NextGen/packages/web
pnpm dev     # Runs on port 3000 (or 3001 if ncaa-api uses 3000)
```

Update `.env` for local setup:
```bash
REAL_API_BASE_URL=http://localhost:4000
NCAA_API_BASE_URL=http://localhost:3000  # Adjust port if needed
```

## Architecture

### API Route: `/api/edge/ncaa/fusion/route.ts`

- **Runtime:** Edge
- **Caching:** 30s public cache + 30s stale-while-revalidate
- **Responsibilities:**
  1. Fetch analytics from `REAL_API_BASE_URL/api/ncaa/{sport}/{teamId}`
  2. Fetch scoreboard from `NCAA_API_BASE_URL/scoreboard/{sport}/{division}/{year}/{week}/all-conf`
  3. Intelligently match team from analytics to game in scoreboard
  4. Return unified payload with both datasets

### Frontend: `/college/fusion/page.tsx`

- **Type:** Server Component (SSR with 25s revalidation)
- **Styling:** Diamond Insights design system + Tailwind CSS
- **Layout:** Responsive grid with 4 main cards:
  1. Team card (logo, record, momentum)
  2. Analytics card (Pythagorean + efficiency)
  3. Upcoming game card (scoreboard match)
  4. Standings table (multiple scopes)

### Styles: `/college/fusion/styles.css`

- **Design System:** Diamond Insights (di-*)
- **Color Palette:** Dark gradients with amber accents
- **Components:** Cards, metrics, chips, tables
- **Responsive:** Mobile-first with breakpoints at 768px+

## Design System

### CSS Variables (globals.css)

```css
--di-radius: 0.5rem;
--di-text-muted: rgb(148, 163, 184);
```

### Base Classes

- `.di-page` - Full-height page container with dark gradient
- `.di-section` - Max-width content section
- `.di-kicker` - Uppercase label (e.g., "NCAA Fusion · basketball")
- `.di-page-title` - Large gradient title
- `.di-page-subtitle` - Body text for page intro

### Component Classes

- `.fusion-card` - Glass-morphism card with gradient overlay
- `.fusion-metric` - Vertical metric display (label + value + sub)
- `.fusion-metric-chip` - Badge-style value with color states
  - `.is-positive` - Green border/background (good metrics)
  - `.is-negative` - Red border/background (bad metrics)
- `.fusion-table` - Responsive data table

## Finding Team IDs

Team IDs are ESPN's internal identifiers. To find them:

1. **Method 1: ESPN URL**
   - Go to team page on ESPN (e.g., espn.com/mens-college-basketball/team/_/id/150/duke-blue-devils)
   - The number after `/id/` is the team ID (150)

2. **Method 2: Real API Response**
   - Call `GET {REAL_API_BASE_URL}/api/ncaa/{sport}` without teamId
   - Response includes team ID in `team.id` field

3. **Method 3: Common Team IDs**
   - Duke: 150
   - North Carolina: 153
   - Alabama: 333
   - Clemson: 228
   - Vanderbilt: 238

## Error Handling

The dashboard gracefully handles:

- **Missing Environment Variables** - 500 error with clear message
- **Invalid Sport** - 400 error with list of allowed sports
- **Analytics API Failure** - 502 error with details
- **Scoreboard API Failure** - Still shows analytics data
- **Team Not Found in Scoreboard** - Shows "No live game detected"

## Performance

- **Edge Runtime** - Near-instant global response
- **Smart Caching**:
  - Browser: 30s
  - CDN: 30s
  - Stale-while-revalidate: 30s
- **Parallel Fetching** - Analytics + scoreboard in parallel
- **Static-First** - Server components with 25s revalidation

## Future Enhancements

Potential additions mentioned by the user:

1. **Alert Rules** - Webhook/notification when metrics hit thresholds
2. **Leverage Index** - Game importance scoring based on standings + momentum
3. **Historical Comparison** - Compare current metrics to past seasons
4. **Conference Dashboard** - Multi-team view for entire conference
5. **Cloudflare Workers** - Move fusion logic to standalone worker

## Troubleshooting

### "REAL_API_BASE_URL is not configured"

Add `REAL_API_BASE_URL=http://localhost:4000` to `.env` file.

### "No game for this team in the current scoreboard window"

- The scoreboard window (year/week) doesn't contain a game for this team
- Try different week numbers to find their schedule
- Football: weeks 1-15
- Basketball: days 1-180+
- Baseball: days 1-150+

### Team logo not showing

- Team data from Real API may not include logos
- Fallback: Fetch team data directly from ESPN API if logo is critical

### Scoreboard data is stale

- Default cache is 30s
- For faster updates, reduce `max-age` in route.ts
- Consider WebSocket updates for truly real-time data

## Related Files

- **API Route:** `packages/web/app/api/edge/ncaa/fusion/route.ts`
- **Page Component:** `packages/web/app/college/fusion/page.tsx`
- **Styles:** `packages/web/app/college/fusion/styles.css`
- **Global Styles:** `packages/web/app/globals.css` (di-* variables)
- **Environment:** `.env.example` (template for variables)

## Credits

Concept and implementation provided by user for BSI-NextGen platform.
Design system: "Diamond Insights" visual language.
Data sources: ESPN (via BSI Real API), NCAA.com (via ncaa-api).
