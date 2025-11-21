import { buildCacheKey, deriveGameState, deriveSport, getCacheMetadata, getCachedResponse, getEndpointName, invalidateCache, setCachedResponse } from './cache';
import { logEvent, logSession, logUsage } from './logging';
import { CachedPayload, Env, GameState } from './types';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function shouldBypassCache(request: Request, env: Env): boolean {
  const bypassHeader = request.headers.get('x-bsi-cache-bypass');
  if (bypassHeader && env.CACHE_BYPASS_TOKEN && bypassHeader === env.CACHE_BYPASS_TOKEN) {
    return true;
  }
  return request.headers.get('cache-control')?.includes('no-cache') ?? false;
}

function buildSessionId(request: Request): string {
  return request.headers.get('x-bsi-session') || crypto.randomUUID();
}

function sanitizeHeaders(headers: Headers): Headers {
  const forward = new Headers();
  headers.forEach((value, key) => {
    if (key.toLowerCase().startsWith('cf-')) return;
    if (key.toLowerCase() === 'host') return;
    forward.set(key, value);
  });
  forward.set('User-Agent', headers.get('User-Agent') || 'BlazeSportsIntel/worker-proxy');
  return forward;
}

async function proxySportsApi(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  const sessionId = buildSessionId(request);
  const gameState = deriveGameState(url.pathname, url.searchParams);
  const sport = deriveSport(url.pathname);
  const eventDate = url.searchParams.get('date') || todayISO();
  const endpoint = getEndpointName(url.pathname);
  const cacheKey = buildCacheKey({ sport, endpoint, date: eventDate, state: gameState, params: url.searchParams });
  const bypassCache = shouldBypassCache(request, env);

  let cacheStatus: 'HIT' | 'MISS' | 'STALE' | 'BYPASS' = bypassCache ? 'BYPASS' : 'MISS';
  let cachedPayload: CachedPayload | null = null;

  if (!bypassCache) {
    cachedPayload = await getCachedResponse(env, cacheKey);
    if (cachedPayload) {
      cacheStatus = 'HIT';
      const headers = new Headers(cachedPayload.headers);
      headers.set('X-Cache', cacheStatus);
      headers.set('X-Cache-State', cachedPayload.state);
      headers.set('X-Cache-Date', cachedPayload.date);
      headers.set('X-BSI-Session', sessionId);
      headers.set('Cache-Control', getCacheMetadata(cachedPayload.state).cacheControl);

      ctx.waitUntil(
        Promise.all([
          logSession(env, sessionId, endpoint, cachedPayload.state, cachedPayload.date, request.headers.get('cf-connecting-ip') || undefined, request.headers.get('user-agent') || undefined),
          logEvent(env, sessionId, endpoint, 200, cacheStatus, cachedPayload.state, cachedPayload.date),
          logUsage(env, endpoint, cacheStatus, cachedPayload.state),
        ])
      );

      return new Response(cachedPayload.body, { status: cachedPayload.status, headers });
    }
  }

  const upstreamBase = env.UPSTREAM_BASE_URL || `${url.protocol}//${url.host}`;
  const upstreamUrl = new URL(upstreamBase);
  upstreamUrl.pathname = url.pathname;
  upstreamUrl.search = url.search;

  let upstreamResponse: Response | null = null;
  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: sanitizeHeaders(request.headers),
      body: request.body,
    });
  } catch (error) {
    if (cachedPayload) {
      cacheStatus = 'STALE';
      const headers = new Headers(cachedPayload.headers);
      headers.set('X-Cache', cacheStatus);
      headers.set('X-BSI-Session', sessionId);
      headers.set('Cache-Control', getCacheMetadata(cachedPayload.state).cacheControl);
      return new Response(cachedPayload.body, { status: cachedPayload.status, headers });
    }
    return new Response('Upstream unavailable', { status: 502 });
  }

  const responseText = await upstreamResponse.text();
  const metadata = getCacheMetadata(gameState);
  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.set('X-Cache', cacheStatus);
  responseHeaders.set('X-BSI-Session', sessionId);
  responseHeaders.set('Cache-Control', metadata.cacheControl);
  responseHeaders.set('CDN-Cache-Control', metadata.cacheControl);
  responseHeaders.set('CF-Cache-Status', cacheStatus);

  if (upstreamResponse.ok) {
    const payload: CachedPayload = {
      body: responseText,
      status: upstreamResponse.status,
      headers: Object.fromEntries(responseHeaders.entries()),
      cachedAt: Date.now(),
      state: gameState,
      date: eventDate,
    };
    ctx.waitUntil(setCachedResponse(env, cacheKey, payload, gameState));
  }

  ctx.waitUntil(
    Promise.all([
      logSession(env, sessionId, endpoint, gameState, eventDate, request.headers.get('cf-connecting-ip') || undefined, request.headers.get('user-agent') || undefined),
      logEvent(env, sessionId, endpoint, upstreamResponse.status, cacheStatus, gameState, eventDate),
      logUsage(env, endpoint, cacheStatus, gameState),
    ])
  );

  return new Response(responseText, { status: upstreamResponse.status, headers: responseHeaders });
}

async function handleInvalidate(request: Request, env: Env): Promise<Response> {
  if (request.headers.get('x-invalidation-token') !== env.INVALIDATION_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }
  const body = await request.json<{ sport: string; date: string; state: GameState }>();
  const deleted = await invalidateCache(env, body.sport, body.date, body.state);
  return Response.json({ deleted, scope: body });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', cache: true, timestamp: new Date().toISOString() });
    }

    if (url.pathname === '/internal/cache/invalidate' && request.method === 'POST') {
      return handleInvalidate(request, env);
    }

    if (url.pathname.startsWith('/api/sports') || url.pathname.startsWith('/api/unified')) {
      return proxySportsApi(request, env, ctx);
    }

    return new Response('Not Found', { status: 404 });
  },
};
