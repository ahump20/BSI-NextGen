/**
 * College Baseball Games List API Endpoint
 * GET /api/college-baseball/games
 *
 * Returns list of games for a date range or team
 * Fills ESPN's gap by providing comprehensive college baseball schedule
 *
 * Query Parameters:
 * - date: YYYY-MM-DD format (defaults to today)
 * - teamId: Filter by team ID
 * - conference: Filter by conference
 * - status: Filter by status (scheduled, in_progress, final, postponed)
 *
 * Data Source: NCAA Stats API
 * Timezone: America/Chicago
 * Cache: 60 seconds
 */

import { createNCAAAdapter, NCAAGame } from '@adapters/ncaa-adapter';
import {
  jsonResponse,
  errorResponse,
  handleOptions,
  CACHE_DURATIONS,
} from '../../stats/_utils';
import {
  queryD1WithResilience,
  getKVWithResilience,
} from '../../_resilience';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  NCAA_API_KEY?: string;
}

/**
 * Handle OPTIONS preflight requests
 */
export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

/**
 * GET /api/college-baseball/games
 * Fetch list of college baseball games
 */
export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');
  const url = new URL(context.request.url);

  // Parse query parameters
  const date = url.searchParams.get('date') || getTodayInChicago();
  const teamId = url.searchParams.get('teamId');
  const conference = url.searchParams.get('conference');
  const status = url.searchParams.get('status');

  try {
    const env = context.env as Env;

    // Build cache key
    const cacheKey = `college-baseball:games:${date}:${teamId || 'all'}:${conference || 'all'}:${status || 'all'}`;

    // Try KV cache first
    try {
      const cached = await getKVWithResilience<NCAAGame[]>(
        env.KV,
        cacheKey,
        { type: 'json', timeoutMs: 3000, maxRetries: 1 }
      );

      if (cached) {
        return jsonResponse(
          {
            games: cached,
            meta: {
              cached: true,
              count: cached.length,
              date,
              lastUpdated: new Date().toISOString(),
              timezone: 'America/Chicago',
              dataSource: 'NCAA Stats API',
            },
          },
          { cached: true, origin, maxAge: 60 }
        );
      }
    } catch (error) {
      console.warn('[College Baseball] KV cache miss:', error);
    }

    // Fetch from NCAA API
    const adapter = createNCAAAdapter({
      apiKey: env.NCAA_API_KEY,
    });

    let games: NCAAGame[] = [];

    if (teamId) {
      // Fetch team schedule
      const season = new Date(date).getFullYear();
      games = await adapter.getTeamSchedule(teamId, season);

      // Filter by date
      games = games.filter((g) => {
        const gameDate = new Date(g.gameDate).toISOString().split('T')[0];
        return gameDate === date;
      });
    } else {
      // Fetch games for date
      games = await adapter.getGames(date);
    }

    // Apply filters
    if (conference) {
      games = games.filter(
        (g) =>
          g.homeTeam.conference === conference ||
          g.awayTeam.conference === conference
      );
    }

    if (status) {
      games = games.filter((g) => g.status === status);
    }

    // Store in D1 database
    await storeGamesInDatabase(env.DB, games);

    // Cache in KV
    try {
      await env.KV.put(
        cacheKey,
        JSON.stringify(games),
        { expirationTtl: 60 }
      );
    } catch (error) {
      console.warn('[College Baseball] Failed to cache in KV:', error);
    }

    return jsonResponse(
      {
        games,
        meta: {
          cached: false,
          count: games.length,
          date,
          filters: {
            teamId: teamId || null,
            conference: conference || null,
            status: status || null,
          },
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          dataSource: 'NCAA Stats API',
        },
      },
      { cached: false, origin, maxAge: 60 }
    );
  } catch (error: any) {
    console.error('[College Baseball] Failed to fetch games:', error);
    return errorResponse(
      `Failed to fetch games: ${error.message || 'Unknown error'}`,
      500,
      origin
    );
  }
}

/**
 * Get today's date in America/Chicago timezone (YYYY-MM-DD format)
 */
function getTodayInChicago(): string {
  const now = new Date();
  const chicagoTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Chicago' })
  );

  const year = chicagoTime.getFullYear();
  const month = String(chicagoTime.getMonth() + 1).padStart(2, '0');
  const day = String(chicagoTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Store games in D1 database
 */
async function storeGamesInDatabase(
  db: D1Database,
  games: NCAAGame[]
): Promise<void> {
  try {
    for (const game of games) {
      await queryD1WithResilience(
        db,
        `INSERT INTO games (
          id, home_team_id, away_team_id, game_date, venue, status,
          inning, home_score, away_score, attendance, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
        ON CONFLICT(id) DO UPDATE SET
          status = excluded.status,
          inning = excluded.inning,
          home_score = excluded.home_score,
          away_score = excluded.away_score,
          updated_at = unixepoch()`,
        [
          game.id,
          game.homeTeam.id,
          game.awayTeam.id,
          Math.floor(new Date(game.gameDate).getTime() / 1000),
          game.venue,
          game.status,
          game.inning || null,
          game.homeScore,
          game.awayScore,
          game.attendance || null,
        ],
        { timeoutMs: 5000, maxRetries: 1, operation: 'Store Game' }
      );
    }
  } catch (error) {
    console.warn('[College Baseball] Failed to store games in database:', error);
    // Don't throw - we still want to return the data
  }
}
