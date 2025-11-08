# Hyperdrive Configuration Guide

**Priority:** MEDIUM
**Status:** 🟡 NOT CONFIGURED
**Impact:** Improved database performance via connection pooling

## Overview

This guide covers implementing Cloudflare Hyperdrive for BlazeSportsIntel.com to enable database connection pooling, reduce latency, and improve query performance for D1 databases.

## Current State

- **No Hyperdrive configuration** detected
- Workers connect directly to D1 databases
- No connection pooling or caching
- Higher latency for frequent queries
- Potential connection limits under load

## What is Hyperdrive?

Hyperdrive is Cloudflare's database connection pooler and query accelerator that:
- Maintains persistent connections to databases
- Caches frequently accessed queries
- Reduces connection overhead
- Improves Time to First Byte (TTFB)
- Supports connection pooling across worker instances

**Benefits:**
- 🚀 Up to 80% reduction in query latency
- 📊 Automatic query result caching
- 🔄 Connection reuse across requests
- 📈 Better scalability under load

## Implementation Steps

### 1. Create Hyperdrive Configuration

```bash
# Create Hyperdrive config for primary database
wrangler hyperdrive create blaze-db-hyperdrive \
  --connection-string="d1://blaze-db" \
  --caching-disabled=false \
  --max-age=60

# Create for other critical databases
wrangler hyperdrive create blazesports-db-hyperdrive \
  --connection-string="d1://blazesports-db" \
  --caching-disabled=false \
  --max-age=60

wrangler hyperdrive create blazesports-historical-hyperdrive \
  --connection-string="d1://blazesports-historical" \
  --caching-disabled=false \
  --max-age=300

# List all Hyperdrive configs
wrangler hyperdrive list
```

### 2. Update Worker Configuration

Update `wrangler.toml` for workers using databases:

**Before (Direct D1):**
```toml
name = "blaze-storage"
main = "src/index.ts"

[[d1_databases]]
binding = "DB"
database_name = "blaze-db"
database_id = "<database-id>"
```

**After (with Hyperdrive):**
```toml
name = "blaze-storage"
main = "src/index.ts"

# Keep D1 binding for writes
[[d1_databases]]
binding = "DB"
database_name = "blaze-db"
database_id = "<database-id>"

# Add Hyperdrive for reads
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<hyperdrive-id>"
```

### 3. Update Worker Code

#### Pattern 1: Read/Write Separation

```typescript
interface Env {
  DB: D1Database;           // Direct D1 for writes
  HYPERDRIVE: Hyperdrive;   // Hyperdrive for reads
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Use HYPERDRIVE for read operations
    if (request.method === 'GET') {
      return handleRead(request, env);
    }

    // Use direct D1 for write operations
    if (request.method === 'POST' || request.method === 'PUT') {
      return handleWrite(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleRead(request: Request, env: Env): Promise<Response> {
  // Use Hyperdrive for cached reads
  const stmt = env.HYPERDRIVE.prepare(
    'SELECT * FROM games WHERE date = ? ORDER BY start_time'
  );
  const result = await stmt.bind('2025-11-08').all();

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
    },
  });
}

async function handleWrite(request: Request, env: Env): Promise<Response> {
  const data = await request.json();

  // Use direct D1 for writes (always fresh)
  const stmt = env.DB.prepare(
    'INSERT INTO games (id, date, start_time, home_team, away_team) VALUES (?, ?, ?, ?, ?)'
  );
  const result = await stmt
    .bind(data.id, data.date, data.startTime, data.homeTeam, data.awayTeam)
    .run();

  return new Response(JSON.stringify({ success: true, meta: result.meta }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

#### Pattern 2: Automatic Connection Routing

```typescript
class DatabaseManager {
  private db: D1Database;
  private hyperdrive: Hyperdrive;

  constructor(env: Env) {
    this.db = env.DB;
    this.hyperdrive = env.HYPERDRIVE;
  }

  // Smart query routing
  async query(
    sql: string,
    params: any[] = [],
    options: { write?: boolean; cacheTtl?: number } = {}
  ) {
    const isWrite = options.write || this.isWriteQuery(sql);

    if (isWrite) {
      // Use direct D1 for writes
      return this.db.prepare(sql).bind(...params).all();
    } else {
      // Use Hyperdrive for reads
      return this.hyperdrive.prepare(sql).bind(...params).all();
    }
  }

  private isWriteQuery(sql: string): boolean {
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'];
    const upperSql = sql.trim().toUpperCase();
    return writeKeywords.some(keyword => upperSql.startsWith(keyword));
  }

  // Batch operations
  async batch(statements: D1PreparedStatement[], write = false) {
    if (write) {
      return this.db.batch(statements);
    } else {
      return this.hyperdrive.batch(statements);
    }
  }
}

// Usage in worker
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const dbManager = new DatabaseManager(env);

    // Automatic routing - read uses Hyperdrive
    const games = await dbManager.query(
      'SELECT * FROM games WHERE status = ?',
      ['live']
    );

    // Automatic routing - write uses direct D1
    await dbManager.query(
      'UPDATE games SET score = ? WHERE id = ?',
      ['3-2', 'game-123'],
      { write: true }
    );

    return new Response(JSON.stringify(games), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

### 4. Configure Cache Settings

Different cache TTLs for different data types:

```typescript
interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: number;
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Static reference data - cache longer
  teams: { ttl: 3600, staleWhileRevalidate: 7200 },
  leagues: { ttl: 3600 },
  seasons: { ttl: 1800 },

  // Live data - cache shorter
  games: { ttl: 60, staleWhileRevalidate: 120 },
  scores: { ttl: 30 },
  liveStats: { ttl: 15 },

  // Historical data - cache longest
  historical: { ttl: 86400, staleWhileRevalidate: 172800 },
  archives: { ttl: 604800 }, // 1 week
};

async function queryWithCache(
  env: Env,
  table: string,
  sql: string,
  params: any[]
): Promise<any> {
  const config = CACHE_CONFIGS[table] || { ttl: 60 };

  // Configure Hyperdrive cache
  const result = await env.HYPERDRIVE.prepare(sql)
    .bind(...params)
    .all({
      cacheTtl: config.ttl,
      cacheEverything: true,
    });

  return result;
}
```

### 5. Monitoring Hyperdrive Performance

Create monitoring worker to track Hyperdrive metrics:

```typescript
interface HyperdriveMetrics {
  timestamp: string;
  cacheHitRate: number;
  avgQueryTime: number;
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const metrics = await collectHyperdriveMetrics(env);

    // Store in analytics database
    await env.DB.prepare(
      `INSERT INTO hyperdrive_metrics
       (timestamp, cache_hit_rate, avg_query_time, total_queries, cache_hits, cache_misses)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        metrics.timestamp,
        metrics.cacheHitRate,
        metrics.avgQueryTime,
        metrics.totalQueries,
        metrics.cacheHits,
        metrics.cacheMisses
      )
      .run();

    // Alert if cache hit rate drops below threshold
    if (metrics.cacheHitRate < 0.7) {
      await sendAlert(env, {
        severity: 'warning',
        message: `Hyperdrive cache hit rate low: ${(metrics.cacheHitRate * 100).toFixed(2)}%`,
        details: metrics,
      });
    }

    console.log('Hyperdrive metrics:', metrics);
  },
};

async function collectHyperdriveMetrics(env: Env): Promise<HyperdriveMetrics> {
  // Query performance data from KV or analytics
  const data = await env.BLAZE_KV.get('hyperdrive:metrics:current', 'json');

  return {
    timestamp: new Date().toISOString(),
    cacheHitRate: data?.cacheHitRate || 0,
    avgQueryTime: data?.avgQueryTime || 0,
    totalQueries: data?.totalQueries || 0,
    cacheHits: data?.cacheHits || 0,
    cacheMisses: data?.cacheMisses || 0,
  };
}
```

### 6. Database Schema for Metrics

```sql
-- Hyperdrive performance metrics
CREATE TABLE IF NOT EXISTS hyperdrive_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  cache_hit_rate REAL NOT NULL,
  avg_query_time REAL NOT NULL,
  total_queries INTEGER NOT NULL,
  cache_hits INTEGER NOT NULL,
  cache_misses INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hyperdrive_timestamp ON hyperdrive_metrics(timestamp);
```

## Migration Strategy

### Phase 1: Testing (Week 1)

1. **Create Hyperdrive configs** for non-critical workers
2. **Deploy to staging** environment
3. **Run load tests** comparing direct D1 vs Hyperdrive
4. **Monitor performance** metrics

### Phase 2: Gradual Rollout (Week 2-3)

**Priority Order:**
1. ✅ Analytics workers (read-heavy)
2. ✅ Search worker (read-heavy)
3. ✅ Real-time data workers
4. ⚠️ Data ingestion (mixed read/write)
5. ⚠️ Authentication (mostly writes)

### Phase 3: Full Production (Week 4)

1. **Deploy to all workers**
2. **Monitor cache hit rates**
3. **Optimize cache TTLs**
4. **Document performance improvements**

## Worker-Specific Configurations

### Analytics Workers

**Best Practice:** Long cache TTLs, read-heavy

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<hyperdrive-id>"
# Default cache: 5 minutes
```

```typescript
// Analytics queries benefit most from caching
const dailyStats = await env.HYPERDRIVE.prepare(
  'SELECT date, SUM(views) as total_views FROM analytics WHERE date >= ? GROUP BY date'
)
  .bind(thirtyDaysAgo)
  .all({ cacheTtl: 300 }); // 5 min cache
```

### Real-time Workers

**Best Practice:** Short cache TTLs, frequently updated

```typescript
// Live game data - short cache
const liveGames = await env.HYPERDRIVE.prepare(
  'SELECT * FROM games WHERE status = ? AND date = ?'
)
  .bind('live', today)
  .all({ cacheTtl: 15 }); // 15 second cache
```

### Historical Data Workers

**Best Practice:** Very long cache TTLs, rarely changes

```typescript
// Historical data - long cache
const seasonStats = await env.HYPERDRIVE.prepare(
  'SELECT * FROM season_stats WHERE season = ? AND team_id = ?'
)
  .bind('2024', teamId)
  .all({ cacheTtl: 86400 }); // 24 hour cache
```

## Performance Benchmarks

### Expected Improvements

| Worker Type | Before (Direct D1) | After (Hyperdrive) | Improvement |
|-------------|-------------------|-------------------|-------------|
| Analytics (read-heavy) | ~150ms | ~30ms | 80% faster |
| Real-time (mixed) | ~100ms | ~50ms | 50% faster |
| Historical (cached) | ~120ms | ~15ms | 87% faster |
| Search queries | ~200ms | ~40ms | 80% faster |

### Measurement

```typescript
async function benchmarkQuery(env: Env, sql: string, params: any[]) {
  // Test direct D1
  const d1Start = Date.now();
  await env.DB.prepare(sql).bind(...params).all();
  const d1Time = Date.now() - d1Start;

  // Test Hyperdrive
  const hdStart = Date.now();
  await env.HYPERDRIVE.prepare(sql).bind(...params).all();
  const hdTime = Date.now() - hdStart;

  console.log({
    sql: sql.substring(0, 50),
    d1Time,
    hdTime,
    improvement: `${(((d1Time - hdTime) / d1Time) * 100).toFixed(2)}%`,
  });
}
```

## Troubleshooting

### Issue: Cache Staleness

**Problem:** Data appears outdated

**Solution:**
```typescript
// Force cache invalidation on write
async function invalidateCache(env: Env, table: string) {
  // Clear Hyperdrive cache for specific table
  await env.BLAZE_KV.put(`cache:invalidate:${table}`, Date.now().toString());

  // Optionally: reduce cache TTL temporarily
  await env.HYPERDRIVE.prepare('SELECT 1').all({ cacheTtl: 0 });
}
```

### Issue: Low Cache Hit Rate

**Problem:** Cache hit rate below 50%

**Solutions:**
1. Increase cache TTLs for stable data
2. Analyze query patterns for optimization
3. Implement query result normalization
4. Add KV caching layer for hot data

### Issue: Connection Pool Exhaustion

**Problem:** Too many concurrent connections

**Solution:**
```typescript
// Implement connection queueing
const MAX_CONCURRENT = 10;
const queue: Promise<any>[] = [];

async function queryWithLimit(env: Env, sql: string, params: any[]) {
  while (queue.length >= MAX_CONCURRENT) {
    await Promise.race(queue);
  }

  const promise = env.HYPERDRIVE.prepare(sql).bind(...params).all();
  queue.push(promise);

  promise.finally(() => {
    queue.splice(queue.indexOf(promise), 1);
  });

  return promise;
}
```

## Cost Analysis

**Hyperdrive Pricing:**
- **FREE** for D1 connections
- Included in Workers Paid plan ($5/month)
- No additional charges for query caching
- Connection pooling included

**Cost Savings:**
- Reduced D1 query costs (fewer billable operations)
- Lower worker CPU time (faster queries)
- Better resource utilization

## Deployment Checklist

- [ ] Create Hyperdrive configurations for all databases
  - [ ] `blaze-db` (primary)
  - [ ] `blazesports-db`
  - [ ] `blazesports-historical`
  - [ ] `blaze-intelligence-db`
  - [ ] `blaze-analytics`
- [ ] Update worker `wrangler.toml` files with Hyperdrive bindings
- [ ] Implement read/write separation in worker code
- [ ] Deploy to staging environment
- [ ] Run performance benchmarks
- [ ] Test cache invalidation
- [ ] Monitor cache hit rates
- [ ] Gradually roll out to production workers
- [ ] Update documentation with performance metrics
- [ ] Set up monitoring and alerting
- [ ] Train team on Hyperdrive patterns

## Best Practices

### 1. Cache Invalidation Strategy

```typescript
// Pattern: Write-through cache
async function updateGame(env: Env, gameId: string, data: any) {
  // 1. Write to database
  await env.DB.prepare('UPDATE games SET score = ? WHERE id = ?')
    .bind(data.score, gameId)
    .run();

  // 2. Invalidate Hyperdrive cache
  await env.BLAZE_KV.delete(`cache:game:${gameId}`);

  // 3. Optionally pre-warm cache
  await env.HYPERDRIVE.prepare('SELECT * FROM games WHERE id = ?')
    .bind(gameId)
    .all({ cacheTtl: 60 });
}
```

### 2. Query Optimization

```typescript
// Bad: Multiple queries
const team = await env.HYPERDRIVE.prepare('SELECT * FROM teams WHERE id = ?').bind(teamId).first();
const stats = await env.HYPERDRIVE.prepare('SELECT * FROM stats WHERE team_id = ?').bind(teamId).all();

// Good: Single join query
const result = await env.HYPERDRIVE.prepare(`
  SELECT t.*, s.*
  FROM teams t
  LEFT JOIN stats s ON s.team_id = t.id
  WHERE t.id = ?
`).bind(teamId).all({ cacheTtl: 300 });
```

### 3. Batch Operations

```typescript
// Efficient batch reads with Hyperdrive
async function getMultipleGames(env: Env, gameIds: string[]) {
  const statements = gameIds.map(id =>
    env.HYPERDRIVE.prepare('SELECT * FROM games WHERE id = ?').bind(id)
  );

  const results = await env.HYPERDRIVE.batch(statements);
  return results.map(r => r.results[0]);
}
```

## Additional Resources

- [Cloudflare Hyperdrive Documentation](https://developers.cloudflare.com/hyperdrive/)
- [D1 Best Practices](https://developers.cloudflare.com/d1/platform/limits/)
- [Connection Pooling Patterns](https://developers.cloudflare.com/hyperdrive/configuration/)

---

**Last Updated:** November 8, 2025
**Status:** Implementation Guide
**Owner:** Infrastructure Team
