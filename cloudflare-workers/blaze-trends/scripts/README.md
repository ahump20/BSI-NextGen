# Blaze Trends Utility Scripts

Collection of helpful scripts for managing and monitoring the Blaze Trends worker.

## Scripts Overview

### 1. setup-local.sh
**Purpose:** Initial setup for local development

**Usage:**
```bash
./scripts/setup-local.sh
```

**What it does:**
- ✓ Checks Node.js and wrangler installation
- ✓ Installs dependencies
- ✓ Verifies Cloudflare authentication
- ✓ Creates .dev.vars template
- ✓ Validates configuration files
- ✓ Provides setup instructions

**When to use:** First time setting up the project or after cloning

---

### 2. db-utils.sh
**Purpose:** Database management and queries

**Usage:**
```bash
./scripts/db-utils.sh [command] [options]
```

**Commands:**

| Command | Description | Example |
|---------|-------------|---------|
| `list` | List recent trends | `./scripts/db-utils.sh list` |
| `count` | Count trends by sport | `./scripts/db-utils.sh count` |
| `articles` | List recent articles | `./scripts/db-utils.sh articles` |
| `articles-sport` | Count articles by sport | `./scripts/db-utils.sh articles-sport` |
| `logs [N]` | Show N recent logs | `./scripts/db-utils.sh logs 50` |
| `errors` | Show recent errors | `./scripts/db-utils.sh errors` |
| `stats` | Database statistics | `./scripts/db-utils.sh stats` |
| `top [N]` | Top N trending stories | `./scripts/db-utils.sh top 20` |
| `search <term>` | Search trends | `./scripts/db-utils.sh search "college baseball"` |
| `clean [days]` | Clean old data | `./scripts/db-utils.sh clean 60` |
| `export [file]` | Export to JSON | `./scripts/db-utils.sh export trends.json` |
| `help` | Show help | `./scripts/db-utils.sh help` |

**Examples:**
```bash
# View recent trends
./scripts/db-utils.sh list

# Check database health
./scripts/db-utils.sh stats

# Find baseball trends
./scripts/db-utils.sh search "baseball"

# Export all trends
./scripts/db-utils.sh export my-trends.json

# Clean data older than 90 days
./scripts/db-utils.sh clean 90
```

---

### 3. monitor-health.sh
**Purpose:** Health monitoring and testing

**Usage:**
```bash
./scripts/monitor-health.sh [command] [options]
```

**Commands:**

| Command | Description | Example |
|---------|-------------|---------|
| `health` | Basic health check | `./scripts/monitor-health.sh health` |
| `test` | Test trends API | `./scripts/monitor-health.sh test` |
| `sport [name]` | Test sport filter | `./scripts/monitor-health.sh sport mlb` |
| `trigger` | Trigger monitoring | `./scripts/monitor-health.sh trigger` |
| `all` | Run all tests | `./scripts/monitor-health.sh all` |
| `watch [secs]` | Continuous monitoring | `./scripts/monitor-health.sh watch 30` |
| `help` | Show help | `./scripts/monitor-health.sh help` |

**Environment Variables:**
```bash
# Set worker URL (default: http://localhost:8787)
export BLAZE_TRENDS_WORKER_URL=https://blaze-trends.your.workers.dev
```

**Examples:**
```bash
# Quick health check (local)
./scripts/monitor-health.sh health

# Test production worker
BLAZE_TRENDS_WORKER_URL=https://blaze-trends.your.workers.dev ./scripts/monitor-health.sh all

# Continuous monitoring (refresh every 30 seconds)
./scripts/monitor-health.sh watch 30

# Test specific sport
./scripts/monitor-health.sh sport college_baseball

# Manually trigger a monitoring cycle
./scripts/monitor-health.sh trigger
```

---

### 4. dashboard-queries.sql
**Purpose:** Pre-built SQL queries for analysis

**Usage:**
```bash
# Run specific query
wrangler d1 execute blaze-trends-db --command="SELECT * FROM trends LIMIT 10"

# Run multiple queries from file
wrangler d1 execute blaze-trends-db --file=scripts/dashboard-queries.sql
```

**Query Categories:**

#### Overview Statistics
- Total counts (trends, articles, logs)

#### Trends Analysis
- Trends by sport (last 7 days)
- Top 10 trending stories
- Recent trends (last 24 hours)
- Trends with most sources
- Trends by team/player mentions

#### Articles Analysis
- Articles by sport
- Recent articles
- Top sources
- Articles by day
- Duplicate detection

#### Monitoring & Performance
- Event summary
- Recent events
- Error logs
- Success rate trends
- Performance metrics

#### Data Quality
- Trends without sources
- Trends without players/teams
- Unprocessed articles
- Old unprocessed data

#### Growth Metrics
- Daily trend creation
- Weekly article collection
- Sport coverage over time

#### Cleanup Candidates
- Old articles/trends/logs (>90 days)

---

## Quick Reference

### Daily Workflow

```bash
# 1. Start local development
pnpm trends:dev

# 2. Monitor health (in another terminal)
pnpm trends:health

# 3. Check database stats
pnpm trends:db stats

# 4. View logs
pnpm trends:tail
```

### Production Monitoring

```bash
# Set production URL
export BLAZE_TRENDS_WORKER_URL=https://blaze-trends.your.workers.dev

# Run health checks
./scripts/monitor-health.sh all

# Check for errors
./scripts/db-utils.sh errors

# View recent trends
./scripts/db-utils.sh list
```

### Weekly Maintenance

```bash
# Review error logs
./scripts/db-utils.sh errors

# Check data quality
wrangler d1 execute blaze-trends-db --file=scripts/dashboard-queries.sql

# Clean old data (>30 days)
./scripts/db-utils.sh clean 30
```

### Troubleshooting

```bash
# Worker not responding
./scripts/monitor-health.sh health

# Check recent errors
./scripts/db-utils.sh errors

# View detailed logs
pnpm trends:tail

# Check database connection
./scripts/db-utils.sh stats

# Test API endpoints
./scripts/monitor-health.sh all
```

---

## Root Package.json Scripts

From the project root, you can use these shortcuts:

```bash
pnpm trends:dev      # Start development server
pnpm trends:deploy   # Deploy to Cloudflare
pnpm trends:tail     # View real-time logs
pnpm trends:setup    # Run initial setup
pnpm trends:health   # Health check
pnpm trends:db       # Database utilities (shows help)
```

---

## Script Requirements

### Prerequisites
- **wrangler CLI** - `npm install -g wrangler`
- **jq** (optional) - For JSON parsing in health monitor
- **curl** - For API testing

### Permissions
All scripts need execute permissions:
```bash
chmod +x scripts/*.sh
```

### Authentication
Most scripts require Cloudflare authentication:
```bash
wrangler login
```

---

## Contributing

When adding new scripts:

1. **Follow naming convention:** `action-target.sh`
2. **Add help command:** `--help` or `help`
3. **Use colors:** GREEN, BLUE, YELLOW, RED, NC
4. **Include error handling:** `set -e`
5. **Document in this README**

Example template:
```bash
#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# ... script logic
```

---

## Troubleshooting Scripts

### "Command not found: wrangler"
```bash
npm install -g wrangler
```

### "Permission denied"
```bash
chmod +x scripts/*.sh
```

### "Database not found"
```bash
cd cloudflare-workers/blaze-trends
npm run db:create
npm run db:init
```

### "Worker not responding"
```bash
# Start development server
pnpm trends:dev

# Check health
pnpm trends:health
```

---

## Additional Resources

- **Main README:** `../README.md`
- **Deployment Guide:** `../DEPLOYMENT.md`
- **Worker Source:** `../src/index.ts`
- **Database Schema:** `../schema.sql`

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
