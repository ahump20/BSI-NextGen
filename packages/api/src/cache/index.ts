/**
 * @module @bsi/api/cache
 *
 * Unified caching layer for Blaze Sports Intel APIs.
 * Provides consistent caching interface across all sports with KV integration.
 */

export {
  type CacheOptions,
  type CacheEntry,
  type CacheStats,
  SportsCache,
  createSportsCache,
  generateCacheKey,
  isKVNamespace,
  withCache,
} from './sports-cache';
