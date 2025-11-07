/**
 * Leaderboard API Endpoint
 * GET /api/stats/leaderboard/[stat]?limit=50&offset=0
 *
 * Supported stats:
 * - home_runs
 * - wins
 * - batting_avg
 * - total_hits
 * - total_runs
 * - games_played
 * - experience
 */

import {
  getCachedData,
  jsonResponse,
  errorResponse,
  handleOptions,
  CACHE_DURATIONS,
} from '../_utils';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  recordedAt: string;
}

const VALID_STATS = [
  'home_runs',
  'wins',
  'batting_avg',
  'total_hits',
  'total_runs',
  'games_played',
  'experience',
] as const;

const STAT_TO_COLUMN: Record<string, string> = {
  home_runs: 'total_home_runs',
  wins: 'wins',
  batting_avg: '(CAST(total_hits AS REAL) / NULLIF(games_played, 0))',
  total_hits: 'total_hits',
  total_runs: 'total_runs',
  games_played: 'games_played',
  experience: 'experience',
};

export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');
  const url = new URL(context.request.url);

  // Get stat type from route params or query
  const statType =
    context.params.stat ||
    url.searchParams.get('stat') ||
    'home_runs';

  // Validate stat type
  if (!VALID_STATS.includes(statType as any)) {
    return errorResponse(
      `Invalid stat type. Must be one of: ${VALID_STATS.join(', ')}`,
      400,
      origin
    );
  }

  // Get pagination params
  const limit = Math.min(
    parseInt(url.searchParams.get('limit') || '50'),
    100
  );
  const offset = Math.max(
    parseInt(url.searchParams.get('offset') || '0'),
    0
  );

  try {
    const { data, cached } = await getCachedData<LeaderboardEntry[]>(
      context.env.KV,
      {
        key: `leaderboard:${statType}:${limit}:${offset}`,
        ttl: CACHE_DURATIONS.LEADERBOARD,
      },
      async () => {
        const column = STAT_TO_COLUMN[statType];

        // First, try to get from leaderboard table (for named players)
        const leaderboardResults = await context.env.DB.prepare(`
          SELECT
            l.player_id,
            l.player_name,
            l.stat_value as value,
            l.recorded_at
          FROM leaderboard l
          WHERE l.stat_type = ?
          ORDER BY l.stat_value DESC
          LIMIT ? OFFSET ?
        `)
          .bind(statType, limit, offset)
          .all();

        // If leaderboard has entries, use those
        if (leaderboardResults.results && leaderboardResults.results.length > 0) {
          return leaderboardResults.results.map((row: any, index: number) => ({
            rank: offset + index + 1,
            playerId: row.player_id,
            playerName: row.player_name || 'Anonymous',
            value: parseFloat(row.value),
            recordedAt: row.recorded_at,
          }));
        }

        // Otherwise, fall back to player_progress table
        const progressResults = await context.env.DB.prepare(`
          SELECT
            player_id,
            ${column} as value,
            updated_at as recorded_at
          FROM player_progress
          WHERE ${column} > 0
          ORDER BY ${column} DESC
          LIMIT ? OFFSET ?
        `)
          .bind(limit, offset)
          .all();

        return (progressResults.results || []).map((row: any, index: number) => ({
          rank: offset + index + 1,
          playerId: row.player_id,
          playerName: 'Anonymous', // No name in progress table
          value: parseFloat(row.value || 0),
          recordedAt: row.recorded_at,
        }));
      }
    );

    return jsonResponse(
      {
        stat: statType,
        limit,
        offset,
        entries: data,
        metadata: {
          totalEntries: data.length,
          hasMore: data.length === limit,
        },
      },
      {
        cached,
        origin,
        maxAge: CACHE_DURATIONS.LEADERBOARD,
      }
    );
  } catch (error: any) {
    console.error('Leaderboard fetch error:', error);
    return errorResponse(
      'Failed to fetch leaderboard data',
      500,
      origin
    );
  }
}
