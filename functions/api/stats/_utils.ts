/**
 * Analytics API Utilities
 * Shared helpers for stats endpoints
 */

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
}

interface CachedData<T> {
  data: T;
  expires: number;
}

export const CACHE_DURATIONS = {
  GLOBAL_STATS: 60, // 1 minute
  LEADERBOARD: 300, // 5 minutes
  CHARACTER_STATS: 300, // 5 minutes
  STADIUM_STATS: 300, // 5 minutes
  PLAYER_STATS: 60, // 1 minute
} as const;

/**
 * CORS headers for API responses
 */
export const ALLOWED_ORIGINS = [
  'https://blazesportsintel.com',
  'https://www.blazesportsintel.com',
  'https://eaec3ea6.sandlot-sluggers.pages.dev', // Production
  'https://5e1ebbdb.sandlot-sluggers.pages.dev', // Previous production
  'https://blaze-backyard-baseball.pages.dev',
  'http://localhost:5173', // Dev only
  'http://localhost:3000', // Dev only
  'http://localhost:8788', // Wrangler dev
];

export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    headers['Access-Control-Max-Age'] = '86400';
  }

  return headers;
}

/**
 * Get data from KV cache or execute fetcher
 * KV failures are logged but don't fail the request
 */
export async function getCachedData<T>(
  kv: KVNamespace,
  config: CacheConfig,
  fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  // Try to get from cache (don't fail if KV get fails)
  try {
    const cached = await kv.get<CachedData<T>>(config.key, 'json');

    if (cached && cached.expires > Date.now()) {
      return { data: cached.data, cached: true };
    }
  } catch (error: any) {
    console.warn(`KV cache get failed for ${config.key}:`, error.message);
  }

  // Fetch fresh data
  const fresh = await fetcher();

  // Store in cache (don't fail if KV put fails)
  try {
    await kv.put(
      config.key,
      JSON.stringify({
        data: fresh,
        expires: Date.now() + config.ttl * 1000,
      }),
      { expirationTtl: config.ttl }
    );
  } catch (error: any) {
    console.warn(`KV cache put failed for ${config.key}:`, error.message);
  }

  return { data: fresh, cached: false };
}

/**
 * Success response helper
 */
export function jsonResponse<T>(
  data: T,
  options: {
    cached?: boolean;
    origin?: string | null;
    maxAge?: number;
  } = {}
): Response {
  const headers = getCorsHeaders(options.origin || null);

  if (options.cached !== undefined) {
    headers['X-Cache'] = options.cached ? 'HIT' : 'MISS';
  }

  if (options.maxAge) {
    headers['Cache-Control'] = `public, max-age=${options.maxAge}`;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status: number = 500,
  origin?: string | null
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: getCorsHeaders(origin || null),
    }
  );
}

/**
 * Handle OPTIONS preflight requests
 */
export function handleOptions(request: Request): Response {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Format timestamp in America/Chicago timezone
 */
export function formatTimestamp(date: Date = new Date()): string {
  return date.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Calculate percentile rank
 */
export function getPercentileRank(value: number, allValues: number[]): number {
  const sorted = [...allValues].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  return Math.round((index / sorted.length) * 100);
}
