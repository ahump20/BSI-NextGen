# @bsi/api/cache - Sports Caching Layer

Unified caching infrastructure for Blaze Sports Intel APIs with Cloudflare KV integration.

---

## Quick Start

### Installation

The cache module is already part of `@bsi/api` package. No additional installation needed.

```typescript
import { createSportsCache } from '@bsi/api/cache';
```

### Basic Usage

```typescript
import { createSportsCache } from '@bsi/api/cache';

// Create cache instance (with KV in production)
const cache = createSportsCache(env.SPORTS_CACHE);

// Wrap a data fetcher with automatic caching
const games = await cache.wrap(
  () => mlbAdapter.getGames({ date: '2025-01-11' }),
  {
    sport: 'mlb',
    endpoint: 'games',
    params: { date: '2025-01-11' },
    ttl: 60, // Cache for 60 seconds
  }
);
```

---

## Integration Examples

### Next.js API Route (Edge Runtime)

```typescript
// packages/web/app/api/ncaa/football/[teamId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSportsCache } from '@bsi/api/cache';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  const cache = createSportsCache(process.env.SPORTS_CACHE);
  const { teamId } = params;

  // Wrap the ESPN API call with caching
  const teamData = await cache.wrap(
    async () => {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/${teamId}`
      );
      return response.json();
    },
    {
      sport: 'ncaa_football',
      endpoint: 'team',
      params: { teamId },
      ttl: 300, // 5 minutes
    }
  );

  return NextResponse.json(teamData);
}
```

### Next.js API Route (Node.js Runtime)

```typescript
// packages/web/app/api/sports/youth-sports/texas-hs-football/standings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSportsCache } from '@bsi/api/cache';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const classification = searchParams.get('classification') || '6A';

  const cache = createSportsCache(); // Uses in-memory cache in development

  const standings = await cache.wrap(
    () => fetchMaxPrepsStandings(classification),
    {
      sport: 'youth_sports',
      endpoint: 'standings',
      params: { classification },
      ttl: 300,
    }
  );

  return NextResponse.json(standings);
}
```

---

## API Reference

### `createSportsCache(kvNamespace?)`

Creates a new SportsCache instance.

**Parameters:**
- `kvNamespace` (optional): Cloudflare KV namespace for production caching

**Returns:** `SportsCache` instance

**Example:**
```typescript
const cache = createSportsCache(env.SPORTS_CACHE);
```

---

### `SportsCache`

#### `cache.wrap<T>(fetcher, options): Promise<T>`

Wraps a data fetcher with automatic caching. Checks cache first, fetches if miss, stores result.

**Parameters:**
- `fetcher`: Async function that returns the data
- `options`: `CacheOptions` object

**Returns:** Promise resolving to cached or fresh data

**Example:**
```typescript
const games = await cache.wrap(
  () => mlbAdapter.getGames({ date: '2025-01-11' }),
  {
    sport: 'mlb',
    endpoint: 'games',
    params: { date: '2025-01-11' },
    ttl: 60,
  }
);
```

#### `cache.get<T>(options): Promise<T | null>`

Gets cached data if available and not expired.

**Parameters:**
- `options`: `CacheOptions` object

**Returns:** Promise resolving to cached data or null

**Example:**
```typescript
const cached = await cache.get({
  sport: 'mlb',
  endpoint: 'games',
  params: { date: '2025-01-11' },
});
```

#### `cache.set<T>(data, options): Promise<void>`

Stores data in cache with TTL.

**Parameters:**
- `data`: Data to cache
- `options`: `CacheOptions` object

**Returns:** Promise resolving when cached

**Example:**
```typescript
await cache.set(games, {
  sport: 'mlb',
  endpoint: 'games',
  params: { date: '2025-01-11' },
  ttl: 60,
});
```

#### `cache.invalidate(options): Promise<void>`

Removes specific cache entry.

**Parameters:**
- `options`: Cache options (without ttl/forceFresh)

**Returns:** Promise resolving when invalidated

**Example:**
```typescript
await cache.invalidate({
  sport: 'mlb',
  endpoint: 'games',
  params: { date: '2025-01-11' },
});
```

#### `cache.invalidateSport(sport): Promise<void>`

Clears all cache entries for a sport (memory cache only for now).

**Parameters:**
- `sport`: Sport identifier

**Returns:** Promise resolving when invalidated

**Example:**
```typescript
await cache.invalidateSport('mlb');
```

#### `cache.getStats(): CacheStats`

Gets cache performance statistics.

**Returns:** `CacheStats` object with hit rate, latency, etc.

**Example:**
```typescript
const stats = cache.getStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
console.log(`Avg latency: ${stats.averageLatency}ms`);
```

---

## Cache Options

```typescript
interface CacheOptions {
  // Required
  sport: string;              // 'mlb' | 'nfl' | 'nba' | 'ncaa' | 'youth'
  endpoint: string;           // 'games' | 'standings' | 'teams' | etc.

  // Optional
  ttl?: number;               // Time-to-live in seconds (default: 300)
  params?: Record<string, string | number>; // Query parameters
  forceFresh?: boolean;       // Bypass cache (default: false)
}
```

---

## Cache Key Format

Cache keys are automatically generated in a consistent format:

```
bsi:{sport}:{endpoint}:{params}

Examples:
- bsi:mlb:games:date=2025-01-11
- bsi:nfl:standings:season=2025
- bsi:ncaa:football:teamId=251
- bsi:youth:txhsfb:standings:classification=6A
```

Keys are deterministic (same request = same key) and hierarchical for easy invalidation.

---

## Performance Targets

### Cache Hit Latency
- **KV Cache Hit:** <10ms (production with Cloudflare KV)
- **Memory Cache Hit:** <1ms (development/fallback)

### Cache Miss Latency
- **Edge Runtime:** <50ms (Cloudflare Workers + external API)
- **Node.js Runtime:** <200ms (traditional serverless + external API)

### TTL Recommendations

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Live scores (in-game) | 30-60s | Balance freshness vs load |
| Live scores (pre-game) | 300s | Static until game starts |
| Standings | 300s | Updated daily/weekly |
| Team info | 3600s | Rarely changes |
| Historical data | 86400s | Never changes |

---

## Cloudflare KV Setup

### 1. Create KV Namespace

```bash
npx wrangler kv:namespace create SPORTS_CACHE
npx wrangler kv:namespace create SPORTS_CACHE --preview
```

### 2. Add to wrangler.toml

```toml
[[kv_namespaces]]
binding = "SPORTS_CACHE"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### 3. Update Environment Variables

**Local Development (.env):**
```bash
SPORTS_CACHE_NAMESPACE_ID=your-kv-namespace-id
```

**Production (Netlify/Vercel):**
Add `SPORTS_CACHE` environment variable in dashboard settings.

### 4. Use in Routes

```typescript
export async function GET(request: NextRequest, context: any) {
  const cache = createSportsCache(context.env?.SPORTS_CACHE);
  // ... rest of handler
}
```

---

## Testing

### Unit Tests

```typescript
import { createSportsCache, generateCacheKey } from '@bsi/api/cache';

describe('SportsCache', () => {
  it('should generate consistent cache keys', () => {
    const key = generateCacheKey({
      sport: 'mlb',
      endpoint: 'games',
      params: { date: '2025-01-11' },
    });

    expect(key).toBe('bsi:mlb:games:date=2025-01-11');
  });

  it('should cache and retrieve data', async () => {
    const cache = createSportsCache();
    const data = { games: [] };

    await cache.set(data, {
      sport: 'mlb',
      endpoint: 'games',
      params: { date: '2025-01-11' },
      ttl: 60,
    });

    const cached = await cache.get({
      sport: 'mlb',
      endpoint: 'games',
      params: { date: '2025-01-11' },
    });

    expect(cached).toEqual(data);
  });

  it('should respect TTL expiration', async () => {
    const cache = createSportsCache();

    await cache.set({ games: [] }, {
      sport: 'mlb',
      endpoint: 'games',
      params: { date: '2025-01-11' },
      ttl: 1, // 1 second
    });

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    const cached = await cache.get({
      sport: 'mlb',
      endpoint: 'games',
      params: { date: '2025-01-11' },
    });

    expect(cached).toBeNull();
  });
});
```

### Integration Testing

```bash
# Test command center API with caching
curl -s "http://localhost:3000/api/sports/command-center?sports=mlb,ncaa_football" | jq

# Verify cache headers
curl -I "http://localhost:3000/api/ncaa/football/251"
# Should see: Cache-Control: public, max-age=300, s-maxage=600
```

---

## Monitoring & Observability

### Cache Statistics

```typescript
const stats = cache.getStats();

console.log('Cache Performance:');
console.log(`  Hits: ${stats.hits}`);
console.log(`  Misses: ${stats.misses}`);
console.log(`  Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`  Avg Latency: ${stats.averageLatency.toFixed(2)}ms`);
```

### Recommended Metrics

- **Hit Rate:** Target >80% for stable traffic
- **Average Latency:** <10ms for KV hits, <1ms for memory hits
- **Cache Size:** Monitor KV storage usage (free tier: 1GB)
- **TTL Tuning:** Adjust based on data freshness requirements

---

## Migration Guide

### Migrating Existing Routes

**Before (no caching):**
```typescript
export async function GET(request: NextRequest) {
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return NextResponse.json(data);
}
```

**After (with caching):**
```typescript
import { createSportsCache } from '@bsi/api/cache';

export async function GET(request: NextRequest) {
  const cache = createSportsCache(process.env.SPORTS_CACHE);

  const data = await cache.wrap(
    async () => {
      const response = await fetch('https://api.example.com/data');
      return response.json();
    },
    {
      sport: 'mlb',
      endpoint: 'data',
      ttl: 300,
    }
  );

  return NextResponse.json(data);
}
```

---

## Troubleshooting

### Cache Not Working

**Problem:** Data always fetched, cache never hits

**Solutions:**
1. Check KV namespace is properly bound
2. Verify `SPORTS_CACHE` environment variable
3. Ensure cache keys are deterministic (params sorted)
4. Check TTL isn't too short

### High Cache Miss Rate

**Problem:** Hit rate <50%

**Solutions:**
1. Increase TTL for less time-sensitive data
2. Check if query parameters vary too much
3. Verify cache isn't being cleared too frequently
4. Consider pre-warming cache for popular requests

### KV Quota Exceeded

**Problem:** "KV storage limit exceeded" error

**Solutions:**
1. Review TTL settings (shorter TTL = less storage)
2. Implement cache eviction for old keys
3. Upgrade to paid KV tier if needed
4. Consider D1 for historical data instead

---

## Best Practices

### 1. Choose Appropriate TTLs

```typescript
// Live game data - short TTL
await cache.set(liveScores, { sport: 'mlb', endpoint: 'live', ttl: 30 });

// Standings - medium TTL
await cache.set(standings, { sport: 'mlb', endpoint: 'standings', ttl: 300 });

// Historical data - long TTL
await cache.set(historical, { sport: 'mlb', endpoint: 'history', ttl: 86400 });
```

### 2. Use Consistent Parameter Naming

```typescript
// ✅ Good: Consistent naming
{ sport: 'mlb', endpoint: 'games', params: { date: '2025-01-11' } }

// ❌ Bad: Inconsistent naming
{ sport: 'mlb', endpoint: 'games', params: { gameDate: '2025-01-11' } }
```

### 3. Handle Cache Failures Gracefully

```typescript
try {
  const data = await cache.get(options);
  if (data) return data;
} catch (error) {
  console.error('Cache error, fetching fresh:', error);
}

// Always fetch if cache fails
return await fetcher();
```

### 4. Monitor Performance

```typescript
// Log cache stats periodically
setInterval(() => {
  const stats = cache.getStats();
  console.log('[Cache] Hit rate:', stats.hitRate);
}, 60000);
```

---

## Roadmap

### Phase 14 (Current)
- [x] In-memory cache implementation
- [x] KV integration support
- [x] Automatic cache key generation
- [ ] KV namespace deployment
- [ ] Production integration testing

### Phase 15 (Planned)
- [ ] D1 integration for historical data
- [ ] Cache warming strategies
- [ ] Distributed cache invalidation
- [ ] Cache analytics dashboard

### Phase 16 (Future)
- [ ] Redis integration (optional)
- [ ] Multi-tier caching (KV → D1 → R2)
- [ ] Predictive cache warming
- [ ] Cache compression

---

## Support

For issues or questions:
- Check `docs/API_INVENTORY.md` for endpoint documentation
- Review `docs/PHASE_14_IMPLEMENTATION.md` (when available)
- Contact: Austin Humphrey (ahump20@outlook.com)

---

**Last Updated:** 2025-11-19
**Version:** 1.0.0 (Phase 14)
