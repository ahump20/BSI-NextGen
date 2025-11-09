# 🤘 Texas Longhorns Baseball Stats Pipeline

**Production-ready Cloudflare Workers deployment for real-time Texas Longhorns baseball statistics and analytics.**

Part of the BSI-NextGen (Blaze Sports Intel) platform, this pipeline demonstrates the **blaze-data-integrator** skill pattern for sports data acquisition, storage, and analytics.

## 🔥 Features

### Data Integration
- ✅ **Real-time scraping** from ESPN Stats API
- ✅ **Retry logic** with exponential backoff (3 attempts, 1s→2s→4s)
- ✅ **User-Agent compliance** for API access
- ✅ **Data validation** (AB>0 for batting, IP>0 for pitching)
- ✅ **Normalized player names** for consistency

### Database & Storage
- ✅ **Cloudflare D1** serverless SQL database
- ✅ **20+ stat fields** (batting and pitching)
- ✅ **Generated columns** for derived metrics (OPS, ERA, WHIP, K/9, BB/9)
- ✅ **6 performance indexes** for query optimization
- ✅ **Season aggregation views** for analytics

### Analytics & Metrics
- ✅ **Advanced sabermetrics**: OPS, ISO, wOBA, FIP
- ✅ **Rankings**: Top 10 hitters (OPS), Top 10 pitchers (ERA)
- ✅ **Season totals** with aggregated stats
- ✅ **Real-time leaderboards**

### API & Dashboard
- ✅ **RESTful API** with 3 endpoints
- ✅ **Mobile-first dashboard** with burnt orange theme
- ✅ **Real-time updates** via fetch API
- ✅ **Responsive design** for phones/tablets
- ✅ **CORS enabled** for frontend integration

### Automation
- ✅ **Scheduled updates** (daily at 6 AM CT via Cron)
- ✅ **One-command deployment** (`./deploy.sh`)
- ✅ **CLI tool** for management (7 commands)
- ✅ **Production error handling**

## 📁 Project Structure

```
cloudflare-workers/longhorns-baseball/
├── worker.js           # Main Cloudflare Worker (API endpoints)
├── scraper.js          # ESPN Stats API scraper with retry logic
├── schema.sql          # D1 database schema (tables, indexes, views)
├── dashboard.html      # Mobile-first analytics dashboard
├── cli.js              # Management CLI (7 commands)
├── deploy.sh           # One-command deployment script
├── wrangler.toml       # Cloudflare Workers configuration
├── package.json        # NPM dependencies and scripts
└── README.md           # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed globally
- Cloudflare account (free tier works)

### Installation

```bash
# 1. Navigate to the project directory
cd cloudflare-workers/longhorns-baseball

# 2. Install dependencies
npm install

# 3. Login to Cloudflare
wrangler login

# 4. Deploy (creates database, applies schema, deploys worker)
./deploy.sh
```

### Manual Setup (Alternative)

```bash
# Create D1 database
npm run db:create

# Apply schema
npm run db:execute

# Deploy worker
npm run deploy
```

## 📊 API Endpoints

### POST /api/update
Trigger scrape of latest stats from ESPN and store in D1 database.

```bash
curl -X POST https://your-worker.workers.dev/api/update
```

**Response:**
```json
{
  "success": true,
  "scrape": {
    "team": "Texas Longhorns",
    "playerCount": 25,
    "battingCount": 18,
    "pitchingCount": 7,
    "duration": "2847ms"
  },
  "storage": {
    "insertedCount": { "batting": 18, "pitching": 7 },
    "errors": []
  }
}
```

### GET /api/stats
Query player statistics with optional filters.

**Query Parameters:**
- `player` (optional): Filter by player name (partial match)
- `stat_type` (optional): Filter by `batting` or `pitching`

```bash
# Get all stats
curl https://your-worker.workers.dev/api/stats

# Get specific player
curl https://your-worker.workers.dev/api/stats?player=Smith

# Get all pitchers
curl https://your-worker.workers.dev/api/stats?stat_type=pitching
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "player_name": "John Smith",
      "stat_type": "batting",
      "at_bats": 120,
      "hits": 42,
      "batting_avg": 0.350,
      "ops": 1.025
    }
  ]
}
```

### GET /api/analytics
Get advanced analytics and rankings.

```bash
curl https://your-worker.workers.dev/api/analytics
```

**Response:**
```json
{
  "success": true,
  "analytics": {
    "topHitters": [...],
    "topPitchers": [...],
    "seasonStats": {
      "total_players": 25,
      "total_records": 25,
      "last_update": "2025-11-09T12:00:00Z"
    }
  }
}
```

### GET /
Access the mobile-first analytics dashboard.

```bash
open https://your-worker.workers.dev/
```

## 🛠️ CLI Tool

The included CLI provides convenient management commands:

```bash
# Initialize project (create database, apply schema)
node cli.js init

# Deploy to Cloudflare
node cli.js deploy

# Trigger stats update
node cli.js update https://your-worker.workers.dev

# Query player stats
node cli.js query https://your-worker.workers.dev "Smith"

# View analytics dashboard (terminal)
node cli.js analytics https://your-worker.workers.dev

# Tail worker logs
node cli.js logs

# Show help
node cli.js help
```

## 📦 NPM Scripts

```bash
npm run dev          # Start local development server
npm run deploy       # Deploy to Cloudflare
npm run tail         # Tail worker logs
npm run init         # Initialize database
npm run update       # Trigger stats update
npm run analytics    # View analytics
npm run db:create    # Create D1 database
npm run db:execute   # Apply schema
npm run db:backup    # Export database to SQL file
```

## 🏗️ Database Schema

### Tables

**player_stats**
- Primary stats: `at_bats`, `hits`, `runs`, `rbi`, `home_runs`, etc.
- Pitching stats: `innings_pitched`, `earned_runs`, `strikeouts_pitched`, etc.
- Generated columns: `batting_avg`, `ops`, `era`, `whip`, `k_per_9`, `bb_per_9`

### Views

- **season_batting_stats**: Aggregated season totals for batters
- **season_pitching_stats**: Aggregated season totals for pitchers

### Indexes

- `idx_player_name` - Fast player lookup
- `idx_stat_type` - Filter by batting/pitching
- `idx_game_date` - Chronological queries
- `idx_ops` - Batting rankings
- `idx_era` - Pitching rankings
- `idx_scraped_at` - Recent updates

## 🎨 Dashboard Features

### Design
- **Burnt orange theme** (Texas Longhorns colors: #bf5700)
- **Mobile-first** responsive grid layout
- **Real-time updates** with loading states
- **Status notifications** (success/error/loading)

### Components
- Season overview cards
- Top 10 hitters leaderboard (ranked by OPS)
- Top 10 pitchers leaderboard (ranked by ERA)
- Update controls with real-time feedback

### Compatibility
- Works on all modern browsers
- Responsive breakpoints for mobile/tablet/desktop
- Touch-friendly controls

## ⚙️ Configuration

### wrangler.toml

Key settings:
- `name`: Worker name (`longhorns-baseball-tracker`)
- `account_id`: Your Cloudflare account ID
- `database_id`: D1 database ID (auto-generated)
- `crons`: Scheduled trigger (`0 12 * * *` = 6 AM CT)

### Environment Variables

```toml
[vars]
TEAM_NAME = "Texas Longhorns"
TEAM_ID = "251"
TIMEZONE = "America/Chicago"
```

## 🔄 Scheduled Updates

The worker automatically scrapes and updates stats:
- **Schedule**: Daily at 6:00 AM Central Time (12:00 UTC)
- **Trigger**: Cloudflare Cron
- **Logs**: View with `npm run tail`

## 📈 Performance

### Query Latency
- **Indexed queries**: <50ms
- **Analytics endpoint**: <100ms
- **Scrape duration**: 2-3 seconds (full roster)

### Retry Strategy
- **Max retries**: 3 attempts
- **Backoff**: Exponential (1s → 2s → 4s)
- **Timeout**: 10 seconds per request

### Database Efficiency
- **Generated columns**: Computed at write time (zero query overhead)
- **Indexes**: 6 strategic indexes for common queries
- **Views**: Pre-aggregated season statistics

## 🚢 Deployment

### Production Checklist

1. ✅ Update `wrangler.toml` with your `account_id`
2. ✅ Run `./deploy.sh` for automated deployment
3. ✅ Verify database creation and schema
4. ✅ Test all API endpoints
5. ✅ Trigger initial data load: `POST /api/update`
6. ✅ Verify dashboard loads correctly
7. ✅ Set up monitoring (Cloudflare dashboard)

### Custom Domain (Optional)

Add to `wrangler.toml`:
```toml
[[routes]]
pattern = "baseball.yourdomain.com/*"
zone_name = "yourdomain.com"
```

## 🔍 Monitoring

### Worker Logs
```bash
npm run tail
# or
wrangler tail longhorns-baseball-tracker
```

### Metrics
- View in Cloudflare Dashboard → Workers & Pages → `longhorns-baseball-tracker`
- Metrics: Requests, Errors, CPU time, Database queries

## 🧪 Testing

### Local Development
```bash
npm run dev
# Worker runs at http://localhost:8787
```

### Test Endpoints
```bash
# Test update
curl -X POST http://localhost:8787/api/update

# Test stats query
curl http://localhost:8787/api/stats

# Test analytics
curl http://localhost:8787/api/analytics

# Test dashboard
open http://localhost:8787/
```

## 📝 Extending to Other Teams

This pipeline can be adapted for other college teams:

1. Update `TEXAS_TEAM_ID` in `scraper.js` (find team ID in ESPN URL)
2. Update `TEAM_NAME` and `TEAM_ID` in `wrangler.toml`
3. Customize dashboard colors in `dashboard.html`
4. Redeploy with `./deploy.sh`

**Example:** Mississippi State Bulldogs
- Team ID: `344`
- Colors: Maroon (#5D1725) and White

## 🤝 Integration with BSI-NextGen

This pipeline integrates with the main BSI-NextGen platform:

- **Shared patterns**: Same scraping approach as `packages/api/src/adapters/collegeBaseball.ts`
- **Data format**: Compatible with BSI shared types
- **Deployment**: Separate Cloudflare Workers deployment
- **Use case**: Demonstrates standalone team-specific analytics

## 📄 License

MIT License - Part of BSI-NextGen platform

## 🙏 Acknowledgments

- **ESPN Stats API** for college baseball data
- **Cloudflare Workers** for serverless infrastructure
- **D1 Database** for SQL storage at the edge
- **Texas Longhorns Baseball** for inspiration

---

**Built with real data. Zero placeholders. Production-ready.**

🤘 **Hook 'em Horns!** | Blaze Sports Intel © 2025
