import { z } from 'zod';
import type { Env } from '../bindings';

const paramsSchema = z.object({ id: z.string() });

type RouteRequest = Request & { params?: Record<string, string> };

export function createTeamsHandler() {
  return async (request: RouteRequest, env: Env) => {
    const parsed = paramsSchema.parse(request.params ?? {});
    const result = await env.BSI_DB.prepare(
      `SELECT id, name, record, offensive_rating as offensiveRating, defensive_rating as defensiveRating,
              net_rating as netRating, streak, trend
       FROM teams WHERE id = ?`
    )
      .bind(parsed.id)
      .first();

    if (!result) {
      return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404 });
    }

    const trendValue = (() => {
      if (Array.isArray(result.trend)) {
        return result.trend;
      }

      if (typeof result.trend === 'string' && result.trend.trim().length > 0) {
        try {
          const parsed = JSON.parse(result.trend);
          return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.warn('[BSI] Failed to parse team trend', error);
          return [];
        }
      }

      return [];
    })();

    const body = {
      ...result,
      trend: trendValue
    };

    return new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=20'
      }
    });
  };
}
