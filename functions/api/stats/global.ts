/**
 * Global Statistics API Endpoint
 * GET /api/stats/global
 *
 * Returns overall game statistics:
 * - Active players online now
 * - Games played today/total
 * - Total home runs, hits, runs
 * - Top player
 * - Most popular stadium/character
 * - Average game length
 */

import {
  getCachedData,
  jsonResponse,
  errorResponse,
  handleOptions,
  CACHE_DURATIONS,
  formatTimestamp,
} from './_utils';
import {
  queryD1WithResilience,
  getKVWithResilience,
} from '../_resilience';

export interface GlobalStats {
  activePlayers: number;
  gamesToday: number;
  gamesTotal: number;
  totalHomeRuns: number;
  totalHits: number;
  totalRuns: number;
  topPlayer: {
    id: string;
    name: string;
    homeRuns: number;
  };
  mostPopularStadium: {
    id: string;
    name: string;
    usagePercent: number;
  };
  mostPopularCharacter: {
    id: string;
    name: string;
    usagePercent: number;
  };
  avgGameLength: number; // in seconds
  lastUpdated: string; // ISO timestamp
  timezone: string;
}

export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');

  try {
    const { data, cached } = await getCachedData<GlobalStats>(
      context.env.KV,
      {
        key: 'stats:global',
        ttl: CACHE_DURATIONS.GLOBAL_STATS,
      },
      async () => {
        // Get active players from KV (updated every 30 seconds by game clients)
        const activePlayersData = await getKVWithResilience<{ count: number }>(
          context.env.KV,
          'active_players',
          { type: 'json', timeoutMs: 5000, maxRetries: 2 }
        );
        const activePlayers = activePlayersData?.count || 0;

        // Get today's date in America/Chicago timezone
        const now = new Date();
        const chicagoNow = new Date(
          now.toLocaleString('en-US', { timeZone: 'America/Chicago' })
        );
        const todayStart = new Date(chicagoNow);
        todayStart.setHours(0, 0, 0, 0);

        // Query games played today (updated_at is Unix timestamp)
        const todayStartTimestamp = Math.floor(todayStart.getTime() / 1000);
        const gamesTodayResult = await queryD1WithResilience<{ count: number }>(
          context.env.DB,
          `SELECT COUNT(*) as count
           FROM player_progress
           WHERE updated_at >= ?`,
          [todayStartTimestamp],
          { timeoutMs: 10000, maxRetries: 3, operation: 'Games Today Query' }
        );

        const gamesToday = gamesTodayResult.results?.[0]?.count || 0;

        // Query total statistics
        const totalsResult = await queryD1WithResilience<{
          games_total: number;
          total_home_runs: number;
          total_hits: number;
          total_runs: number;
        }>(
          context.env.DB,
          `SELECT
            SUM(games_played) as games_total,
            SUM(total_home_runs) as total_home_runs,
            SUM(total_hits) as total_hits,
            SUM(total_runs) as total_runs
          FROM player_progress`,
          [],
          { timeoutMs: 10000, maxRetries: 3, operation: 'Total Stats Query' }
        );

        const totals = totalsResult.results?.[0];

        // Query top player by home runs
        const topPlayerResult = await queryD1WithResilience<{
          player_id: string;
          total_home_runs: number;
        }>(
          context.env.DB,
          `SELECT
            player_id,
            total_home_runs
          FROM player_progress
          ORDER BY total_home_runs DESC
          LIMIT 1`,
          [],
          { timeoutMs: 10000, maxRetries: 3, operation: 'Top Player Query' }
        );

        const topPlayer = topPlayerResult.results?.[0];

        // Get player name from leaderboard (if exists)
        let topPlayerName = 'Anonymous';
        if (topPlayer?.player_id) {
          const leaderboardEntry = await queryD1WithResilience<{ player_name: string }>(
            context.env.DB,
            `SELECT player_name
             FROM leaderboard
             WHERE player_id = ? AND stat_type = 'home_runs'
             ORDER BY recorded_at DESC
             LIMIT 1`,
            [topPlayer.player_id],
            { timeoutMs: 5000, maxRetries: 2, operation: 'Player Name Query' }
          );

          topPlayerName = leaderboardEntry.results?.[0]?.player_name || 'Anonymous';
        }

        // Get most popular stadium from KV
        const stadiumStatsData = await getKVWithResilience<any>(
          context.env.KV,
          'stats:stadiums',
          { type: 'json', timeoutMs: 5000, maxRetries: 2 }
        );
        const stadiumStats = stadiumStatsData || {
          mostPopular: {
            id: 'dusty_acres',
            name: 'Dusty Acres',
            usagePercent: 20,
          },
        };

        // Get most popular character from KV
        const characterStatsData = await getKVWithResilience<any>(
          context.env.KV,
          'stats:characters',
          { type: 'json', timeoutMs: 5000, maxRetries: 2 }
        );
        const characterStats = characterStatsData || {
          mostPopular: {
            id: 'rocket_rivera',
            name: 'Rocket Rivera',
            usagePercent: 15,
          },
        };

        // Calculate average game length (default 8.5 minutes if no data)
        const avgGameLengthData = await getKVWithResilience<string>(
          context.env.KV,
          'stats:avg_game_length',
          { type: 'text', timeoutMs: 5000, maxRetries: 2 }
        );
        const avgGameLength = avgGameLengthData
          ? parseFloat(avgGameLengthData)
          : 8.5 * 60; // 8.5 minutes in seconds

        return {
          activePlayers,
          gamesToday,
          gamesTotal: totals?.games_total || 0,
          totalHomeRuns: totals?.total_home_runs || 0,
          totalHits: totals?.total_hits || 0,
          totalRuns: totals?.total_runs || 0,
          topPlayer: {
            id: topPlayer?.player_id || '',
            name: topPlayerName,
            homeRuns: topPlayer?.total_home_runs || 0,
          },
          mostPopularStadium: stadiumStats.mostPopular,
          mostPopularCharacter: characterStats.mostPopular,
          avgGameLength,
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
        };
      }
    );

    return jsonResponse(data, {
      cached,
      origin,
      maxAge: CACHE_DURATIONS.GLOBAL_STATS,
    });
  } catch (error: any) {
    console.error('Global stats fetch error:', error);
    return errorResponse(
      'Failed to fetch global statistics',
      500,
      origin
    );
  }
}
