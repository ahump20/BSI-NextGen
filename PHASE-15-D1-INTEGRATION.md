# Phase 15: D1 Schema & Historical Data Integration

## Overview

Phase 15 introduces **Cloudflare D1 as the persistent historical data layer** for BlazeSportsIntel, enabling:
- Historical game tracking across all 7 sports
- Team information persistence
- Standings snapshots over time
- News article storage (Phase 16 ready)
- Analytics caching for performance

**Key Principle:** D1 is layered **UNDER** existing APIs, not replacing them. Live data still comes from existing endpoints; D1 provides historical context.

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Requests                         │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│          Next.js API Routes (Edge/Node)                 │
│                                                          │
│  Live Data Path:          Historical Data Path:         │
│  ┌──────────────┐         ┌──────────────────┐         │
│  │ /api/sports/ │         │ /api/sports/     │         │
│  │ live-scores  │         │ history/*        │         │
│  └──────┬───────┘         └────────┬─────────┘         │
│         │                          │                    │
└─────────┼──────────────────────────┼────────────────────┘
          │                          │
          │                          │ (D1 Client)
          ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│  External APIs       │    │  Cloudflare D1 Database      │
│  - ESPN              │    │                              │
│  - SportsDataIO      │◄───┤  Tables:                     │
│  - MLB Stats API     │    │  • games                     │
└──────────────────────┘    │  • teams                     │
          ▲                 │  • standings                 │
          │                 │  • news_articles             │
          │                 │  • analytics_cache           │
┌─────────┴─────────────────┴─────────────────────────────┐
│      Data Ingestion Worker (Cron: Every 15 min)        │
│                                                          │
│  Fetches live data → Stores in D1 for history          │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables

**1. `teams`** - Master team directory (all sports)
- Stores team info across MLB, NFL, NBA, NCAA sports
- Indexed by sport, conference, active status
- Supports logos, divisions, metadata

**2. `games`** - Unified games table (all sports)
- Single table for all sports (sport field discriminates)
- Indexed by: sport, date, status, teams
- Stores scores, status, venue, metadata
- Supports week/season for football

**3. `standings`** - Historical standings snapshots
- Point-in-time standings records
- Indexed by sport, season, snapshot date
- Allows tracking of rankings over time

**4. `news_articles`** - Sports news aggregation (Phase 16)
- RSS feed ingestion storage
- Deduplication via content_hash
- Indexed by sport, published date

**5. `analytics_cache`** - Pre-computed analytics
- Caches Pythagorean, efficiency, momentum
- TTL-based expiration
- Reduces API calls to upstream sources

**6. `ingestion_log`** - Monitoring and debugging
- Tracks all ingestion runs
- Records success/failure rates
- Helps identify API issues

### Views

**`v_recent_games`** - Games with team details (last N days)
**`v_live_games`** - Currently live games
**`v_latest_standings`** - Most recent standings snapshot

---

## 🔄 Data Ingestion Worker

### Purpose

Runs every 15 minutes to:
1. Fetch latest data from live APIs
2. Upsert (INSERT or UPDATE) game records
3. Update team information
4. Log ingestion metrics

### Location

`cloudflare-workers/data-ingestion/`

### Deployment

```bash
cd cloudflare-workers/data-ingestion

# Install dependencies
pnpm install

# Create D1 database
pnpm db:create

# Initialize schema
pnpm db:init

# Deploy worker
pnpm deploy
```

### Manual Triggering

```bash
# Trigger for specific sport
curl "https://WORKER_URL/ingest?sport=mlb"

# Trigger for all sports
curl "https://WORKER_URL/ingest?sport=all"
```

### Monitoring

```bash
# View logs
pnpm tail

# Check ingestion history
wrangler d1 execute bsi-sports-data --command \
  "SELECT * FROM ingestion_log ORDER BY started_at DESC LIMIT 10;"
```

---

## 🔌 Next.js D1 Integration

### D1 Client Library

Location: `packages/web/lib/d1/`

**Files:**
- `types.ts` - TypeScript types for D1 records
- `client.ts` - D1 query wrapper with HTTP API support

### Environment Variables

Add to `.env`:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_D1_DATABASE_ID=your_database_id
CLOUDFLARE_API_TOKEN=your_api_token
```

### Usage Example

```typescript
import { getD1Client } from '@/lib/d1/client';

export async function GET(request: NextRequest) {
  const d1 = getD1Client();

  if (!d1.isAvailable()) {
    // Fallback to live API
    return fetchFromLiveAPI();
  }

  // Query D1 for historical data
  const result = await d1.getRecentGames('MLB', 7);

  return NextResponse.json(result.data);
}
```

---

## 📡 New Historical API Endpoints

### 1. Team History

**GET** `/api/sports/history/team/[teamId]`

Get historical games for a specific team.

**Query Params:**
- `limit` - Number of games (default: 10)
- `season` - Filter by season year

**Example:**
```bash
curl "/api/sports/history/team/mlb-147?limit=20"
```

**Response:**
```json
{
  "success": true,
  "teamId": "mlb-147",
  "summary": {
    "gamesPlayed": 20,
    "wins": 12,
    "losses": 8,
    "winPercentage": "0.600"
  },
  "games": [ ... ],
  "source": {
    "provider": "Cloudflare D1",
    "timestamp": "2025-11-20T12:00:00Z"
  }
}
```

### 2. Historical Scoreboard

**GET** `/api/sports/history/scoreboard`

Get games from past dates.

**Query Params:**
- `sport` - Filter by sport
- `date` - Specific date (YYYY-MM-DD)
- `days` - Look back N days (default: 1)

**Example:**
```bash
curl "/api/sports/history/scoreboard?sport=MLB&days=7"
```

**Response:**
```json
{
  "success": true,
  "sport": "MLB",
  "dateRange": {
    "from": "2025-11-13",
    "to": "2025-11-20"
  },
  "totalGames": 42,
  "scoreboard": [
    {
      "date": "2025-11-20",
      "games": [ ... ],
      "gameCount": 7
    }
  ]
}
```

---

## 🎯 Integration Strategy

### Current State (Phase 15)

✅ **D1 schema created** (`schema/sports-data.sql`)
✅ **Ingestion worker built** (cron every 15 min)
✅ **D1 client library** for Next.js
✅ **Historical API endpoints** as examples
❌ **D1 not yet deployed** (requires Cloudflare setup)

### What Works Now (Without D1)

- **All existing APIs work unchanged**
- Live scores from `/api/sports/live-scores`
- NCAA analytics from `/api/ncaa/[sport]/[teamId]`
- Youth sports from `/api/sports/youth-sports/*`
- Command Center dashboard

### What Requires D1 Setup

- Historical team game queries
- Past date scoreboards
- Season summaries
- Standings history

---

## 🚀 Deployment Steps

### Step 1: Create D1 Database

```bash
cd cloudflare-workers/data-ingestion
pnpm install

# Create database
wrangler d1 create bsi-sports-data

# Copy database ID from output
```

### Step 2: Initialize Schema

```bash
# Run schema
wrangler d1 execute bsi-sports-data --file=../../schema/sports-data.sql

# Verify
wrangler d1 execute bsi-sports-data --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Step 3: Configure Worker

Update `wrangler.toml` with database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "bsi-sports-data"
database_id = "PASTE_DATABASE_ID_HERE"
```

### Step 4: Deploy Worker

```bash
pnpm deploy
```

### Step 5: Configure Next.js

Add to `.env`:

```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_D1_DATABASE_ID=database_id_from_step_1
CLOUDFLARE_API_TOKEN=your_api_token
```

Generate API token at: https://dash.cloudflare.com/profile/api-tokens
- Template: "Edit Cloudflare Workers"
- Permissions: D1 Read/Write

### Step 6: Test

```bash
# Trigger manual ingestion
curl "https://bsi-data-ingestion.WORKER_URL.workers.dev/ingest?sport=mlb"

# Check results
wrangler d1 execute bsi-sports-data --command "SELECT COUNT(*) FROM games;"

# Test Next.js endpoint
curl "http://localhost:3000/api/sports/history/scoreboard?sport=MLB&days=7"
```

---

## 📈 Data Flow

### Ingestion Flow (Every 15 minutes)

```
Cron Trigger
    ↓
Worker starts
    ↓
Parallel fetch:
- MLB games (via /api/sports/mlb/games)
- NFL games (via /api/sports/nfl/games)
- NBA games (via /api/sports/nba/games)
- NCAA Football (via ESPN)
- NCAA Basketball (via ESPN)
- College Baseball (via ESPN)
    ↓
For each game:
  - Upsert game record (INSERT or UPDATE)
  - Upsert team records
    ↓
Log results to ingestion_log
    ↓
Worker completes
```

### Historical Query Flow

```
User Request
    ↓
Next.js API route
    ↓
Check D1 available?
    ├─ Yes → Query D1 (via HTTP API)
    │         ↓
    │      Return historical data (10min cache)
    │
    └─ No → Return error or fallback to live API
```

---

## 💰 Cost Analysis

### D1 (Free Tier)
- **Storage:** 5 GB (well within limits)
- **Reads:** 5M rows/day (minimal - mostly writes)
- **Writes:** 100K rows/day (est. 10K/day actual)

**Verdict:** FREE ✅

### Worker (Free Tier)
- **Invocations:** 100K/day (using ~100/day)
- **Duration:** Lightweight queries

**Verdict:** FREE ✅

**Total Cost:** $0/month on free tier

---

## 🔍 Sample Queries

### Get live games across all sports

```sql
SELECT * FROM v_live_games;
```

### Get MLB games from last 7 days

```sql
SELECT * FROM v_recent_games
WHERE sport = 'MLB'
AND game_date >= date('now', '-7 days')
ORDER BY game_date DESC;
```

### Get team's season record

```sql
SELECT
  COUNT(*) as games_played,
  SUM(CASE WHEN
    (home_team_id = 'mlb-147' AND home_score > away_score) OR
    (away_team_id = 'mlb-147' AND away_score > home_score)
  THEN 1 ELSE 0 END) as wins
FROM games
WHERE (home_team_id = 'mlb-147' OR away_team_id = 'mlb-147')
AND season = 2025;
```

### Get conference standings

```sql
SELECT * FROM v_latest_standings
WHERE sport = 'NCAA_FOOTBALL'
AND conference = 'SEC'
ORDER BY wins DESC;
```

---

## 🎯 Benefits

### For Users
- **Historical context** for all games
- **Season summaries** and trends
- **Head-to-head records**
- **Faster queries** (cached data)

### For Platform
- **Reduced API calls** to external sources
- **Historical analytics** without re-fetching
- **News aggregation** foundation (Phase 16)
- **Offline resilience** (D1 as backup)

### For Development
- **Clean separation** (live vs. historical)
- **Flexible queries** (SQL vs. API polling)
- **Cost-effective** (D1 free tier)
- **Scalable** (edge distribution)

---

## 🔮 Next Phases

### Phase 16 - News Layer

Add RSS feed ingestion:
- D1Baseball, ESPN RSS, conference feeds
- Store in `news_articles` table
- Dedup using content_hash
- Expose via `/api/news`

### Phase 17 - Analytics Caching

Pre-compute analytics in D1:
- Pythagorean expectations
- Efficiency ratings
- Momentum calculations
- Store in `analytics_cache` with TTL

### Phase 18 - Advanced Queries

New endpoints using D1:
- Playoff scenarios
- Strength of schedule
- Historical matchup analysis
- Conference race simulations

---

## 📚 References

- **Schema:** `schema/sports-data.sql`
- **Worker:** `cloudflare-workers/data-ingestion/`
- **Client:** `packages/web/lib/d1/`
- **Endpoints:** `packages/web/app/api/sports/history/`

- **Cloudflare D1 Docs:** https://developers.cloudflare.com/d1/
- **D1 Limits:** https://developers.cloudflare.com/d1/platform/limits/
- **Workers Cron:** https://developers.cloudflare.com/workers/configuration/cron-triggers/

---

## ✅ Phase 15 Complete

**Status:** Schema designed, worker built, client library created, example endpoints added

**Ready for:** D1 deployment and production testing

**Next:** Deploy D1, run ingestion, test historical queries
