/**
 * College Baseball Rankings API Endpoint
 * GET /api/college-baseball/rankings
 *
 * Returns D1Baseball Top 25 rankings with previous rank movement
 *
 * Data Source: D1Baseball.com
 * Timezone: America/Chicago
 * Cache: 1 hour (rankings update weekly)
 */

import { createD1BaseballAdapter, D1BaseballRanking } from '@adapters/d1baseball-adapter';
import {
  jsonResponse,
  errorResponse,
  handleOptions,
} from '../stats/_utils';
import {
  queryD1WithResilience,
  getKVWithResilience,
} from '../_resilience';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  D1BASEBALL_API_KEY?: string;
}

/**
 * Handle OPTIONS preflight requests
 */
export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

/**
 * GET /api/college-baseball/rankings
 * Fetch D1Baseball Top 25 rankings
 */
export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');
  const url = new URL(context.request.url);
  const week = url.searchParams.get('week') || undefined;

  try {
    const env = context.env as Env;
    const cacheKey = `college-baseball:rankings:${week || 'latest'}`;

    // Try KV cache first (1 hour TTL)
    try {
      const cached = await getKVWithResilience<D1BaseballRanking[]>(
        env.KV,
        cacheKey,
        { type: 'json', timeoutMs: 3000, maxRetries: 1 }
      );

      if (cached) {
        return jsonResponse(
          {
            rankings: cached,
            meta: {
              cached: true,
              count: cached.length,
              week: week || 'latest',
              lastUpdated: new Date().toISOString(),
              timezone: 'America/Chicago',
              dataSource: 'D1Baseball.com',
            },
          },
          { cached: true, origin, maxAge: 3600 }
        );
      }
    } catch (error) {
      console.warn('[Rankings] KV cache miss:', error);
    }

    // Fetch from D1Baseball API
    const adapter = createD1BaseballAdapter({
      apiKey: env.D1BASEBALL_API_KEY,
    });

    const rankings = await adapter.getRankings(week);

    // Store in D1 database
    await storeRankingsInDatabase(env.DB, rankings);

    // Cache in KV (1 hour)
    try {
      await env.KV.put(
        cacheKey,
        JSON.stringify(rankings),
        { expirationTtl: 3600 }
      );
    } catch (error) {
      console.warn('[Rankings] Failed to cache in KV:', error);
    }

    return jsonResponse(
      {
        rankings,
        meta: {
          cached: false,
          count: rankings.length,
          week: week || 'latest',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          dataSource: 'D1Baseball.com',
        },
      },
      { cached: false, origin, maxAge: 3600 }
    );
  } catch (error: any) {
    console.error('[Rankings] Failed to fetch rankings:', error);
    return errorResponse(
      `Failed to fetch rankings: ${error.message || 'Unknown error'}`,
      500,
      origin
    );
  }
}

/**
 * Store rankings in D1 database
 */
async function storeRankingsInDatabase(
  db: D1Database,
  rankings: D1BaseballRanking[]
): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);

    for (const ranking of rankings) {
      await queryD1WithResilience(
        db,
        `INSERT INTO rankings (
          id, team_id, poll_date, rank, previous_rank, record,
          points, first_place_votes, source, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          rank = excluded.rank,
          previous_rank = excluded.previous_rank,
          record = excluded.record,
          points = excluded.points,
          first_place_votes = excluded.first_place_votes`,
        [
          `d1baseball-${now}-${ranking.team.id}`,
          ranking.team.id,
          now,
          ranking.rank,
          ranking.previousRank || null,
          ranking.record,
          ranking.points || null,
          ranking.firstPlaceVotes || 0,
          'D1Baseball',
          now,
        ],
        { timeoutMs: 5000, maxRetries: 1, operation: 'Store Ranking' }
      );
    }
  } catch (error) {
    console.warn('[Rankings] Failed to store in database:', error);
    // Don't throw - we still want to return the data
  }
}
