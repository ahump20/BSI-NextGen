# Phase 2: Database Performance Optimization

**Revised Strategy**: Enhanced D1 + KV Pattern (Instead of Hyperdrive)

## Overview

After analysis, we've determined that Hyperdrive (designed for external PostgreSQL/MySQL databases) is not optimal for BSI-NextGen's D1 architecture. Instead, we'll implement enhanced caching and query optimization strategies.

## Implementation Plan

### 1. Enhanced KV Caching (Week 1)

#### Smart Cache Manager

Create `/cloudflare-workers/shared/cache-manager.ts`:

```typescript
interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: number;
  tags?: string[];
}

export class CacheManager {
  private kv: KVNamespace;
  private db: D1Database;

  constructor(kv: KVNamespace, db: D1Database) {
    this.kv = kv;
    this.db = db;
  }

  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    // Try cache first
    const cached = await this.kv.get(key, 'json');
    if (cached) {
      return cached as T;
    }

    // Fetch fresh data
    const data = await fetchFn();

    // Store in cache
    await this.kv.put(key, JSON.stringify(data), {
      expirationTtl: config.ttl,
      metadata: { tags: config.tags }
    });

    return data;
  }

  async invalidate(pattern: string): Promise<void> {
    // Invalidate all keys matching pattern
    const list = await this.kv.list({ prefix: pattern });
    const deletions = list.keys.map(key => this.kv.delete(key.name));
    await Promise.all(deletions);
  }

  async invalidateByTag(tag: string): Promise<void> {
    // Invalidate all keys with specific tag
    const list = await this.kv.list();
    for (const key of list.keys) {
      const metadata = key.metadata as { tags?: string[] };
      if (metadata?.tags?.includes(tag)) {
        await this.kv.delete(key.name);
      }
    }
  }
}
```

#### Cache Configuration

```typescript
export const CACHE_CONFIGS = {
  // Live data - short TTL
  liveGames: { ttl: 30, tags: ['games', 'live'] },
  liveScores: { ttl: 15, tags: ['scores', 'live'] },

  // Static data - long TTL
  teams: { ttl: 3600, tags: ['teams', 'static'] },
  leagues: { ttl: 3600, tags: ['leagues', 'static'] },
  players: { ttl: 1800, tags: ['players', 'static'] },

  // Historical data - very long TTL
  historical: { ttl: 86400, tags: ['historical'] },
  archives: { ttl: 604800, tags: ['archives'] },

  // Trends - medium TTL
  trends: { ttl: 900, tags: ['trends'] }, // 15 minutes
};
```

### 2. Database Query Optimization (Week 2)

#### Query Builder with Batching

Create `/cloudflare-workers/shared/query-builder.ts`:

```typescript
export class QueryBuilder {
  private db: D1Database;
  private batchQueue: D1PreparedStatement[] = [];
  private batchSize = 25;

  constructor(db: D1Database) {
    this.db = db;
  }

  prepare(sql: string, params: any[] = []): D1PreparedStatement {
    return this.db.prepare(sql).bind(...params);
  }

  addToBatch(stmt: D1PreparedStatement): void {
    this.batchQueue.push(stmt);
  }

  async executeBatch(): Promise<D1Result[]> {
    if (this.batchQueue.length === 0) {
      return [];
    }

    // Execute in chunks
    const chunks: D1PreparedStatement[][] = [];
    for (let i = 0; i < this.batchQueue.length; i += this.batchSize) {
      chunks.push(this.batchQueue.slice(i, i + this.batchSize));
    }

    const results: D1Result[] = [];
    for (const chunk of chunks) {
      const chunkResults = await this.db.batch(chunk);
      results.push(...chunkResults);
    }

    this.batchQueue = [];
    return results;
  }

  async transaction<T>(
    callback: (tx: QueryBuilder) => Promise<T>
  ): Promise<T> {
    // Simulate transaction with batch
    const result = await callback(this);
    await this.executeBatch();
    return result;
  }
}
```

#### Index Optimization

Create database indexes for common queries:

```sql
-- For blaze-storage
CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON media_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_content_type ON media_files(content_type);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_files(uploaded_by);

-- For blaze-trends
CREATE INDEX IF NOT EXISTS idx_trends_sport ON trends(sport);
CREATE INDEX IF NOT EXISTS idx_trends_detected_at ON trends(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_engagement ON trends(engagement_score DESC);

-- Add to each worker's schema.sql
```

### 3. Read/Write Separation (Week 3)

#### Database Manager

Create `/cloudflare-workers/shared/db-manager.ts`:

```typescript
import { CacheManager } from './cache-manager';
import { QueryBuilder } from './query-builder';

export class DatabaseManager {
  private db: D1Database;
  private cache: CacheManager;
  private queryBuilder: QueryBuilder;

  constructor(db: D1Database, kv: KVNamespace) {
    this.db = db;
    this.cache = new CacheManager(kv, db);
    this.queryBuilder = new QueryBuilder(db);
  }

  // Read operations - use cache
  async read<T>(
    cacheKey: string,
    query: string,
    params: any[],
    cacheTtl: number = 60
  ): Promise<T> {
    return this.cache.get(
      cacheKey,
      async () => {
        const result = await this.db.prepare(query).bind(...params).all();
        return result.results as T;
      },
      { ttl: cacheTtl }
    );
  }

  // Write operations - bypass cache and invalidate
  async write(
    query: string,
    params: any[],
    invalidatePattern?: string
  ): Promise<D1Result> {
    const result = await this.db.prepare(query).bind(...params).run();

    // Invalidate related cache entries
    if (invalidatePattern) {
      await this.cache.invalidate(invalidatePattern);
    }

    return result;
  }

  // Batch operations
  async batchWrite(
    statements: Array<{ query: string; params: any[] }>,
    invalidatePattern?: string
  ): Promise<D1Result[]> {
    const prepared = statements.map(({ query, params }) =>
      this.db.prepare(query).bind(...params)
    );

    const results = await this.db.batch(prepared);

    // Invalidate cache
    if (invalidatePattern) {
      await this.cache.invalidate(invalidatePattern);
    }

    return results;
  }
}
```

### 4. Performance Monitoring (Week 4)

#### Metrics Collection

Create `/cloudflare-workers/blaze-monitor/src/index.ts`:

```typescript
interface PerformanceMetrics {
  timestamp: string;
  worker: string;
  cacheHitRate: number;
  avgQueryTime: number;
  totalQueries: number;
  cacheHits: number;
  cacheMisses: number;
  errorRate: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, any> = new Map();

  recordQuery(duration: number, cached: boolean): void {
    const key = 'queries';
    const current = this.metrics.get(key) || {
      total: 0,
      cached: 0,
      totalTime: 0
    };

    current.total++;
    if (cached) current.cached++;
    current.totalTime += duration;

    this.metrics.set(key, current);
  }

  recordError(error: Error): void {
    const key = 'errors';
    const current = this.metrics.get(key) || { count: 0, errors: [] };
    current.count++;
    current.errors.push({
      message: error.message,
      timestamp: new Date().toISOString()
    });
    this.metrics.set(key, current);
  }

  async flush(env: Env): Promise<void> {
    const queries = this.metrics.get('queries') || {};
    const errors = this.metrics.get('errors') || {};

    const metrics: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      worker: env.WORKER_NAME || 'unknown',
      cacheHitRate: queries.cached / queries.total || 0,
      avgQueryTime: queries.totalTime / queries.total || 0,
      totalQueries: queries.total || 0,
      cacheHits: queries.cached || 0,
      cacheMisses: (queries.total - queries.cached) || 0,
      errorRate: errors.count / queries.total || 0
    };

    // Store in monitoring database
    await env.DB.prepare(`
      INSERT INTO performance_metrics
      (timestamp, worker, cache_hit_rate, avg_query_time, total_queries,
       cache_hits, cache_misses, error_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      metrics.timestamp,
      metrics.worker,
      metrics.cacheHitRate,
      metrics.avgQueryTime,
      metrics.totalQueries,
      metrics.cacheHits,
      metrics.cacheMisses,
      metrics.errorRate
    ).run();

    // Reset metrics
    this.metrics.clear();
  }
}
```

## Implementation Schedule

### Week 1: Cache Manager
- Create `cache-manager.ts`
- Implement cache configurations
- Deploy to blaze-storage worker
- Test cache hit rates

### Week 2: Query Optimization
- Create `query-builder.ts`
- Add database indexes
- Implement batch operations
- Measure query performance

### Week 3: Database Manager
- Create `db-manager.ts`
- Implement read/write separation
- Update all workers to use DatabaseManager
- Test cache invalidation

### Week 4: Performance Monitoring
- Create blaze-monitor worker
- Implement metrics collection
- Create monitoring dashboard
- Set up alerts

## Success Metrics

- **Cache Hit Rate**: Target >70%
- **Avg Query Time**: Target <50ms (cached), <100ms (uncached)
- **Error Rate**: Target <1%
- **Response Time**: Target <200ms (99th percentile)

## Testing

```bash
# Test cache performance
cd cloudflare-workers/blaze-storage
npm run test:cache

# Test query performance
npm run test:queries

# Monitor metrics
npm run monitor
```

## Rollout Strategy

1. Deploy to staging
2. Monitor for 1 week
3. Gradual production rollout (20% → 50% → 100%)
4. Continuous monitoring

---

**Last Updated**: November 20, 2025
**Status**: Ready for Implementation
**Phase**: Phase 2 (Performance Optimization)
