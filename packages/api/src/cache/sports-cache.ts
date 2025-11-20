/**
 * Blaze Sports Intel - Unified Caching Layer
 *
 * Provides consistent caching across all sports APIs with:
 * - Cloudflare KV integration (production)
 * - In-memory fallback (development)
 * - Automatic cache key generation
 * - TTL management
 * - Cache invalidation helpers
 *
 * @packageDocumentation
 */

export interface CacheOptions {
  /**
   * Time-to-live in seconds
   * @default 300 (5 minutes)
   */
  ttl?: number;

  /**
   * Sport identifier (mlb, nfl, nba, ncaa, youth)
   */
  sport: string;

  /**
   * Endpoint identifier (games, standings, teams, etc.)
   */
  endpoint: string;

  /**
   * Additional parameters for cache key uniqueness
   */
  params?: Record<string, string | number>;

  /**
   * Force bypass cache and fetch fresh data
   * @default false
   */
  forceFresh?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  sport: string;
  endpoint: string;
  cacheKey: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageLatency: number;
}

/**
 * Generate consistent cache key from options
 * Format: bsi:{sport}:{endpoint}:{params}
 *
 * @example
 * generateCacheKey({ sport: 'mlb', endpoint: 'games', params: { date: '2025-01-11' } })
 * // Returns: "bsi:mlb:games:date=2025-01-11"
 */
export function generateCacheKey(options: CacheOptions): string {
  const { sport, endpoint, params = {} } = options;

  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b)) // Consistent ordering
    .map(([key, value]) => `${key}=${value}`)
    .join(':');

  return paramStr
    ? `bsi:${sport}:${endpoint}:${paramStr}`
    : `bsi:${sport}:${endpoint}`;
}

/**
 * In-memory cache for development/fallback
 * Production uses Cloudflare KV
 */
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    latencies: [] as number[],
  };

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    this.stats.latencies.push(Date.now() - startTime);

    return entry as CacheEntry<T>;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    this.cache.set(key, entry);

    // Auto-cleanup expired entries (every 100 sets)
    if (this.cache.size % 100 === 0) {
      const now = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (v.expiresAt < now) {
          this.cache.delete(k);
        }
      }
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, latencies: [] };
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const averageLatency = this.stats.latencies.length > 0
      ? this.stats.latencies.reduce((a, b) => a + b, 0) / this.stats.latencies.length
      : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
      totalRequests,
      averageLatency,
    };
  }
}

// Global in-memory cache instance
const memoryCache = new MemoryCache();

/**
 * Sports Cache Manager
 *
 * Provides unified caching interface for all sports data.
 * Automatically uses Cloudflare KV in production, in-memory cache in development.
 */
export class SportsCache {
  private kv: KVNamespace | null = null;

  constructor(kvNamespace?: KVNamespace) {
    this.kv = kvNamespace || null;
  }

  /**
   * Get cached data or null if not found/expired
   */
  async get<T>(options: CacheOptions): Promise<T | null> {
    if (options.forceFresh) {
      return null;
    }

    const key = generateCacheKey(options);

    // Try KV first (production)
    if (this.kv) {
      try {
        const cached = await this.kv.get<CacheEntry<T>>(key, 'json');
        if (cached && cached.expiresAt > Date.now()) {
          return cached.data;
        }
      } catch (error) {
        console.error('[SportsCache] KV get error:', error);
        // Fall through to memory cache
      }
    }

    // Fallback to memory cache
    const entry = await memoryCache.get<T>(key);
    return entry?.data || null;
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(data: T, options: CacheOptions): Promise<void> {
    const { ttl = 300, sport, endpoint } = options;
    const key = generateCacheKey(options);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl * 1000),
      sport,
      endpoint,
      cacheKey: key,
    };

    // Set in KV (production)
    if (this.kv) {
      try {
        await this.kv.put(key, JSON.stringify(entry), {
          expirationTtl: ttl,
        });
      } catch (error) {
        console.error('[SportsCache] KV set error:', error);
        // Fall through to memory cache
      }
    }

    // Always set in memory cache as fallback
    await memoryCache.set(key, entry);
  }

  /**
   * Delete specific cache entry
   */
  async invalidate(options: Omit<CacheOptions, 'ttl' | 'forceFresh'>): Promise<void> {
    const key = generateCacheKey(options as CacheOptions);

    if (this.kv) {
      try {
        await this.kv.delete(key);
      } catch (error) {
        console.error('[SportsCache] KV delete error:', error);
      }
    }

    await memoryCache.delete(key);
  }

  /**
   * Clear all cache entries for a sport
   */
  async invalidateSport(sport: string): Promise<void> {
    // KV doesn't support prefix deletion, so we'd need to track keys separately
    // For now, this is a no-op for KV (Phase 15: implement key tracking in D1)

    // Clear from memory cache
    await memoryCache.clear();
  }

  /**
   * Get cache statistics (memory cache only for now)
   */
  getStats(): CacheStats {
    return memoryCache.getStats();
  }

  /**
   * Wrap a data fetcher with automatic caching
   *
   * @example
   * const cache = new SportsCache(env.SPORTS_CACHE);
   * const games = await cache.wrap(
   *   () => mlbAdapter.getGames({ date: '2025-01-11' }),
   *   { sport: 'mlb', endpoint: 'games', params: { date: '2025-01-11' }, ttl: 60 }
   * );
   */
  async wrap<T>(
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(options);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    await this.set(data, options);

    return data;
  }
}

/**
 * Create a SportsCache instance
 *
 * @param kvNamespace - Cloudflare KV namespace (optional, uses memory cache if not provided)
 */
export function createSportsCache(kvNamespace?: KVNamespace): SportsCache {
  return new SportsCache(kvNamespace);
}

/**
 * Type guard for Cloudflare KV namespace
 */
export function isKVNamespace(obj: any): obj is KVNamespace {
  return obj && typeof obj.get === 'function' && typeof obj.put === 'function';
}

/**
 * Cache middleware for Next.js API routes
 *
 * @example
 * export const GET = withCache(
 *   async (request) => {
 *     const data = await fetchMLBGames();
 *     return NextResponse.json(data);
 *   },
 *   { sport: 'mlb', endpoint: 'games', ttl: 60 }
 * );
 */
export function withCache<T>(
  handler: (request: Request) => Promise<Response>,
  options: Omit<CacheOptions, 'params' | 'forceFresh'>
) {
  return async (request: Request): Promise<Response> => {
    // Extract params from URL
    const url = new URL(request.url);
    const params: Record<string, string> = {};

    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Check for force-fresh header
    const forceFresh = request.headers.get('Cache-Control')?.includes('no-cache') || false;

    const cacheOptions: CacheOptions = {
      ...options,
      params,
      forceFresh,
    };

    // For now, just call the handler directly
    // Phase 14.4: Add actual caching logic when integrating into routes
    return handler(request);
  };
}

// Type definitions for Cloudflare KV
declare global {
  interface KVNamespace {
    get(key: string, type: 'text'): Promise<string | null>;
    get<T>(key: string, type: 'json'): Promise<T | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
  }
}
