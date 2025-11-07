/**
 * Stadium Statistics API Endpoint
 * GET /api/stats/stadiums?stadiumId=[id]
 *
 * Returns stadium usage statistics:
 * - Total games played per stadium
 * - Average scoring per stadium
 * - Home run rates per stadium
 * - Most popular stadiums
 */

import {
  getCachedData,
  jsonResponse,
  errorResponse,
  handleOptions,
  CACHE_DURATIONS,
} from './_utils';
import {
  queryD1WithResilience,
  getKVWithResilience,
} from '../_resilience';

export interface StadiumStats {
  stadiumId: string;
  stadiumName: string;
  gamesPlayed: number;
  usagePercent: number;
  avgHomeRuns: number;
  avgTotalRuns: number;
  avgHits: number;
  homeRunRate: number; // Home runs per game
}

export interface StadiumsResponse {
  stadiums: StadiumStats[];
  mostPopular: StadiumStats | null;
  totalGames: number;
  metadata: {
    lastUpdated: string;
    timezone: string;
  };
}

// Stadium roster from the game
const STADIUM_NAMES: Record<string, string> = {
  dusty_acres: 'Dusty Acres',
  greenfield_park: 'Greenfield Park',
  sunset_stadium: 'Sunset Stadium',
  riverside_grounds: 'Riverside Grounds',
  mountain_view_field: 'Mountain View Field',
};

export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');
  const url = new URL(context.request.url);
  const stadiumId = url.searchParams.get('stadiumId');

  try {
    // If specific stadium requested, return just that stadium's stats
    if (stadiumId) {
      const { data, cached } = await getCachedData<StadiumStats>(
        context.env.KV,
        {
          key: `stadium:${stadiumId}`,
          ttl: CACHE_DURATIONS.STADIUM_STATS,
        },
        async () => {
          const stadiumStatsResult = await queryD1WithResilience<{
            games_played: number;
            avg_home_runs: number;
            avg_runs: number;
            avg_hits: number;
          }>(
            context.env.DB,
            `SELECT
              COUNT(*) as games_played,
              AVG(total_home_runs) as avg_home_runs,
              AVG(total_runs) as avg_runs,
              AVG(total_hits) as avg_hits
            FROM player_progress
            WHERE player_id LIKE ?`,
            [`%${stadiumId}%`],
            { timeoutMs: 10000, maxRetries: 3, operation: 'Stadium Stats Query' }
          );

          const stadiumStats = stadiumStatsResult.results?.[0];

          if (!stadiumStats || stadiumStats.games_played === 0) {
            throw new Error('Stadium not found or no games played');
          }

          // Get total games for usage percentage
          const totalGamesResult = await queryD1WithResilience<{ total: number }>(
            context.env.DB,
            `SELECT SUM(games_played) as total FROM player_progress`,
            [],
            { timeoutMs: 10000, maxRetries: 3, operation: 'Total Games Query' }
          );

          const totalGames = totalGamesResult.results?.[0]?.total || 1;
          const gamesPlayed = stadiumStats.games_played || 0;

          return {
            stadiumId,
            stadiumName: STADIUM_NAMES[stadiumId] || stadiumId,
            gamesPlayed,
            usagePercent: (gamesPlayed / totalGames) * 100,
            avgHomeRuns: parseFloat(String(stadiumStats.avg_home_runs || 0)),
            avgTotalRuns: parseFloat(String(stadiumStats.avg_runs || 0)),
            avgHits: parseFloat(String(stadiumStats.avg_hits || 0)),
            homeRunRate: parseFloat(String(stadiumStats.avg_home_runs || 0)),
          };
        }
      );

      return jsonResponse(data, {
        cached,
        origin,
        maxAge: CACHE_DURATIONS.STADIUM_STATS,
      });
    }

    // Return all stadiums' stats
    const { data, cached } = await getCachedData<StadiumsResponse>(
      context.env.KV,
      {
        key: 'stats:stadiums:all',
        ttl: CACHE_DURATIONS.STADIUM_STATS,
      },
      async () => {
        // Get stadium usage from KV (updated by game clients)
        const stadiumUsageData = await getKVWithResilience<any>(
          context.env.KV,
          'stats:stadiums',
          { type: 'json', timeoutMs: 5000, maxRetries: 2 }
        );

        // If we have cached stadium data from game clients, use it
        if (stadiumUsageData && stadiumUsageData.stadiums) {
          return stadiumUsageData;
        }

        // Otherwise, compute from database
        const totalGamesResult = await queryD1WithResilience<{ total: number }>(
          context.env.DB,
          `SELECT SUM(games_played) as total FROM player_progress`,
          [],
          { timeoutMs: 10000, maxRetries: 3, operation: 'Total Games Query' }
        );

        const totalGames = totalGamesResult.results?.[0]?.total || 0;

        // Get stats for each stadium
        const stadiumStats: StadiumStats[] = [];

        for (const [id, name] of Object.entries(STADIUM_NAMES)) {
          const statsResult = await queryD1WithResilience<{
            games_played: number;
            avg_home_runs: number;
            avg_runs: number;
            avg_hits: number;
          }>(
            context.env.DB,
            `SELECT
              COUNT(*) as games_played,
              AVG(total_home_runs) as avg_home_runs,
              AVG(total_runs) as avg_runs,
              AVG(total_hits) as avg_hits
            FROM player_progress
            WHERE player_id LIKE ?`,
            [`%${id}%`],
            { timeoutMs: 10000, maxRetries: 3, operation: `Stadium ${id} Stats Query` }
          );

          const stats = statsResult.results?.[0];
          const gamesPlayed = stats?.games_played || 0;

          if (gamesPlayed > 0) {
            stadiumStats.push({
              stadiumId: id,
              stadiumName: name,
              gamesPlayed,
              usagePercent: totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0,
              avgHomeRuns: parseFloat(String(stats?.avg_home_runs || 0)),
              avgTotalRuns: parseFloat(String(stats?.avg_runs || 0)),
              avgHits: parseFloat(String(stats?.avg_hits || 0)),
              homeRunRate: parseFloat(String(stats?.avg_home_runs || 0)),
            });
          }
        }

        // Sort by usage (most popular first)
        stadiumStats.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

        // Find most popular stadium
        const mostPopular = stadiumStats.length > 0 ? stadiumStats[0] : null;

        return {
          stadiums: stadiumStats,
          mostPopular,
          totalGames,
          metadata: {
            lastUpdated: new Date().toISOString(),
            timezone: 'America/Chicago',
          },
        };
      }
    );

    return jsonResponse(data, {
      cached,
      origin,
      maxAge: CACHE_DURATIONS.STADIUM_STATS,
    });
  } catch (error: any) {
    console.error('Stadium stats fetch error:', error);
    return errorResponse(
      error.message || 'Failed to fetch stadium statistics',
      error.message === 'Stadium not found or no games played' ? 404 : 500,
      origin
    );
  }
}
