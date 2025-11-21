/**
 * College Baseball Conference Standings API Endpoint
 * GET /api/college-baseball/standings
 *
 * Returns conference standings with overall and conference records
 *
 * Query Parameters:
 * - conference: Filter by conference (defaults to 'SEC')
 *
 * Data Source: D1Baseball.com
 * Timezone: America/Chicago
 * Cache: 1 hour (standings update daily)
 */

import { createD1BaseballAdapter, ConferenceStandings } from '@adapters/d1baseball-adapter';
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
 * GET /api/college-baseball/standings
 * Fetch conference standings
 */
export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');
  const url = new URL(context.request.url);
  const conference = url.searchParams.get('conference') || 'SEC';

  try {
    const env = context.env as Env;
    const cacheKey = `college-baseball:standings:${conference}`;

    // Try KV cache first (1 hour TTL)
    try {
      const cached = await getKVWithResilience<ConferenceStandings>(
        env.KV,
        cacheKey,
        { type: 'json', timeoutMs: 3000, maxRetries: 1 }
      );

      if (cached) {
        return jsonResponse(
          {
            ...cached,
            meta: {
              cached: true,
              count: cached.teams.length,
              conference,
              lastUpdated: cached.lastUpdated,
              timezone: 'America/Chicago',
              dataSource: 'D1Baseball.com',
            },
          },
          { cached: true, origin, maxAge: 3600 }
        );
      }
    } catch (error) {
      console.warn('[Standings] KV cache miss:', error);
    }

    // Fetch from D1Baseball API
    const adapter = createD1BaseballAdapter({
      apiKey: env.D1BASEBALL_API_KEY,
    });

    const standings = await adapter.getConferenceStandings(conference);

    if (!standings) {
      return errorResponse(
        `No standings found for conference: ${conference}`,
        404,
        origin
      );
    }

    // Store in D1 database
    await storeStandingsInDatabase(env.DB, standings);

    // Cache in KV (1 hour)
    try {
      await env.KV.put(
        cacheKey,
        JSON.stringify(standings),
        { expirationTtl: 3600 }
      );
    } catch (error) {
      console.warn('[Standings] Failed to cache in KV:', error);
    }

    return jsonResponse(
      {
        ...standings,
        meta: {
          cached: false,
          count: standings.teams.length,
          conference,
          lastUpdated: standings.lastUpdated,
          timezone: 'America/Chicago',
          dataSource: 'D1Baseball.com',
        },
      },
      { cached: false, origin, maxAge: 3600 }
    );
  } catch (error: any) {
    console.error('[Standings] Failed to fetch standings:', error);
    return errorResponse(
      `Failed to fetch standings: ${error.message || 'Unknown error'}`,
      500,
      origin
    );
  }
}

/**
 * Store standings in D1 database
 */
async function storeStandingsInDatabase(
  db: D1Database,
  standings: ConferenceStandings
): Promise<void> {
  try {
    const season = new Date().getFullYear();
    const now = Math.floor(Date.now() / 1000);

    for (const team of standings.teams) {
      await queryD1WithResilience(
        db,
        `INSERT INTO standings (
          id, team_id, season, conference,
          wins, losses,
          conference_wins, conference_losses,
          runs_scored, runs_allowed,
          home_record, away_record, streak,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(team_id, season) DO UPDATE SET
          wins = excluded.wins,
          losses = excluded.losses,
          conference_wins = excluded.conference_wins,
          conference_losses = excluded.conference_losses,
          runs_scored = excluded.runs_scored,
          runs_allowed = excluded.runs_allowed,
          home_record = excluded.home_record,
          away_record = excluded.away_record,
          streak = excluded.streak,
          updated_at = excluded.updated_at`,
        [
          `${team.team.id}-${season}`,
          team.team.id,
          season,
          standings.conference,
          team.overallRecord.wins,
          team.overallRecord.losses,
          team.conferenceRecord.wins,
          team.conferenceRecord.losses,
          team.runsScored || null,
          team.runsAllowed || null,
          team.homeRecord || null,
          team.awayRecord || null,
          team.streak || null,
          now,
        ],
        { timeoutMs: 5000, maxRetries: 1, operation: 'Store Standings' }
      );
    }
  } catch (error) {
    console.warn('[Standings] Failed to store in database:', error);
    // Don't throw - we still want to return the data
  }
}
