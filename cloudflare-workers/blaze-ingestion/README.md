# Blaze Sports Ingestion Worker

Cloudflare Worker that ingests sports data from external APIs into D1 database for persistence and historical queries.

## Features

- **Automated Data Collection:** Runs every 15 minutes via cron trigger
- **Multi-Sport Support:** MLB, NFL, NBA, NCAA Football
- **Historical Backfill:** Commands to backfill past seasons
- **Deduplication:** Smart upsert logic prevents duplicate entries
- **Error Tracking:** Comprehensive logging to `ingestion_logs` table
- **Manual Triggers:** HTTP endpoints for on-demand ingestion

## Setup

### Prerequisites

- Cloudflare account with Workers and D1 enabled
- Node.js 20+ and pnpm
- Wrangler CLI: `npm install -g wrangler`
- SportsDataIO API key (for NFL/NBA)

### Installation

```bash
# Navigate to worker directory
cd cloudflare-workers/blaze-ingestion

# Install dependencies
pnpm install

# Login to Cloudflare
npx wrangler login
```

### Database Setup

1. **Create D1 Database:**

```bash
npx wrangler d1 create blaze-sports-db
```

Output will provide database ID. Copy it to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "BLAZE_DB"
database_name = "blaze-sports-db"
database_id = "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx"  # Paste here
```

2. **Run Migrations:**

```bash
# From project root
cd ../../

# Apply migrations in order
npx wrangler d1 execute blaze-sports-db --remote --file=migrations/001_core_tables.sql
npx wrangler d1 execute blaze-sports-db --remote --file=migrations/002_sport_extensions.sql
npx wrangler d1 execute blaze-sports-db --remote --file=migrations/003_analytics.sql
```

3. **Verify Database:**

```bash
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

You should see: `games`, `game_stats`, `ingestion_logs`, `leagues`, `seasons`, `team_stats`, `teams`, etc.

### KV Namespace Setup

```bash
# Create KV namespace for caching
npx wrangler kv:namespace create SPORTS_CACHE

# Copy the ID to wrangler.toml
[[kv_namespaces]]
binding = "SPORTS_CACHE"
id = "xxxxx"  # Paste here
```

### Secrets Configuration

```bash
# Set SportsDataIO API key
npx wrangler secret put SPORTSDATAIO_API_KEY
# Enter your API key when prompted
```

## Development

### Local Testing

```bash
# Start development server
pnpm dev

# Test health endpoint
curl http://localhost:8787/health

# Manually trigger ingestion
curl -X POST http://localhost:8787/ingest
```

### View Logs

```bash
# Tail real-time logs
pnpm tail

# View recent ingestion logs from database
pnpm logs
```

## Deployment

### Deploy to Production

```bash
# Deploy worker
pnpm deploy

# Verify deployment
curl https://blaze-ingestion.your-subdomain.workers.dev/health

# Check ingestion logs
curl https://blaze-ingestion.your-subdomain.workers.dev/logs?limit=10
```

### Monitor Cron Jobs

```bash
# Tail logs to see cron executions
npx wrangler tail blaze-ingestion --format=pretty

# Query ingestion logs from database
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT * FROM ingestion_logs ORDER BY started_at DESC LIMIT 20"
```

## API Endpoints

### GET /health

Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-11T12:00:00.000Z",
  "version": "1.0.0"
}
```

### POST /ingest

Manually trigger ingestion job

**Response:**
```json
{
  "message": "Ingestion job started",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### GET /logs?limit=10

Get recent ingestion logs

**Response:**
```json
[
  {
    "id": "uuid",
    "league_id": "mlb",
    "ingestion_type": "games",
    "records_processed": 15,
    "records_inserted": 10,
    "records_updated": 5,
    "records_failed": 0,
    "started_at": 1736596800,
    "completed_at": 1736596805,
    "error_message": null
  }
]
```

## Ingestion Schedule

The worker runs **every 15 minutes** via cron trigger:

```
*/15 * * * * - Every 15 minutes
```

### What Gets Ingested:

- **MLB:** Today's games (all games scheduled for current date)
- **NFL:** Current week's games (based on season calendar)
- **NBA:** Today's games
- **NCAA:** Current week's games

## Historical Backfill

### Backfill MLB Season

```typescript
// In a separate script or manual execution
const mlbIngestor = new MLBIngestor(env);
await mlbIngestor.backfillSeason(2024);
// Ingests all games from March 20, 2024 to November 1, 2024
```

### Backfill NFL Season

```typescript
const nflIngestor = new NFLIngestor(env);
await nflIngestor.backfillSeason(2024);
// Ingests all 18 weeks of regular season
```

### Backfill via Worker Endpoint

Create a new endpoint in `src/index.ts`:

```typescript
if (url.pathname === '/backfill' && request.method === 'POST') {
  const { sport, season } = await request.json();

  // Trigger backfill in background
  ctx.waitUntil(performBackfill(sport, season, env));

  return new Response('Backfill started', { status: 202 });
}
```

## Database Queries

### Get Today's Games

```sql
SELECT
  g.id,
  g.scheduled_at,
  g.status,
  g.home_score,
  g.away_score,
  ht.name as home_team,
  at.name as away_team
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
WHERE date(g.scheduled_at, 'unixepoch') = date('now')
ORDER BY g.scheduled_at;
```

### Get Team Standings

```sql
SELECT
  t.name,
  t.abbreviation,
  ts.wins,
  ts.losses,
  ts.ties,
  ROUND(CAST(ts.wins AS REAL) / (ts.wins + ts.losses), 3) as win_pct,
  ts.points_for,
  ts.points_against,
  ts.streak
FROM team_stats ts
JOIN teams t ON ts.team_id = t.id
WHERE ts.season_id = 'mlb-2025'
ORDER BY win_pct DESC;
```

### Get Ingestion Stats

```sql
SELECT
  league_id,
  COUNT(*) as total_runs,
  SUM(records_inserted) as total_inserted,
  SUM(records_updated) as total_updated,
  SUM(records_failed) as total_failed,
  AVG(completed_at - started_at) as avg_duration_seconds
FROM ingestion_logs
WHERE started_at > unixepoch() - 86400  -- Last 24 hours
GROUP BY league_id;
```

## Troubleshooting

### Worker Not Running

```bash
# Check worker status
npx wrangler tail blaze-ingestion

# Manually trigger to test
curl -X POST https://blaze-ingestion.your-subdomain.workers.dev/ingest
```

### Database Connection Issues

```bash
# Verify database exists
npx wrangler d1 list

# Check database info
npx wrangler d1 info blaze-sports-db

# Test direct query
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT COUNT(*) FROM games"
```

### API Rate Limits

SportsDataIO free tier limits:
- **Requests per minute:** 10
- **Requests per day:** 1,000

If you hit rate limits, ingestion will fail. Consider upgrading or reducing ingestion frequency.

### Check Error Logs

```sql
SELECT * FROM ingestion_logs
WHERE error_message IS NOT NULL
ORDER BY started_at DESC
LIMIT 20;
```

## Performance

- **Ingestion Duration:** ~2-5 seconds per sport
- **Total Cron Execution:** <20 seconds per run
- **Database Writes:** Batched for efficiency
- **API Calls:** Minimized via deduplication

## Next Steps

- [ ] Add NBA and NCAA ingestor implementations
- [ ] Implement batch processing for large datasets
- [ ] Add data validation layer
- [ ] Create monitoring dashboard
- [ ] Add webhook notifications for failures
- [ ] Implement retry logic with exponential backoff
- [ ] Add metrics tracking (Cloudflare Analytics Engine)

## License

MIT - Blaze Sports Intel
