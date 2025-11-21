import { CacheKeyParts, CachedPayload, Env, GameState } from './types';

const STATE_TTLS: Record<GameState, number> = {
  live: 15,
  pre: 300,
  final: 3600,
  postponed: 600,
  unknown: 120,
};

export function deriveGameState(pathname: string, searchParams: URLSearchParams): GameState {
  const queryState = searchParams.get('state')?.toLowerCase();
  if (queryState === 'live' || queryState === 'in-progress') return 'live';
  if (queryState === 'final') return 'final';
  if (queryState === 'pre' || queryState === 'scheduled') return 'pre';
  if (queryState === 'postponed') return 'postponed';

  if (pathname.includes('/live')) return 'live';
  if (pathname.includes('/final')) return 'final';
  if (pathname.includes('/schedule')) return 'pre';

  return 'unknown';
}

export function deriveSport(pathname: string): string {
  if (pathname.includes('mlb')) return 'mlb';
  if (pathname.includes('nfl')) return 'nfl';
  if (pathname.includes('nba')) return 'nba';
  if (pathname.includes('college-baseball') || pathname.includes('college_baseball')) return 'college_baseball';
  if (pathname.includes('football')) return 'ncaa_football';
  if (pathname.includes('basketball')) return 'ncaa_basketball';
  return 'multi';
}

export function buildCacheKey(parts: CacheKeyParts): string {
  const sortedParams = new URLSearchParams(parts.params);
  const paramPairs: string[] = [];
  [...sortedParams.keys()].sort().forEach((key) => {
    const value = sortedParams.getAll(key).join(',');
    paramPairs.push(`${key}=${value}`);
  });
  const paramSuffix = paramPairs.length > 0 ? `:${paramPairs.join('|')}` : '';
  return `sports:${parts.sport}:${parts.date}:${parts.state}:${parts.endpoint}${paramSuffix}`;
}

export async function getCachedResponse(env: Env, key: string): Promise<CachedPayload | null> {
  const cached = await env.SPORTS_CACHE.get<CachedPayload>(key, 'json');
  return cached || null;
}

export async function setCachedResponse(env: Env, key: string, payload: CachedPayload, state: GameState): Promise<void> {
  const ttl = STATE_TTLS[state] ?? STATE_TTLS.unknown;
  await env.SPORTS_CACHE.put(key, JSON.stringify(payload), { expirationTtl: ttl });
}

export async function invalidateCache(env: Env, sport: string, date: string, state: GameState): Promise<number> {
  const prefix = `sports:${sport}:${date}:${state}`;
  const keys = await env.SPORTS_CACHE.list({ prefix });
  let deleted = 0;
  for (const key of keys.keys) {
    await env.SPORTS_CACHE.delete(key.name);
    deleted += 1;
  }
  return deleted;
}

export function getEndpointName(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  const apiIndex = parts.indexOf('api');
  if (apiIndex >= 0 && parts.length > apiIndex + 1) {
    return parts.slice(apiIndex + 1).join('-');
  }
  return pathname.replace(/\//g, '-') || 'root';
}

export function getCacheMetadata(state: GameState) {
  const ttl = STATE_TTLS[state] ?? STATE_TTLS.unknown;
  return {
    ttl,
    cacheControl: `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`,
  };
}
