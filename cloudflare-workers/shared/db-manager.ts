/**
 * Database Manager for BSI-NextGen
 *
 * Provides:
 * - Read/write separation via caching
 * - Automatic cache invalidation
 * - Query batching
 * - Transaction support
 * - Performance tracking
 */

import { CacheManager, type CacheConfig } from './cache-manager';

export interface QueryOptions {
  cache?: boolean;
  cacheTtl?: number;
  cacheKey?: string;
  invalidatePattern?: string;
}

export class DatabaseManager {
  private db: D1Database;
  private cache: CacheManager;

  constructor(db: D1Database, kv: KVNamespace) {
    this.db = db;
    this.cache = new CacheManager(kv, db);
  }

  /**
   * Execute a read query (cacheable)
   */
  async read<T = any>(
    query: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<T[]> {
    const {
      cache = true,
      cacheTtl = 60,
      cacheKey
    } = options;

    // If caching disabled, query directly
    if (!cache) {
      const result = await this.db.prepare(query).bind(...params).all();
      return result.results as T[];
    }

    // Generate cache key if not provided
    const key = cacheKey || this.generateCacheKey(query, params);

    // Use cache manager
    return this.cache.get(
      key,
      async () => {
        const result = await this.db.prepare(query).bind(...params).all();
        return result.results as T[];
      },
      { ttl: cacheTtl }
    );
  }

  /**
   * Execute a write query
   */
  async write(
    query: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<D1Result> {
    const result = await this.db.prepare(query).bind(...params).run();

    // Invalidate related cache entries
    if (options.invalidatePattern) {
      await this.cache.invalidate(options.invalidatePattern);
    }

    return result;
  }

  /**
   * Execute a batch of queries
   */
  async batch(
    statements: Array<{ query: string; params?: any[] }>,
    options: QueryOptions = {}
  ): Promise<D1Result[]> {
    const prepared = statements.map(({ query, params = [] }) =>
      this.db.prepare(query).bind(...params)
    );

    const results = await this.db.batch(prepared);

    // Invalidate cache if needed
    if (options.invalidatePattern) {
      await this.cache.invalidate(options.invalidatePattern);
    }

    return results;
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (tx: TransactionContext) => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T> {
    const tx = new TransactionContext(this.db);
    const result = await callback(tx);
    await tx.commit();

    // Invalidate cache if needed
    if (options.invalidatePattern) {
      await this.cache.invalidate(options.invalidatePattern);
    }

    return result;
  }

  /**
   * Get a single row
   */
  async first<T = any>(
    query: string,
    params: any[] = [],
    options: QueryOptions = {}
  ): Promise<T | null> {
    const results = await this.read<T>(query, params, options);
    return results[0] || null;
  }

  /**
   * Execute raw query (no caching)
   */
  async raw<T = any>(query: string, params: any[] = []): Promise<D1Result<T>> {
    return this.db.prepare(query).bind(...params).all();
  }

  /**
   * Clear cache for specific pattern
   */
  async clearCache(pattern: string): Promise<void> {
    await this.cache.invalidate(pattern);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Generate cache key from query and params
   */
  private generateCacheKey(query: string, params: any[]): string {
    const queryHash = this.hashCode(query);
    const paramsHash = this.hashCode(JSON.stringify(params));
    return `query:${queryHash}:${paramsHash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Transaction context for batch operations
 */
export class TransactionContext {
  private db: D1Database;
  private statements: D1PreparedStatement[] = [];

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Add a statement to the transaction
   */
  add(query: string, params: any[] = []): void {
    this.statements.push(this.db.prepare(query).bind(...params));
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<D1Result[]> {
    if (this.statements.length === 0) {
      return [];
    }

    return this.db.batch(this.statements);
  }

  /**
   * Rollback (not supported in D1, but included for API consistency)
   */
  rollback(): void {
    this.statements = [];
  }
}

/**
 * Query builder for common queries
 */
export class QueryBuilder {
  private table: string;
  private whereClause: string[] = [];
  private whereParams: any[] = [];
  private orderBy: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;

  constructor(table: string) {
    this.table = table;
  }

  where(column: string, operator: string, value: any): this {
    this.whereClause.push(`${column} ${operator} ?`);
    this.whereParams.push(value);
    return this;
  }

  whereIn(column: string, values: any[]): this {
    const placeholders = values.map(() => '?').join(',');
    this.whereClause.push(`${column} IN (${placeholders})`);
    this.whereParams.push(...values);
    return this;
  }

  order(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderBy.push(`${column} ${direction}`);
    return this;
  }

  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  build(): { query: string; params: any[] } {
    let query = `SELECT * FROM ${this.table}`;

    if (this.whereClause.length > 0) {
      query += ` WHERE ${this.whereClause.join(' AND ')}`;
    }

    if (this.orderBy.length > 0) {
      query += ` ORDER BY ${this.orderBy.join(', ')}`;
    }

    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
    }

    if (this.offsetValue !== undefined) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    return {
      query,
      params: this.whereParams
    };
  }

  buildCount(): { query: string; params: any[] } {
    let query = `SELECT COUNT(*) as count FROM ${this.table}`;

    if (this.whereClause.length > 0) {
      query += ` WHERE ${this.whereClause.join(' AND ')}`;
    }

    return {
      query,
      params: this.whereParams
    };
  }
}
