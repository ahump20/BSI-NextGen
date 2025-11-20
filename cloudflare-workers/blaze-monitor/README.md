# Blaze Monitor - Database Performance Monitoring

Cloudflare Worker for monitoring D1 database performance, tracking metrics, and generating alerts.

## Features

- **Database Metrics**: Track size, growth rate, and table counts
- **Performance Monitoring**: Query times, cache hit rates, error rates
- **Automated Alerts**: Threshold-based alerting for issues
- **Scheduled Monitoring**: Runs every 5 minutes via cron
- **Dashboard API**: REST API for metrics visualization

## Quick Start

### Prerequisites

- Node.js 18+
- Wrangler CLI
- Cloudflare account with Workers and D1 enabled

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run automated setup**:
   ```bash
   npm run setup
   ```

3. **Test locally**:
   ```bash
   npm run dev
   ```

4. **Trigger manual monitoring**:
   ```bash
   npm run monitor
   ```

## API Endpoints

### Health Check

```bash
GET /health
```

### Get Metrics

Get database metrics:

```bash
GET /metrics?database=<db-name>&limit=100
```

### Get Databases

List all monitored databases:

```bash
GET /databases
```

### Get Alerts

Get recent alerts:

```bash
GET /alerts?severity=<warning|critical>&limit=50
```

### Trigger Monitoring

Manually trigger monitoring:

```bash
POST /monitor
```

## Monitoring Schedule

The worker runs automatically every 5 minutes via cron trigger:

```toml
[triggers]
crons = ["*/5 * * * *"]
```

## Alert Thresholds

Configure thresholds in `src/index.ts`:

```typescript
const ALERT_CONFIG = {
  database_size_threshold_gb: 50,
  growth_rate_threshold_mb_per_day: 1000,
  error_rate_threshold: 0.05, // 5%
  query_time_threshold_ms: 500,
};
```

## Metrics Collected

### Database Metrics
- Total tables
- Total rows
- Database size (KB)
- Growth rate (MB/day)
- Average query time
- Error count

### Performance Metrics
- Cache hit rate
- Average query time
- Total queries
- Cache hits/misses
- Error rate

## Dashboard Integration

The monitoring worker provides a REST API for frontend dashboards.

See `/packages/web/app/monitor/page.tsx` for React dashboard implementation.

## Deployment

### Staging

```bash
npm run deploy
```

### Production

```bash
npm run deploy:production
```

## Monitoring Commands

```bash
# View real-time logs
npm run tail

# Get current metrics
npm run test:metrics

# Get database list
npm run test:databases

# Get alerts
npm run test:alerts

# Check health
npm run test:health
```

## Database Schema

The worker uses D1 database tables:

- `database_metrics`: Database statistics
- `performance_metrics`: Query performance data
- `alerts`: Generated alerts
- `error_logs`: Error tracking

Auto-cleanup: Data older than 30 days is automatically deleted.

## Integration Example

### Fetch Metrics from Next.js

```typescript
async function getMetrics() {
  const response = await fetch('https://monitor.blazesportsintel.com/metrics');
  const metrics = await response.json();
  return metrics;
}
```

### Dashboard Component

```typescript
import { useEffect, useState } from 'react';

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    fetch('/api/monitor/metrics')
      .then(res => res.json())
      .then(setMetrics);
  }, []);

  return (
    <div>
      {metrics.map(metric => (
        <div key={metric.id}>
          <h3>{metric.database_name}</h3>
          <p>Size: {(metric.database_size_kb / 1024).toFixed(2)} MB</p>
          <p>Growth: {metric.growth_rate_mb_per_day.toFixed(2)} MB/day</p>
          <p>Avg Query: {metric.avg_query_time_ms.toFixed(2)} ms</p>
        </div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### No metrics appearing

1. Check cron trigger is enabled
2. Manually trigger monitoring: `npm run monitor`
3. Check logs: `npm run tail`

### Alerts not triggering

1. Verify alert thresholds in `src/index.ts`
2. Check database has metrics
3. Review error logs: `npm run test:alerts`

## License

MIT

---

**Last Updated**: November 20, 2025
**Maintainer**: BlazeSportsIntel Team
