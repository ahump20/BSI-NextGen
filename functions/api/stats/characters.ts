/**
 * Character Statistics API Endpoint
 * GET /api/stats/characters?characterId=[id]
 *
 * Returns character usage statistics:
 * - Total games played per character
 * - Win rates per character
 * - Average stats (home runs, hits, etc.)
 * - Most popular characters
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

export interface CharacterStats {
  characterId: string;
  characterName: string;
  gamesPlayed: number;
  winRate: number;
  usagePercent: number;
  avgHomeRuns: number;
  avgHits: number;
  avgRuns: number;
  avgBattingAverage: number;
}

export interface CharactersResponse {
  characters: CharacterStats[];
  mostPopular: CharacterStats | null;
  totalGames: number;
  metadata: {
    lastUpdated: string;
    timezone: string;
  };
}

// Character roster from the game
const CHARACTER_NAMES: Record<string, string> = {
  rocket_rivera: 'Rocket Rivera',
  slugger_smith: 'Slugger Smith',
  speedy_gonzalez: 'Speedy Gonzalez',
  power_pete: 'Power Pete',
  ace_anderson: 'Ace Anderson',
  lightning_lopez: 'Lightning Lopez',
  bomber_brown: 'Bomber Brown',
  flash_fitzgerald: 'Flash Fitzgerald',
  crusher_cruz: 'Crusher Cruz',
  thunder_thompson: 'Thunder Thompson',
};

export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');
  const url = new URL(context.request.url);
  const characterId = url.searchParams.get('characterId');

  try {
    // If specific character requested, return just that character's stats
    if (characterId) {
      const { data, cached } = await getCachedData<CharacterStats>(
        context.env.KV,
        {
          key: `character:${characterId}`,
          ttl: CACHE_DURATIONS.CHARACTER_STATS,
        },
        async () => {
          const characterStatsResult = await queryD1WithResilience<{
            games_played: number;
            wins: number;
            avg_home_runs: number;
            avg_hits: number;
            avg_runs: number;
            avg_batting_avg: number;
          }>(
            context.env.DB,
            `SELECT
              SUM(games_played) as games_played,
              SUM(wins) as wins,
              AVG(total_home_runs) as avg_home_runs,
              AVG(total_hits) as avg_hits,
              AVG(total_runs) as avg_runs,
              AVG(CAST(total_hits AS REAL) / NULLIF(games_played, 0)) as avg_batting_avg
            FROM player_progress
            WHERE player_id LIKE ?`,
            [`%${characterId}%`],
            { timeoutMs: 10000, maxRetries: 3, operation: 'Character Stats Query' }
          );

          const characterStats = characterStatsResult.results?.[0];

          if (!characterStats || characterStats.games_played === 0) {
            throw new Error('Character not found or no games played');
          }

          // Get total games for usage percentage
          const totalGamesResult = await queryD1WithResilience<{ total: number }>(
            context.env.DB,
            `SELECT SUM(games_played) as total FROM player_progress`,
            [],
            { timeoutMs: 10000, maxRetries: 3, operation: 'Total Games Query' }
          );

          const totalGames = totalGamesResult.results?.[0]?.total || 1;
          const gamesPlayed = characterStats.games_played || 0;
          const wins = characterStats.wins || 0;

          return {
            characterId,
            characterName: CHARACTER_NAMES[characterId] || characterId,
            gamesPlayed,
            winRate: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
            usagePercent: (gamesPlayed / totalGames) * 100,
            avgHomeRuns: parseFloat(String(characterStats.avg_home_runs || 0)),
            avgHits: parseFloat(String(characterStats.avg_hits || 0)),
            avgRuns: parseFloat(String(characterStats.avg_runs || 0)),
            avgBattingAverage: parseFloat(String(characterStats.avg_batting_avg || 0)),
          };
        }
      );

      return jsonResponse(data, {
        cached,
        origin,
        maxAge: CACHE_DURATIONS.CHARACTER_STATS,
      });
    }

    // Return all characters' stats
    const { data, cached } = await getCachedData<CharactersResponse>(
      context.env.KV,
      {
        key: 'stats:characters:all',
        ttl: CACHE_DURATIONS.CHARACTER_STATS,
      },
      async () => {
        // Get character usage from KV (updated by game clients)
        const characterUsageData = await getKVWithResilience<any>(
          context.env.KV,
          'stats:characters',
          { type: 'json', timeoutMs: 5000, maxRetries: 2 }
        );

        // If we have cached character data from game clients, use it
        if (characterUsageData && characterUsageData.characters) {
          return characterUsageData;
        }

        // Otherwise, compute from database
        const totalGamesResult = await queryD1WithResilience<{ total: number }>(
          context.env.DB,
          `SELECT SUM(games_played) as total FROM player_progress`,
          [],
          { timeoutMs: 10000, maxRetries: 3, operation: 'Total Games Query' }
        );

        const totalGames = totalGamesResult.results?.[0]?.total || 0;

        // Get stats for each character
        const characterStats: CharacterStats[] = [];

        for (const [id, name] of Object.entries(CHARACTER_NAMES)) {
          const statsResult = await queryD1WithResilience<{
            games_played: number;
            wins: number;
            avg_home_runs: number;
            avg_hits: number;
            avg_runs: number;
            avg_batting_avg: number;
          }>(
            context.env.DB,
            `SELECT
              SUM(games_played) as games_played,
              SUM(wins) as wins,
              AVG(total_home_runs) as avg_home_runs,
              AVG(total_hits) as avg_hits,
              AVG(total_runs) as avg_runs,
              AVG(CAST(total_hits AS REAL) / NULLIF(games_played, 0)) as avg_batting_avg
            FROM player_progress
            WHERE player_id LIKE ?`,
            [`%${id}%`],
            { timeoutMs: 10000, maxRetries: 3, operation: `Character ${id} Stats Query` }
          );

          const stats = statsResult.results?.[0];
          const gamesPlayed = stats?.games_played || 0;
          const wins = stats?.wins || 0;

          if (gamesPlayed > 0) {
            characterStats.push({
              characterId: id,
              characterName: name,
              gamesPlayed,
              winRate: (wins / gamesPlayed) * 100,
              usagePercent: totalGames > 0 ? (gamesPlayed / totalGames) * 100 : 0,
              avgHomeRuns: parseFloat(String(stats?.avg_home_runs || 0)),
              avgHits: parseFloat(String(stats?.avg_hits || 0)),
              avgRuns: parseFloat(String(stats?.avg_runs || 0)),
              avgBattingAverage: parseFloat(String(stats?.avg_batting_avg || 0)),
            });
          }
        }

        // Sort by usage (most popular first)
        characterStats.sort((a, b) => b.gamesPlayed - a.gamesPlayed);

        // Find most popular character
        const mostPopular = characterStats.length > 0 ? characterStats[0] : null;

        return {
          characters: characterStats,
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
      maxAge: CACHE_DURATIONS.CHARACTER_STATS,
    });
  } catch (error: any) {
    console.error('Character stats fetch error:', error);
    return errorResponse(
      error.message || 'Failed to fetch character statistics',
      error.message === 'Character not found or no games played' ? 404 : 500,
      origin
    );
  }
}
