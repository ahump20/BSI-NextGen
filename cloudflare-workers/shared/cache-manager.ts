/**
 * Enhanced KV Cache Manager for BSI-NextGen
 *
 * Provides smart caching with:
 * - Automatic cache invalidation
 * - Tag-based cache management
 * - Stale-while-revalidate support
 * - Multi-layer caching strategies
 */

export interface CacheConfig {
  ttl: number;
  staleWhileRevalidate?: number;
  tags?: string[];
}

export interface CacheMetadata {
  tags?: string[];
  createdAt: string;
  expiresAt: string;
}

export class CacheManager {
  private kv: KVNamespace;
  private db: D1Database;

  constructor(kv: KVNamespace, db: D1Database) {
    this.kv = kv;
    this.db = db;
  }

  /**
   * Get data with automatic cache management
   */
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
    await this.set(key, data, config);

    return data;
  }

  /**
   * Set data in cache with metadata
   */
  async set<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.ttl * 1000);

    const metadata: CacheMetadata = {
      tags: config.tags,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.kv.put(key, JSON.stringify(data), {
      expirationTtl: config.ttl,
      metadata,
    });
  }

  /**
   * Get with stale-while-revalidate
   */
  async getWithRevalidate<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: CacheConfig
  ): Promise<T> {
    const cached = await this.kv.get(key, 'json');

    if (cached) {
      // Return cached data immediately
      // Revalidate in background if needed
      const metadata = await this.kv.getWithMetadata(key);
      if (metadata.metadata) {
        const meta = metadata.metadata as CacheMetadata;
        const expiresAt = new Date(meta.expiresAt);
        const now = new Date();

        // If close to expiration, trigger background revalidation
        if (expiresAt.getTime() - now.getTime() < (config.staleWhileRevalidate || 0) * 1000) {
          // Background revalidation (don't await)
          fetchFn().then((data) => this.set(key, data, config));
        }
      }

      return cached as T;
    }

    // No cache - fetch and store
    const data = await fetchFn();
    await this.set(key, data, config);
    return data;
  }

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidate(pattern: string): Promise<void> {
    const list = await this.kv.list({ prefix: pattern });
    const deletions = list.keys.map((key) => this.kv.delete(key.name));
    await Promise.all(deletions);
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    const list = await this.kv.list();

    for (const key of list.keys) {
      const metadata = key.metadata as CacheMetadata;
      if (metadata?.tags?.includes(tag)) {
        await this.kv.delete(key.name);
      }
    }
  }

  /**
   * Invalidate multiple tags at once
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const list = await this.kv.list();

    for (const key of list.keys) {
      const metadata = key.metadata as CacheMetadata;
      if (metadata?.tags?.some((t) => tags.includes(t))) {
        await this.kv.delete(key.name);
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    const list = await this.kv.list();
    const deletions = list.keys.map((key) => this.kv.delete(key.name));
    await Promise.all(deletions);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    keysByTag: Record<string, number>;
  }> {
    const list = await this.kv.list();
    const keysByTag: Record<string, number> = {};

    for (const key of list.keys) {
      const metadata = key.metadata as CacheMetadata;
      if (metadata?.tags) {
        for (const tag of metadata.tags) {
          keysByTag[tag] = (keysByTag[tag] || 0) + 1;
        }
      }
    }

    return {
      totalKeys: list.keys.length,
      keysByTag,
    };
  }
}

/**
 * Predefined cache configurations for different data types
 */
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Live data - short TTL
  liveGames: { ttl: 30, staleWhileRevalidate: 60, tags: ['games', 'live'] },
  liveScores: { ttl: 15, staleWhileRevalidate: 30, tags: ['scores', 'live'] },
  liveStats: { ttl: 20, staleWhileRevalidate: 40, tags: ['stats', 'live'] },

  // Static reference data - long TTL
  teams: { ttl: 3600, staleWhileRevalidate: 7200, tags: ['teams', 'static'] },
  leagues: { ttl: 3600, staleWhileRevalidate: 7200, tags: ['leagues', 'static'] },
  players: { ttl: 1800, staleWhileRevalidate: 3600, tags: ['players', 'static'] },
  venues: { ttl: 3600, tags: ['venues', 'static'] },

  // Schedule data - medium TTL
  schedule: { ttl: 300, staleWhileRevalidate: 600, tags: ['schedule'] },
  standings: { ttl: 600, staleWhileRevalidate: 1200, tags: ['standings'] },

  // Historical data - very long TTL
  historical: { ttl: 86400, staleWhileRevalidate: 172800, tags: ['historical'] },
  archives: { ttl: 604800, tags: ['archives'] }, // 1 week
  seasons: { ttl: 43200, tags: ['seasons'] }, // 12 hours

  // Trends - medium TTL
  trends: { ttl: 900, staleWhileRevalidate: 1800, tags: ['trends'] }, // 15 minutes

  // Media - long TTL (immutable)
  media: { ttl: 31536000, tags: ['media'] }, // 1 year

  // User data - short TTL
  userProfile: { ttl: 300, tags: ['user'] },
  userPreferences: { ttl: 600, tags: ['user'] },
};

/**
 * Helper to generate cache keys
 */
export class CacheKeyBuilder {
  static game(gameId: string): string {
    return `game:${gameId}`;
  }

  static games(date: string, sport?: string): string {
    return sport ? `games:${sport}:${date}` : `games:${date}`;
  }

  static team(teamId: string): string {
    return `team:${teamId}`;
  }

  static standings(league: string, season?: string): string {
    return season ? `standings:${league}:${season}` : `standings:${league}`;
  }

  static trend(trendId: string): string {
    return `trend:${trendId}`;
  }

  static trends(sport?: string): string {
    return sport ? `trends:${sport}` : `trends:all`;
  }

  static media(key: string): string {
    return `media:${key}`;
  }
}
