export type GameState = 'pre' | 'live' | 'final' | 'postponed' | 'unknown';

export interface Env {
  SPORTS_CACHE: KVNamespace;
  OBS_DB: D1Database;
  ASSET_BUCKET: R2Bucket;
  UPSTREAM_BASE_URL: string;
  CACHE_BYPASS_TOKEN?: string;
  INVALIDATION_TOKEN?: string;
}

export interface CacheKeyParts {
  sport: string;
  endpoint: string;
  date: string;
  state: GameState;
  params: URLSearchParams;
}

export interface CachedPayload {
  body: string;
  status: number;
  headers: Record<string, string>;
  cachedAt: number;
  state: GameState;
  date: string;
}
