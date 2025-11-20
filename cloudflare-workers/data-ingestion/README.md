# BSI Data Ingestion Worker

Cloudflare Worker for periodic ingestion of sports data into D1 database.

## Purpose

This worker runs on a schedule (every 15 minutes) to:
1. Fetch latest sports data from BSI Next.js APIs
2. Store historical game records in Cloudflare D1
3. Track team information across all sports
4. Log ingestion runs for monitoring

## Architecture

```
┌─────────────────────────────────────────────┐
│         Cloudflare Cron Trigger             │
│            (Every 15 minutes)               │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│       Data Ingestion Worker (Edge)          │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   MLB    │  │   NFL    │  │   NBA    │  │
│  │ Ingester │  │ Ingester │  │ Ingester │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   NCAA   │  │   NCAA   │  │ College  │  │
│  │ Football │  │Basketball│  │ Baseball │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
└────────────────┬─────────┬──────────────────┘
                 │         │
         Fetch   │         │ Write
         from    │         │ to
         APIs    │         │
                 ▼         ▼
        ┌────────────┐  ┌─────────────┐
        │  Next.js   │  │ Cloudflare  │
        │    APIs    │  │  D1 Database│
        │            │  │             │
        │ /api/sports│  │  • games    │
        │ /live-scores│  │  • teams   │
        └────────────┘  │  • standings│
                        │  • logs     │
                        └─────────────┘
```

## Setup

### 1. Create D1 Database

```bash
# Create D1 database
wrangler d1 create bsi-sports-data

# Copy the database ID from output
# Update wrangler.toml with the database_id
```

### 2. Initialize Database Schema

```bash
# Run schema initialization
wrangler d1 execute bsi-sports-data --file=../../schema/sports-data.sql

# Verify tables were created
wrangler d1 execute bsi-sports-data --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### 3. Configure Environment

Update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "bsi-sports-data"
database_id = "YOUR_D1_DATABASE_ID_HERE" # From step 1

[vars]
WEB_APP_ORIGIN = "http://localhost:3000" # For local dev

[env.production]
[env.production.vars]
WEB_APP_ORIGIN = "https://blazesportsintel.com" # For production
```

### 4. Install Dependencies

```bash
pnpm install
```

## Development

### Local Testing

```bash
# Start local dev server
pnpm dev

# The worker will be available at http://localhost:8787

# Test health check
curl http://localhost:8787/health

# Trigger manual ingestion
curl http://localhost:8787/ingest?sport=mlb
curl http://localhost:8787/ingest?sport=all
```

### Database Queries (Local Development)

```bash
# Query D1 database locally
wrangler d1 execute bsi-sports-data --local --command "SELECT * FROM games LIMIT 10;"

# Count games by sport
wrangler d1 execute bsi-sports-data --local --command "SELECT sport, COUNT(*) as count FROM games GROUP BY sport;"

# View ingestion logs
wrangler d1 execute bsi-sports-data --local --command "SELECT * FROM ingestion_log ORDER BY started_at DESC LIMIT 10;"
```

## Deployment

### Deploy to Production

```bash
# Deploy worker
pnpm deploy

# Verify deployment
curl https://bsi-data-ingestion.WORKER_SUBDOMAIN.workers.dev/health
```

### Cron Schedule

The worker runs automatically every 15 minutes via Cloudflare Cron Triggers:

- **Schedule:** `*/15 * * * *` (every 15 minutes)
- **Coverage:** All 7 sports ingested in parallel
- **Duration:** ~5-10 seconds per run
- **Cost:** Free tier supports 250,000 invocations/day

## API Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T12:00:00.000Z"
}
```

### `GET /ingest?sport={sport}`

Manually trigger ingestion for a specific sport or all sports.

**Parameters:**
- `sport`: `mlb`, `nfl`, `nba`, `ncaa-football`, `ncaa-basketball`, `college-baseball`, or `all`

**Example:**
```bash
curl "https://bsi-data-ingestion.WORKER_SUBDOMAIN.workers.dev/ingest?sport=mlb"
```

**Response:**
```json
{
  "success": true,
  "sport": "mlb",
  "durationMs": 1234,
  "recordsProcessed": 15,
  "recordsInserted": 12,
  "recordsUpdated": 3,
  "recordsFailed": 0,
  "errors": []
}
```

## Monitoring

### View Logs

```bash
# Stream real-time logs
pnpm tail

# Or use Cloudflare dashboard
# Workers & Pages > bsi-data-ingestion > Logs
```

### Query Ingestion History

```bash
# View recent ingestion runs
wrangler d1 execute bsi-sports-data --command \
  "SELECT job_type, sport, status, records_processed, records_inserted, duration_ms, started_at
   FROM ingestion_log
   ORDER BY started_at DESC
   LIMIT 20;"

# View error logs
wrangler d1 execute bsi-sports-data --command \
  "SELECT sport, error_message, started_at
   FROM ingestion_log
   WHERE status = 'failed'
   ORDER BY started_at DESC
   LIMIT 10;"
```

### Database Stats

```bash
# Game counts by sport
wrangler d1 execute bsi-sports-data --command \
  "SELECT sport, COUNT(*) as game_count,
   COUNT(CASE WHEN status = 'live' THEN 1 END) as live_games,
   COUNT(CASE WHEN status = 'final' THEN 1 END) as final_games
   FROM games
   GROUP BY sport;"

# Recent games
wrangler d1 execute bsi-sports-data --command \
  "SELECT * FROM v_recent_games LIMIT 20;"

# Live games
wrangler d1 execute bsi-sports-data --command \
  "SELECT * FROM v_live_games;"
```

## Data Flow

### Sports Covered

1. **MLB** - Via MLBAdapter → `/api/sports/mlb/games`
2. **NFL** - Via NFLAdapter → `/api/sports/nfl/games`
3. **NBA** - Via NBAAdapter → `/api/sports/nba/games`
4. **NCAA Football** - Direct ESPN API
5. **NCAA Basketball** - Direct ESPN API
6. **College Baseball** - Direct ESPN API
7. **Youth Sports** - (Future: Texas HS + Perfect Game)

### Ingestion Strategy

**Per Sport:**
1. Fetch today's games from Next.js API or ESPN
2. Parse and normalize game data
3. Upsert game records (INSERT or UPDATE on conflict)
4. Upsert team records
5. Log success/failure metrics

**Parallel Execution:**
- All sports ingest simultaneously
- Failures in one sport don't block others
- Individual results logged per sport

### Data Retention

- **Games:** Indefinite (historical archive)
- **Teams:** Indefinite (master list)
- **Standings:** Snapshots by date
- **Ingestion Logs:** Recommend 90 days

## Cost Analysis

### D1 Database

- **Free Tier:**
  - 5 GB storage
  - 5 million rows read/day
  - 100,000 rows written/day

- **Expected Usage (per day):**
  - Rows written: ~2,000 games + teams (~10,000/day)
  - Rows read: Minimal (ingestion only writes)
  - Storage: ~100 MB/month growth

**Verdict:** Well within free tier ✅

### Worker Invocations

- **Free Tier:** 100,000 requests/day
- **Expected Usage:**
  - Cron: 96 invocations/day (every 15 min)
  - Manual triggers: < 10/day
  - Total: < 200/day

**Verdict:** Well within free tier ✅

## Troubleshooting

### Worker Not Running

```bash
# Check cron triggers
wrangler deployments list

# Verify cron is enabled in wrangler.toml
```

### D1 Connection Issues

```bash
# Verify database binding
wrangler d1 list

# Check database ID in wrangler.toml matches
```

### Ingestion Failures

```bash
# Check error logs
wrangler d1 execute bsi-sports-data --command \
  "SELECT * FROM ingestion_log WHERE status = 'failed' ORDER BY started_at DESC LIMIT 5;"

# Common issues:
# 1. WEB_APP_ORIGIN not set correctly
# 2. Next.js APIs returning errors
# 3. Network timeouts
```

### Data Not Appearing

```bash
# Trigger manual ingestion
curl "https://WORKER_URL/ingest?sport=all"

# Check ingestion log
wrangler d1 execute bsi-sports-data --command \
  "SELECT * FROM ingestion_log ORDER BY started_at DESC LIMIT 1;"

# Verify games table
wrangler d1 execute bsi-sports-data --command \
  "SELECT COUNT(*), sport FROM games GROUP BY sport;"
```

## Next Steps

### Phase 16 - News Ingestion

Add RSS feed ingestion for sports news:

```typescript
async function ingestNews(env: Env): Promise<IngestResult> {
  // Fetch from D1Baseball, ESPN RSS, etc.
  // Store in news_articles table
  // Deduplicate using content_hash
}
```

### Phase 17 - Analytics Caching

Pre-compute analytics and cache in D1:

```typescript
async function cacheTeamAnalytics(env: Env, teamId: string): Promise<void> {
  // Fetch from /api/ncaa/{sport}/{teamId}
  // Extract Pythagorean, efficiency, momentum
  // Store in analytics_cache table with TTL
}
```

### Phase 18 - Historical Queries

Add endpoints that query D1 for historical data:

- Season summaries
- Head-to-head records
- Team trends over time
- Conference standings history

## References

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)
- Main schema: `../../schema/sports-data.sql`
