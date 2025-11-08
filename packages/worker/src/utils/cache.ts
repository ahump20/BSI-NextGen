import { hash } from './hash';
import type { Env } from '../bindings';

type RouteRequest = Request & { params?: Record<string, string> };
type Handler = (request: RouteRequest, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;

type CacheKey = 'dashboard' | 'team';

export function withCache(key: CacheKey, ttlSeconds: number, handler: Handler) {
  return async (request: RouteRequest, env: Env, ctx: ExecutionContext) => {
    const cacheKey = `${key}:${await hash(request.url + JSON.stringify(request.params ?? {}))}`;
    const cached = await env.BSI_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${ttlSeconds}`,
          'X-Cache-Hit': 'true'
        }
      });
    }

    const response = await handler(request, env, ctx);
    if (response.ok) {
      const body = await response.clone().text();
      ctx.waitUntil(env.BSI_CACHE.put(cacheKey, body, { expirationTtl: ttlSeconds }));
    }

    return response;
  };
}
