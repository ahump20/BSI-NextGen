# BSI News Ingestion Worker

Cloudflare Worker for periodic ingestion of sports news from RSS feeds into D1 database.

## Purpose

This worker runs on a schedule (every 30 minutes) to:
1. Fetch sports news from RSS feeds (D1Baseball, ESPN, MLB, NFL, NBA, etc.)
2. Parse RSS XML and extract articles
3. Deduplicate using content hash
4. Store in D1 `news_articles` table
5. Log ingestion metrics

## RSS Sources

### College Baseball
- **D1Baseball** - https://d1baseball.com/feed/
- **Baseball America** - https://www.baseballamerica.com/college/feed/

### Professional Sports
- **MLB News** - https://www.mlb.com/feeds/news/rss.xml
- **NFL News** - https://www.nfl.com/feeds/rss/news
- **NBA News** - https://www.nba.com/news/rss.xml

### NCAA Sports
- **ESPN College Football** - https://www.espn.com/espn/rss/ncf/news
- **ESPN College Basketball** - https://www.espn.com/espn/rss/ncb/news

### General
- **ESPN Top Headlines** - https://www.espn.com/espn/rss/news

All sources are **free public RSS feeds** - no API keys required.

## Setup

### 1. Install Dependencies

```bash
cd cloudflare-workers/news-ingestion
pnpm install
```

### 2. Configure Database

Use the **same D1 database** as data ingestion worker:

```toml
# wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "bsi-sports-data"
database_id = "YOUR_D1_DATABASE_ID" # Same as data-ingestion worker
```

The `news_articles` table is already created by the schema in Phase 15.

### 3. Deploy Worker

```bash
pnpm deploy
```

## Development

### Local Testing

```bash
# Start local dev server
pnpm dev

# Health check
curl http://localhost:8787/health

# Trigger manual ingestion (all sources)
curl http://localhost:8787/ingest

# Trigger specific source
curl "http://localhost:8787/ingest?source=D1Baseball"

# List available sources
curl http://localhost:8787/sources
```

## API Endpoints

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-20T12:00:00.000Z",
  "sources": 8
}
```

### `GET /ingest?source={sourceName}`

Manually trigger news ingestion.

**Parameters:**
- `source` (optional) - Specific source name or omit for all sources

**Examples:**
```bash
# Ingest all sources
curl "https://bsi-news-ingestion.WORKER_URL.workers.dev/ingest"

# Ingest D1Baseball only
curl "https://bsi-news-ingestion.WORKER_URL.workers.dev/ingest?source=D1Baseball"
```

**Response:**
```json
{
  "success": true,
  "source": "all",
  "durationMs": 2345,
  "recordsProcessed": 142,
  "recordsInserted": 38,
  "recordsSkipped": 104,
  "recordsFailed": 0,
  "errors": []
}
```

### `GET /sources`

List all configured RSS sources.

**Response:**
```json
{
  "success": true,
  "sources": [
    {
      "name": "D1Baseball",
      "sport": "COLLEGE_BASEBALL",
      "url": "https://d1baseball.com/feed/"
    },
    ...
  ]
}
```

## Deduplication Strategy

### Content Hash Generation

Articles are deduplicated using **SHA-256 hash** of:
- Full title
- First 200 characters of description

### Duplicate Detection

Before inserting, worker checks:
1. Content hash matches existing article
2. URL matches existing article

If either matches, article is **skipped** (not inserted).

### Why This Works

- Same article from different sources → same hash → deduplicated ✅
- Slightly different titles/descriptions → different hash → both stored ✅
- URL changes (tracking params) → caught by URL check ✅

## Cron Schedule

**Schedule:** `*/30 * * * *` (every 30 minutes)

**Coverage:**
- Runs 48 times per day
- ~1,000-2,000 articles processed per day
- ~50-200 new articles inserted per day (after deduplication)

**Why 30 minutes?**
- News doesn't update that frequently
- Reduces worker invocations (cost)
- Still provides timely news updates

## Data Storage

### Database Table

Articles stored in `news_articles` table:

```sql
CREATE TABLE news_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  description TEXT,
  content TEXT,
  source_name TEXT NOT NULL,
  author TEXT,
  sport TEXT, -- 'MLB', 'NFL', 'COLLEGE_BASEBALL', etc.
  published_at TEXT NOT NULL,
  content_hash TEXT,
  image_url TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

### Indexes

- `idx_news_sport` - (sport, published_at DESC)
- `idx_news_published` - (published_at DESC)
- `idx_news_source` - (source_name, published_at)
- `idx_news_hash` - (content_hash) for dedup
- `idx_news_url` - (url) for dedup

## Monitoring

### View Logs

```bash
# Stream real-time logs
pnpm tail

# Or use Cloudflare dashboard
```

### Query Ingestion History

```bash
# View recent news ingestion runs
wrangler d1 execute bsi-sports-data --command \
  "SELECT job_type, sport, status, records_processed, records_inserted,
   CAST(metadata AS TEXT) as meta, started_at
   FROM ingestion_log
   WHERE job_type = 'news'
   ORDER BY started_at DESC
   LIMIT 10;"
```

### Check News Articles

```bash
# Count by sport
wrangler d1 execute bsi-sports-data --command \
  "SELECT sport, COUNT(*) as count
   FROM news_articles
   GROUP BY sport;"

# Recent articles
wrangler d1 execute bsi-sports-data --command \
  "SELECT title, source_name, sport, published_at
   FROM news_articles
   ORDER BY published_at DESC
   LIMIT 20;"

# Deduplication stats
wrangler d1 execute bsi-sports-data --command \
  "SELECT COUNT(*) as total_articles,
   COUNT(DISTINCT content_hash) as unique_content
   FROM news_articles;"
```

## RSS Parsing

### Lightweight Parser

Uses **regex-based parsing** (no XML library):
- Faster in Workers environment
- Lower memory footprint
- Handles common RSS 2.0 format

### Fields Extracted

- `<title>` - Article title
- `<link>` - Article URL
- `<description>` - Article summary
- `<content:encoded>` or `<content>` - Full content
- `<author>` or `<dc:creator>` - Author
- `<pubDate>` - Published date
- `<media:thumbnail>`, `<enclosure>`, `<media:content>` - Images

### HTML Cleaning

All extracted fields are cleaned:
- Remove CDATA wrappers
- Strip HTML tags
- Decode HTML entities (&quot;, &amp;, etc.)
- Normalize whitespace

## Error Handling

### Per-Source Isolation

Each RSS source ingests independently:
- Failure in one source doesn't block others
- Errors logged separately per source
- Partial success is acceptable

### Common Errors

1. **RSS feed timeout** - Retry on next run
2. **Invalid XML** - Log error, skip source
3. **Duplicate article** - Skip (not an error)
4. **Missing required fields** - Skip article

### Logging

All errors logged to `ingestion_log`:
```sql
SELECT error_message, started_at
FROM ingestion_log
WHERE job_type = 'news' AND status != 'success'
ORDER BY started_at DESC;
```

## Cost Analysis

### Worker Invocations

- **Cron:** 48 invocations/day
- **Manual:** < 10/day
- **Total:** ~60/day

**Free tier:** 100,000/day ✅

### D1 Operations

- **Reads:** ~500 duplication checks/run = 24K/day
- **Writes:** ~50-200 inserts/day
- **Total:** Well within free tier ✅

**Verdict:** $0/month ✅

## Adding New RSS Sources

Edit `src/index.ts`:

```typescript
const NEWS_SOURCES: NewsSource[] = [
  // ... existing sources

  // Add new source
  {
    name: 'New Source Name',
    url: 'https://example.com/feed.xml',
    sport: 'MLB', // or null for general
  },
];
```

Redeploy:
```bash
pnpm deploy
```

## Troubleshooting

### No Articles Appearing

1. Check worker logs for errors
2. Verify cron is running (`wrangler deployments list`)
3. Manually trigger ingestion (`curl .../ingest`)
4. Check D1 database (`SELECT COUNT(*) FROM news_articles`)

### All Articles Skipped (Duplicates)

- Normal after initial run
- Articles only inserted once
- Check `recordsSkipped` in response

### RSS Feed Errors

- Some feeds may be temporarily unavailable
- Worker will retry on next cron run
- Check specific source: `curl ".../ingest?source=SourceName"`

## Next Steps

### Expand Sources

Add more RSS feeds:
- Conference-specific feeds
- Team-specific feeds
- Regional sports news
- Analyst blogs

### Content Enhancement

- Extract keywords from titles/descriptions
- Auto-tag mentioned teams
- Sentiment analysis
- Article categorization (game recaps, recruiting, etc.)

### User Features

- Save favorite sources
- Email/push notifications for keywords
- Personalized news feed
- Bookmarking

## References

- Main schema: `../../schema/sports-data.sql`
- Next.js news API: `../../packages/web/app/api/news/route.ts`
- News components: `../../packages/web/src/components/NewsFeed.tsx`
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
