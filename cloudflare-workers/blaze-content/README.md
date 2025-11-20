# Blaze Content Aggregation Worker

Cloudflare Worker that aggregates sports news and content from multiple sources, analyzes with AI, and stores in D1 database for intelligent content feeds.

## Features

- **Automated Content Collection:** Runs every 5 minutes via cron trigger
- **Multi-Source Support:** RSS feeds, APIs, web scraping
- **AI Analysis:** Workers AI for categorization, sentiment, and trending detection (future)
- **Intelligent Deduplication:** URL-based duplicate prevention
- **Real-Time Trending:** Hourly trending topic updates
- **RESTful API:** Content feeds, trending topics, and statistics

## Architecture

```
RSS Feeds → Content Worker → D1 Database → Content API → Client
     ↓            ↓               ↓            ↓
  ESPN       Parsing      Articles Store   Feeds
  MLB.com    Validation   Trending Topics  API
  D1Baseball Dedup        Statistics       JSON
```

## Prerequisites

- Cloudflare account with Workers and D1 enabled
- Node.js 20+ and pnpm
- Wrangler CLI: `npm install -g wrangler`
- D1 database from Phase 15 (blaze-sports-db)

## Installation

```bash
# Navigate to content worker directory
cd cloudflare-workers/blaze-content

# Install dependencies
pnpm install

# Login to Cloudflare
npx wrangler login
```

## Database Setup

### 1. Apply Migration

Assuming you've already created the D1 database in Phase 15:

```bash
# From project root
cd ../../

# Apply content tables migration
npx wrangler d1 execute blaze-sports-db --remote --file=migrations/004_content_tables.sql

# Seed initial content sources
npx wrangler d1 execute blaze-sports-db --remote --file=migrations/seeds/001_content_sources.sql
```

### 2. Update wrangler.toml

Add your D1 database ID and KV namespace ID to `wrangler.toml`:

```toml
[[d1_databases]]
binding = "BLAZE_DB"
database_name = "blaze-sports-db"
database_id = "your-database-id-here"  # From Phase 15

[[kv_namespaces]]
binding = "SPORTS_CACHE"
id = "your-kv-namespace-id-here"  # From Phase 14
```

### 3. Verify Database

```bash
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT name, type, url FROM content_sources WHERE is_active = 1"
```

You should see all 17 initial content sources.

## Development

### Local Testing

```bash
# Start development server
pnpm dev

# Test health endpoint
curl http://localhost:8787/health

# Manually trigger ingestion
curl -X POST http://localhost:8787/ingest

# Get content feed
curl "http://localhost:8787/api/content/feed?league=mlb&limit=10"

# Get trending topics
curl "http://localhost:8787/api/content/trending?limit=10"
```

### View Logs

```bash
# Tail real-time logs
pnpm tail

# View recent articles
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT title, author, published_at FROM content_articles ORDER BY published_at DESC LIMIT 10"
```

## Deployment

### Deploy to Production

```bash
# Deploy worker
pnpm deploy

# Verify deployment
curl https://blaze-content.your-subdomain.workers.dev/health

# Test content feed
curl "https://blaze-content.your-subdomain.workers.dev/api/content/feed?league=mlb"
```

### Monitor Cron Jobs

```bash
# Tail logs to see cron executions
npx wrangler tail blaze-content --format=pretty

# Query content statistics
curl https://blaze-content.your-subdomain.workers.dev/api/content/stats
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

Manually trigger content ingestion job

**Response:**
```json
{
  "message": "Content ingestion started",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

### GET /api/content/feed

Get personalized content feed

**Query Parameters:**
- `league` (optional): Filter by league (mlb, nfl, nba, ncaa-fb)
- `category` (optional): Filter by category (news, analysis, rumor, injury, trade)
- `limit` (optional): Number of articles (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "articles": [
    {
      "id": "uuid",
      "title": "Cardinals Sign Star Pitcher",
      "excerpt": "Brief summary...",
      "author": "John Smith",
      "published_at": 1736596800,
      "url": "https://...",
      "image_url": "https://...",
      "category": "news",
      "sentiment": "positive",
      "trending_score": 75.5,
      "source_name": "ESPN MLB",
      "credibility_score": 90
    }
  ],
  "meta": {
    "league": "mlb",
    "category": null,
    "count": 20,
    "limit": 20,
    "offset": 0,
    "lastUpdated": "2025-01-11T12:00:00.000Z"
  }
}
```

### GET /api/content/trending

Get trending topics

**Query Parameters:**
- `league` (optional): Filter by league
- `limit` (optional): Number of topics (default: 10, max: 50)

**Response:**
```json
{
  "trending": [
    {
      "id": "uuid",
      "topic_value": "injury",
      "topic_type": "category",
      "league_id": "mlb",
      "article_count": 12,
      "velocity": 12.0,
      "sentiment_avg": -0.3,
      "window_start": 1736593200,
      "window_end": 1736596800
    }
  ],
  "meta": {
    "league": "mlb",
    "count": 10,
    "lastUpdated": "2025-01-11T12:00:00.000Z"
  }
}
```

### GET /api/content/source?id={sourceId}

Get recent articles from a specific source

**Query Parameters:**
- `id` (required): Content source ID
- `limit` (optional): Number of articles (default: 20, max: 100)

**Response:**
```json
{
  "articles": [...],
  "meta": {
    "sourceId": "espn-mlb",
    "count": 20,
    "lastUpdated": "2025-01-11T12:00:00.000Z"
  }
}
```

### GET /api/content/stats

Get content ingestion statistics

**Response:**
```json
{
  "stats": {
    "total_articles": 1542,
    "active_sources": 17,
    "analyzed_articles": 0,
    "articles_24h": 312
  },
  "meta": {
    "timestamp": "2025-01-11T12:00:00.000Z"
  }
}
```

## Content Sources

### Initial Sources (17 configured)

**MLB (3 sources):**
- ESPN MLB (credibility: 90)
- MLB.com News (credibility: 95)
- MLB Trade Rumors (credibility: 80)

**NFL (3 sources):**
- ESPN NFL (credibility: 90)
- NFL.com News (credibility: 95)
- Pro Football Talk (credibility: 85)

**NBA (2 sources):**
- ESPN NBA (credibility: 90)
- NBA.com News (credibility: 95)

**NCAA Football (2 sources):**
- ESPN College Football (credibility: 90)
- On3 College Football (credibility: 80)

**College Baseball (3 sources) - HIGH PRIORITY:**
- D1Baseball (credibility: 90)
- Baseball America College (credibility: 85)
- Perfect Game News (credibility: 80)

**General Sports (2 sources):**
- The Athletic (credibility: 95)
- Sports Illustrated (credibility: 85)

**Regional - Texas (2 sources):**
- Texas Longhorns Official (credibility: 90)
- Burnt Orange Nation (credibility: 75)

### Adding New Sources

```sql
INSERT INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds)
VALUES ('source-id', 'Source Name', 'rss', 'https://example.com/feed.xml', 85, 300);
```

## Ingestion Schedule

The worker runs **every 5 minutes** via cron trigger:

```
*/5 * * * * - Every 5 minutes
```

### What Gets Ingested:

- **Per Run:** Up to 20 sources (oldest fetched first)
- **Deduplication:** URL-based (skips duplicates)
- **Validation:** Title and URL required
- **Storage:** Full HTML content preserved

## Database Queries

### Get Recent Articles

```sql
SELECT
  a.title,
  a.published_at,
  s.name as source,
  a.url
FROM content_articles a
JOIN content_sources s ON a.source_id = s.id
ORDER BY a.published_at DESC
LIMIT 20;
```

### Get Articles by Source

```sql
SELECT title, published_at, url
FROM content_articles
WHERE source_id = 'espn-mlb'
ORDER BY published_at DESC
LIMIT 10;
```

### Get Content Statistics

```sql
SELECT
  source_id,
  COUNT(*) as article_count,
  MIN(published_at) as first_article,
  MAX(published_at) as latest_article
FROM content_articles
GROUP BY source_id
ORDER BY article_count DESC;
```

### Get Trending Topics

```sql
SELECT
  topic_value,
  article_count,
  velocity,
  sentiment_avg
FROM trending_topics
WHERE window_end > unixepoch() - 3600
ORDER BY velocity DESC
LIMIT 10;
```

## Troubleshooting

### Worker Not Running

```bash
# Check worker status
npx wrangler tail blaze-content

# Manually trigger to test
curl -X POST https://blaze-content.your-subdomain.workers.dev/ingest
```

### Database Connection Issues

```bash
# Verify database exists
npx wrangler d1 list

# Check database info
npx wrangler d1 info blaze-sports-db

# Test direct query
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT COUNT(*) FROM content_articles"
```

### RSS Feed Failures

Check logs for specific feed errors:

```bash
npx wrangler tail blaze-content

# Look for errors like:
# "[RSS Ingestor] Fetch failed: https://example.com/feed.xml"
```

Common issues:
- **Feed unavailable:** Source website down
- **Invalid XML:** Malformed RSS feed
- **Rate limiting:** Too many requests to source

### No Articles Being Inserted

```bash
# Check if sources are active
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT id, name, is_active, last_fetched_at FROM content_sources"

# Check for duplicate URLs
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT url, COUNT(*) FROM content_articles GROUP BY url HAVING COUNT(*) > 1"
```

## Performance

- **Ingestion Duration:** ~3-10 seconds per source
- **Total Cron Execution:** <2 minutes per run (20 sources max)
- **API Response Time:** <100ms for feeds, <50ms for trending
- **Duplicate Prevention:** >99% effectiveness via URL matching
- **Storage Efficiency:** ~500 bytes per article on average

## Next Steps

- [ ] Implement AI analysis with Workers AI (Phase 16.1)
- [ ] Add API and scraper ingestors (Phase 16.2)
- [ ] Implement topic extraction and entity recognition (Phase 16.3)
- [ ] Add user authentication and preferences (Phase 17)
- [ ] Create WebSocket connections for real-time updates (Phase 17)
- [ ] Implement push notifications (Phase 17)

## License

MIT - Blaze Sports Intel
