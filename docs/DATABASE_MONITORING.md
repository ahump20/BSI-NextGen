# Database Growth Monitoring Implementation

**Priority:** MEDIUM
**Status:** 🟡 TO BE IMPLEMENTED
**Impact:** Proactive monitoring and alerting for database health

## Overview

This guide implements comprehensive database monitoring for BlazeSportsIntel.com's 18 D1 databases to track growth, performance, and health metrics.

## Current Database Inventory

| Database | Current Size | Growth Rate | Priority |
|----------|-------------|-------------|----------|
| **blaze-db** | **81.5MB** | High | Critical |
| blazesports-db | 1.15MB | Medium | High |
| blazesports-historical | 1.02MB | High | High |
| blaze-intelligence-db | 540KB | Medium | Medium |
| blazesports-models | 290KB | Low | Medium |
| blaze-analytics | 122KB | Medium | High |
| blaze-vision-analytics | 81KB | Low | Low |
| college-sports-data | 69KB | Low | Low |

## Monitoring Strategy

### 1. Database Size Monitoring Worker

Create `src/workers/db-monitor.ts`:

```typescript
interface Env {
  DB: D1Database;
  BLAZE_KV: KVNamespace;
  MONITORING_DB: D1Database;
}

interface DatabaseMetrics {
  databaseName: string;
  sizeBytes: number;
  sizeMB: number;
  tableCount: number;
  rowCount: number;
  lastChecked: string;
  growthRate?: number; // MB per day
}

export default {
  // Run every 6 hours
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log('Starting database monitoring...');

    const databases = [
      { name: 'blaze-db', binding: env.DB },
      { name: 'blazesports-db', binding: env.DB },
      { name: 'blazesports-historical', binding: env.DB },
      { name: 'blaze-intelligence-db', binding: env.DB },
      { name: 'blazesports-models', binding: env.DB },
      { name: 'blaze-analytics', binding: env.DB },
      { name: 'blaze-vision-analytics', binding: env.DB },
      { name: 'college-sports-data', binding: env.DB },
    ];

    for (const db of databases) {
      try {
        const metrics = await collectDatabaseMetrics(db.name, db.binding, env);
        await storeMetrics(metrics, env);
        await checkThresholds(metrics, env);
      } catch (error) {
        console.error(`Error monitoring ${db.name}:`, error);
      }
    }

    // Generate daily report
    if (shouldGenerateReport(event)) {
      await generateDailyReport(env);
    }
  },

  // API endpoint for manual checks
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/metrics') {
      return handleMetricsRequest(request, env);
    }

    if (url.pathname === '/report') {
      return handleReportRequest(request, env);
    }

    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function collectDatabaseMetrics(
  dbName: string,
  db: D1Database,
  env: Env
): Promise<DatabaseMetrics> {
  // Get table count
  const tables = await db
    .prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'`)
    .first<{ count: number }>();

  // Get total row count across all tables
  const tableList = await db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`)
    .all<{ name: string }>();

  let totalRows = 0;
  for (const table of tableList.results) {
    const rowCount = await db
      .prepare(`SELECT COUNT(*) as count FROM ${table.name}`)
      .first<{ count: number }>();
    totalRows += rowCount?.count || 0;
  }

  // Get database size
  const sizeResult = await db
    .prepare(`SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`)
    .first<{ size: number }>();

  const sizeBytes = sizeResult?.size || 0;
  const sizeMB = sizeBytes / (1024 * 1024);

  // Calculate growth rate
  const previousMetric = await getPreviousMetric(dbName, env);
  const growthRate = calculateGrowthRate(sizeMB, previousMetric);

  return {
    databaseName: dbName,
    sizeBytes,
    sizeMB: parseFloat(sizeMB.toFixed(2)),
    tableCount: tables?.count || 0,
    rowCount: totalRows,
    lastChecked: new Date().toISOString(),
    growthRate,
  };
}

async function storeMetrics(metrics: DatabaseMetrics, env: Env): Promise<void> {
  // Store in monitoring database
  await env.MONITORING_DB.prepare(
    `INSERT INTO database_metrics
     (database_name, size_bytes, size_mb, table_count, row_count, growth_rate_mb_per_day, checked_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      metrics.databaseName,
      metrics.sizeBytes,
      metrics.sizeMB,
      metrics.tableCount,
      metrics.rowCount,
      metrics.growthRate || 0,
      metrics.lastChecked
    )
    .run();

  // Cache current metrics in KV
  await env.BLAZE_KV.put(
    `db:metrics:${metrics.databaseName}`,
    JSON.stringify(metrics),
    { expirationTtl: 21600 } // 6 hours
  );

  console.log(`Stored metrics for ${metrics.databaseName}:`, metrics);
}

async function checkThresholds(metrics: DatabaseMetrics, env: Env): Promise<void> {
  const thresholds = {
    'blaze-db': { size: 100, growthRate: 5 }, // 100MB size, 5MB/day growth
    'blazesports-db': { size: 10, growthRate: 1 },
    'blazesports-historical': { size: 50, growthRate: 2 },
    default: { size: 5, growthRate: 0.5 },
  };

  const threshold = thresholds[metrics.databaseName] || thresholds.default;

  // Check size threshold
  if (metrics.sizeMB > threshold.size) {
    await sendAlert(env, {
      severity: 'warning',
      database: metrics.databaseName,
      metric: 'size',
      value: metrics.sizeMB,
      threshold: threshold.size,
      message: `Database ${metrics.databaseName} size (${metrics.sizeMB}MB) exceeds threshold (${threshold.size}MB)`,
    });
  }

  // Check growth rate threshold
  if (metrics.growthRate && metrics.growthRate > threshold.growthRate) {
    await sendAlert(env, {
      severity: 'warning',
      database: metrics.databaseName,
      metric: 'growthRate',
      value: metrics.growthRate,
      threshold: threshold.growthRate,
      message: `Database ${metrics.databaseName} growth rate (${metrics.growthRate}MB/day) exceeds threshold (${threshold.growthRate}MB/day)`,
    });
  }

  // Check row count (optional)
  if (metrics.rowCount > 1000000) {
    await sendAlert(env, {
      severity: 'info',
      database: metrics.databaseName,
      metric: 'rowCount',
      value: metrics.rowCount,
      threshold: 1000000,
      message: `Database ${metrics.databaseName} has ${metrics.rowCount.toLocaleString()} rows`,
    });
  }
}

async function getPreviousMetric(
  dbName: string,
  env: Env
): Promise<DatabaseMetrics | null> {
  const cached = await env.BLAZE_KV.get(`db:metrics:${dbName}`, 'json');
  return cached as DatabaseMetrics | null;
}

function calculateGrowthRate(
  currentSize: number,
  previousMetric: DatabaseMetrics | null
): number | undefined {
  if (!previousMetric) return undefined;

  const previous = previousMetric.sizeMB;
  const timeDiff =
    (new Date().getTime() - new Date(previousMetric.lastChecked).getTime()) /
    (1000 * 60 * 60 * 24); // days

  if (timeDiff === 0) return 0;

  const growthRate = (currentSize - previous) / timeDiff;
  return parseFloat(growthRate.toFixed(4));
}

async function sendAlert(env: Env, alert: any): Promise<void> {
  // Store alert in database
  await env.MONITORING_DB.prepare(
    `INSERT INTO database_alerts
     (severity, database_name, metric, value, threshold, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      alert.severity,
      alert.database,
      alert.metric,
      alert.value,
      alert.threshold,
      alert.message,
      new Date().toISOString()
    )
    .run();

  // Send notification via notifications worker
  await fetch('https://blaze-notifications-production.blazesportsintel.workers.dev/alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });

  console.log('Alert sent:', alert);
}

async function generateDailyReport(env: Env): Promise<void> {
  const report = await env.MONITORING_DB.prepare(
    `SELECT
       database_name,
       AVG(size_mb) as avg_size,
       MAX(size_mb) as max_size,
       AVG(growth_rate_mb_per_day) as avg_growth,
       COUNT(*) as check_count
     FROM database_metrics
     WHERE checked_at >= datetime('now', '-1 day')
     GROUP BY database_name
     ORDER BY max_size DESC`
  ).all();

  // Store report in KV
  await env.BLAZE_KV.put(
    'db:daily-report',
    JSON.stringify({
      generated: new Date().toISOString(),
      databases: report.results,
    }),
    { expirationTtl: 86400 } // 24 hours
  );

  console.log('Daily report generated:', report.results);
}

function shouldGenerateReport(event: ScheduledEvent): boolean {
  const hour = new Date().getUTCHours();
  return hour === 0; // Generate at midnight UTC
}

async function handleMetricsRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const dbName = url.searchParams.get('database');

  if (dbName) {
    // Get specific database metrics
    const metrics = await env.BLAZE_KV.get(`db:metrics:${dbName}`, 'json');
    return new Response(JSON.stringify(metrics), {
      headers: { 'Content-Type': 'application/json' },
    });
  } else {
    // Get all database metrics
    const allMetrics = await env.MONITORING_DB.prepare(
      `SELECT * FROM database_metrics
       WHERE checked_at >= datetime('now', '-1 day')
       ORDER BY checked_at DESC`
    ).all();

    return new Response(JSON.stringify(allMetrics.results), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleReportRequest(request: Request, env: Env): Promise<Response> {
  const report = await env.BLAZE_KV.get('db:daily-report', 'json');

  if (!report) {
    return new Response('No report available', { status: 404 });
  }

  return new Response(JSON.stringify(report), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 2. Worker Configuration

Create `wrangler.toml` for monitoring worker:

```toml
name = "blaze-db-monitor-production"
main = "src/workers/db-monitor.ts"
compatibility_date = "2024-01-01"

# Scheduled monitoring - every 6 hours
[triggers]
crons = ["0 */6 * * *"]

# D1 Database bindings
[[d1_databases]]
binding = "DB"
database_name = "blaze-db"
database_id = "<blaze-db-id>"

[[d1_databases]]
binding = "MONITORING_DB"
database_name = "blaze-monitoring"
database_id = "<monitoring-db-id>"

# KV for caching
[[kv_namespaces]]
binding = "BLAZE_KV"
id = "<kv-namespace-id>"

# Environment variables
[vars]
ALERT_WEBHOOK_URL = "https://blaze-notifications-production.workers.dev/webhook"
```

### 3. Monitoring Database Schema

Create `schema/monitoring.sql`:

```sql
-- Database metrics tracking
CREATE TABLE IF NOT EXISTS database_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  size_mb REAL NOT NULL,
  table_count INTEGER NOT NULL,
  row_count INTEGER NOT NULL,
  growth_rate_mb_per_day REAL DEFAULT 0,
  checked_at TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metrics_database ON database_metrics(database_name);
CREATE INDEX idx_metrics_checked_at ON database_metrics(checked_at);
CREATE INDEX idx_metrics_size ON database_metrics(size_mb DESC);

-- Alert tracking
CREATE TABLE IF NOT EXISTS database_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  severity TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  database_name TEXT NOT NULL,
  metric TEXT NOT NULL, -- 'size', 'growthRate', 'rowCount'
  value REAL NOT NULL,
  threshold REAL NOT NULL,
  message TEXT NOT NULL,
  resolved BOOLEAN DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_at TEXT,
  acknowledged_by TEXT
);

CREATE INDEX idx_alerts_database ON database_alerts(database_name);
CREATE INDEX idx_alerts_severity ON database_alerts(severity);
CREATE INDEX idx_alerts_resolved ON database_alerts(resolved);
CREATE INDEX idx_alerts_created ON database_alerts(created_at DESC);

-- Query performance tracking
CREATE TABLE IF NOT EXISTS query_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_name TEXT NOT NULL,
  query_hash TEXT NOT NULL, -- Hash of normalized query
  query_sample TEXT, -- Sample query for reference
  execution_time_ms REAL NOT NULL,
  rows_returned INTEGER,
  executed_at TEXT NOT NULL,
  worker_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_query_database ON query_performance(database_name);
CREATE INDEX idx_query_hash ON query_performance(query_hash);
CREATE INDEX idx_query_time ON query_performance(execution_time_ms DESC);
CREATE INDEX idx_query_executed ON query_performance(executed_at DESC);

-- Database health snapshots
CREATE TABLE IF NOT EXISTS database_health (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_name TEXT NOT NULL,
  status TEXT NOT NULL, -- 'healthy', 'warning', 'critical'
  health_score INTEGER NOT NULL, -- 0-100
  issues TEXT, -- JSON array of issues
  recommendations TEXT, -- JSON array of recommendations
  checked_at TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_database ON database_health(database_name);
CREATE INDEX idx_health_status ON database_health(status);
CREATE INDEX idx_health_checked ON database_health(checked_at DESC);
```

Deploy schema:

```bash
wrangler d1 execute blaze-monitoring --file=schema/monitoring.sql
```

### 4. Dashboard Component

Create React dashboard component:

```typescript
// components/DatabaseMonitor.tsx
import { useEffect, useState } from 'react';

interface DatabaseMetric {
  databaseName: string;
  sizeMB: number;
  tableCount: number;
  rowCount: number;
  growthRate?: number;
  lastChecked: string;
}

export function DatabaseMonitor() {
  const [metrics, setMetrics] = useState<DatabaseMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/db-monitor/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading metrics...</div>;

  return (
    <div className="database-monitor">
      <h2>Database Monitoring</h2>

      <div className="metrics-grid">
        {metrics.map(metric => (
          <div key={metric.databaseName} className="metric-card">
            <h3>{metric.databaseName}</h3>
            <div className="metric-stat">
              <span className="label">Size:</span>
              <span className="value">{metric.sizeMB.toFixed(2)} MB</span>
            </div>
            <div className="metric-stat">
              <span className="label">Tables:</span>
              <span className="value">{metric.tableCount}</span>
            </div>
            <div className="metric-stat">
              <span className="label">Rows:</span>
              <span className="value">{metric.rowCount.toLocaleString()}</span>
            </div>
            {metric.growthRate !== undefined && (
              <div className="metric-stat">
                <span className="label">Growth:</span>
                <span className={`value ${metric.growthRate > 1 ? 'warning' : ''}`}>
                  {metric.growthRate > 0 ? '+' : ''}
                  {metric.growthRate.toFixed(2)} MB/day
                </span>
              </div>
            )}
            <div className="metric-timestamp">
              Last checked: {new Date(metric.lastChecked).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5. Alerting Configuration

Create alert rules:

```typescript
// Alert severity levels and thresholds
const ALERT_RULES = {
  size: {
    warning: { 'blaze-db': 100, default: 10 }, // MB
    critical: { 'blaze-db': 200, default: 50 },
  },
  growthRate: {
    warning: { 'blaze-db': 5, default: 1 }, // MB/day
    critical: { 'blaze-db': 10, default: 5 },
  },
  queryTime: {
    warning: 1000, // ms
    critical: 5000,
  },
};

// Alert channels
const ALERT_CHANNELS = {
  email: process.env.ALERT_EMAIL || 'alerts@blazesportsintel.com',
  slack: process.env.SLACK_WEBHOOK_URL,
  pagerduty: process.env.PAGERDUTY_API_KEY,
};
```

## Deployment Steps

### 1. Create Monitoring Database

```bash
wrangler d1 create blaze-monitoring
wrangler d1 execute blaze-monitoring --file=schema/monitoring.sql
```

### 2. Deploy Monitoring Worker

```bash
cd src/workers/db-monitor
wrangler deploy
```

### 3. Verify Deployment

```bash
# Check worker is running
wrangler tail blaze-db-monitor-production

# Manually trigger monitoring
curl https://blaze-db-monitor-production.workers.dev/metrics

# Check daily report
curl https://blaze-db-monitor-production.workers.dev/report
```

### 4. Set Up Alerts

Configure notification channels in `blaze-notifications-production` worker.

## Monitoring Checklist

- [ ] Create `blaze-monitoring` D1 database
- [ ] Deploy monitoring schema
- [ ] Deploy `blaze-db-monitor-production` worker
- [ ] Configure cron schedule (every 6 hours)
- [ ] Set up alert thresholds
- [ ] Configure notification channels (email, Slack)
- [ ] Test manual metrics endpoint
- [ ] Test alert triggering
- [ ] Add dashboard component to frontend
- [ ] Document alert response procedures
- [ ] Train team on monitoring dashboard

## Maintenance Tasks

### Weekly Review

```sql
-- Check database growth trends
SELECT
  database_name,
  DATE(checked_at) as date,
  AVG(size_mb) as avg_size,
  MAX(size_mb) as max_size
FROM database_metrics
WHERE checked_at >= datetime('now', '-7 days')
GROUP BY database_name, DATE(checked_at)
ORDER BY database_name, date;
```

### Monthly Cleanup

```sql
-- Archive old metrics (keep 30 days)
DELETE FROM database_metrics
WHERE checked_at < datetime('now', '-30 days');

-- Archive resolved alerts (keep 90 days)
DELETE FROM database_alerts
WHERE resolved = 1 AND resolved_at < datetime('now', '-90 days');
```

## Additional Resources

- [D1 Limits Documentation](https://developers.cloudflare.com/d1/platform/limits/)
- [Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Monitoring Best Practices](https://developers.cloudflare.com/workers/observability/)

---

**Last Updated:** November 8, 2025
**Status:** Implementation Guide
**Owner:** Infrastructure Team
