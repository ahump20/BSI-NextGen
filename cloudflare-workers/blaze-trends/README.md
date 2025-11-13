# Blaze Trends - Real-Time Sports Highlights

Production-ready Cloudflare Worker for monitoring sports news, analyzing trends with AI, and serving them via fast edge APIs.

## Features

- **Multi-Sport Coverage**: College baseball (priority), MLB, NFL, college football, college basketball
- **AI-Powered Analysis**: OpenAI GPT-4 Turbo identifies trending storylines from news clusters
- **Real-Time Updates**: Cron-triggered monitoring every 15 minutes
- **Fast Caching**: KV storage for <10ms API responses
- **Edge Computing**: Global deployment via Cloudflare Workers
- **Soccer Exclusion**: Explicitly filters out soccer content
- **Underrepresented Focus**: Prioritizes FCS, Group of Five, D1 baseball

## Quick Start

### Prerequisites
- Cloudflare account with Workers enabled
- OpenAI API key (GPT-4 Turbo access)
- Brave Search API key
- Node.js 20+
- wrangler CLI

### Installation

```bash
# Install dependencies
npm install

# Authenticate with Cloudflare
wrangler login

# Create D1 database
npm run db:create

# Update wrangler.toml with database_id

# Initialize database schema
npm run db:init

# Create KV namespaces
npm run kv:create
npm run kv:create:preview

# Update wrangler.toml with KV IDs

# Set API key secrets
npm run secret:openai
npm run secret:brave

# Deploy
npm run deploy
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions.

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T00:00:00.000Z",
  "version": "1.0.0"
}
```

### GET /api/trends
Get latest trends across all sports or filtered by sport.

**Query Parameters:**
- `sport` (optional): Filter by sport (college_baseball, mlb, nfl, college_football, college_basketball)
- `limit` (optional): Number of results (default: 10, max: 50)

**Example:**
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/api/trends?sport=college_baseball&limit=5
```

**Response:**
```json
{
  "trends": [
    {
      "id": "college_baseball_1234567890_abc123",
      "sport": "college_baseball",
      "title": "Mississippi State Sweeps LSU in SEC Series",
      "summary": "The Bulldogs dominated the Tigers...",
      "context": "MSU improves to 15-3 in SEC play...",
      "keyPlayers": ["John Doe", "Jane Smith"],
      "teamIds": ["MSU", "LSU"],
      "significance": "This sweep positions Mississippi State...",
      "viralScore": 85,
      "sources": [
        {
          "url": "https://...",
          "title": "MSU Completes Sweep",
          "publishedAt": "2025-11-12T20:00:00Z",
          "sourceName": "ESPN"
        }
      ],
      "createdAt": "2025-11-12T14:30:00Z",
      "updatedAt": "2025-11-12T14:30:00Z"
    }
  ],
  "cached": false
}
```

### GET /api/trends/:id
Get specific trend by ID.

**Example:**
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/api/trends/college_baseball_1234567890_abc123
```

### GET /cron/monitor
Manually trigger trend monitoring (also runs automatically every 15 minutes via cron).

**Response:**
```json
{
  "success": true,
  "duration": 12456,
  "results": [
    {
      "sport": "college_baseball",
      "articles": 18,
      "trends": 2,
      "duration": 2341
    }
  ],
  "timestamp": "2025-11-13T00:15:00Z"
}
```

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Brave     │─────▶│   Cloudflare │─────▶│     D1      │
│   Search    │      │    Worker    │      │  Database   │
└─────────────┘      └──────────────┘      └─────────────┘
                            │
                            ├─────────────▶ KV Cache
                            │
                            ▼
                     ┌──────────────┐
                     │   OpenAI     │
                     │   GPT-4      │
                     └──────────────┘
```

## Database Schema

### Tables

**trends** - Stores analyzed sports trends
- `id` - Unique identifier (sport_timestamp_hash)
- `sport` - Sport category
- `title` - Trend headline
- `summary` - Brief summary
- `context` - Additional context
- `key_players` - JSON array of player names
- `team_ids` - JSON array of team identifiers
- `significance` - Why this matters
- `viral_score` - Virality metric (0-100)
- `sources` - JSON array of source URLs with metadata
- `created_at` - ISO 8601 timestamp
- `updated_at` - ISO 8601 timestamp

**news_articles** - Raw articles before analysis
- `id` - Article URL hash
- `url` - Original article URL
- `title` - Article title
- `description` - Article snippet
- `published_at` - ISO 8601 timestamp
- `source_name` - Publisher name
- `sport` - Sport category
- `content_hash` - Hash for deduplication
- `processed` - Whether included in trend analysis
- `created_at` - When we fetched it

**monitoring_logs** - System health and API usage tracking
- `id` - Auto-increment
- `timestamp` - ISO 8601 timestamp
- `event_type` - Type of event
- `sport` - Related sport (optional)
- `details` - JSON with event details
- `duration_ms` - Operation duration
- `success` - Whether operation succeeded

## Development

### Local Development
```bash
npm run dev
```

Worker runs at `http://localhost:8787`

### View Logs
```bash
npm run tail
```

### Query Database
```bash
# List trends
npm run db:query "SELECT * FROM trends ORDER BY created_at DESC LIMIT 10"

# Count articles by sport
npm run db:query "SELECT sport, COUNT(*) as count FROM news_articles GROUP BY sport"

# Recent monitoring events
npm run db:query "SELECT * FROM monitoring_logs ORDER BY timestamp DESC LIMIT 10"
```

## Configuration

### Sports Configuration

Edit `src/index.ts` to add/modify sports:

```typescript
const SPORTS_CONFIG = {
  college_baseball: {
    keywords: ['college baseball', 'NCAA baseball', 'D1 baseball', 'CWS', 'College World Series'],
    priority: 1,
  },
  // Add more sports...
};
```

### Exclusions

Soccer is explicitly excluded via keywords:

```typescript
const EXCLUDED_KEYWORDS = [
  'soccer',
  'football' /* when context is soccer */,
  'premier league',
  'champions league',
  'la liga',
  'serie a',
  'bundesliga'
];
```

### Cron Schedule

Configured in `wrangler.toml`:

```toml
[triggers]
crons = ["*/15 * * * *"]  # Every 15 minutes
```

Change to `*/30 * * * *` for every 30 minutes (reduces costs by 50%).

## Monitoring

### Cloudflare Dashboard
Monitor at: https://dash.cloudflare.com

Key metrics:
- Requests per minute
- Error rate
- CPU time
- KV operations
- D1 queries

### Cost Monitoring

| Service | Monthly Usage | Estimated Cost |
|---------|---------------|----------------|
| Workers | ~100k requests | $5 |
| D1 | 5M reads, 100k writes | $0.75 |
| KV | 100k reads | $0.50 |
| OpenAI | 2,880 calls | $10 |
| Brave Search | 14,400 searches | $5 |
| **Total** | | **~$21/month** |

## Troubleshooting

### No Trends Generated

Check monitoring logs:
```bash
npm run db:query "SELECT * FROM monitoring_logs WHERE event_type = 'monitor_error' ORDER BY timestamp DESC LIMIT 5"
```

Manually trigger monitoring:
```bash
curl https://blaze-trends.YOUR_SUBDOMAIN.workers.dev/cron/monitor
```

### Worker Returns 500 Errors

Verify secrets are set:
```bash
wrangler secret list
```

Check logs:
```bash
npm run tail
```

### API Rate Limits

**Brave Search:**
- Free tier: 2,000 queries/month
- Paid tier required for 15-min intervals

**OpenAI:**
- Monitor usage at: https://platform.openai.com/usage
- Set billing limits to avoid overages

## Maintenance

### Clean Old Articles (Monthly)
```bash
npm run db:query "DELETE FROM news_articles WHERE created_at < datetime('now', '-30 days')"
```

### Archive Old Trends (Quarterly)
```bash
npm run db:query "DELETE FROM trends WHERE created_at < datetime('now', '-90 days')"
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test locally with `npm run dev`
5. Deploy to preview with `wrangler deploy --env development`
6. Submit pull request

## License

Proprietary - Blaze Intelligence LLC

## Support

- **Documentation**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: GitHub Issues
- **Contact**: Blaze Sports Intel

---

**Version:** 1.0.0
**Last Updated:** 2025-11-13
