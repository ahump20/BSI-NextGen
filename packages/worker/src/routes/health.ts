import type { Env } from '../bindings';

export function createHealthHandler() {
  return async (_request: Request, env: Env) => {
    const stats = await env.BSI_CACHE.list({ limit: 1 });
    return new Response(
      JSON.stringify({
        status: 'ok',
        cacheKeys: stats.keys.length,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  };
}
