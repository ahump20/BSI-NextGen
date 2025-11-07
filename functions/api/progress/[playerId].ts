import { getCorsHeaders, errorResponse } from '../stats/_utils';
import { queryD1WithResilience } from '../_resilience';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { playerId } = context.params;
  const origin = context.request.headers.get('Origin');

  try {
    const result = await queryD1WithResilience<any>(
      context.env.DB,
      "SELECT * FROM player_progress WHERE player_id = ?",
      [playerId as string],
      { timeoutMs: 10000, maxRetries: 3, operation: 'Get Player Progress' }
    );

    const playerData = result.results?.[0];

    if (!playerData) {
      return new Response(JSON.stringify({
        playerId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        totalRuns: 0,
        totalHits: 0,
        totalHomeRuns: 0,
        unlockedCharacters: [],
        unlockedStadiums: [],
        currentLevel: 1,
        experience: 0
      }), {
        headers: getCorsHeaders(origin)
      });
    }

    return new Response(JSON.stringify(playerData), {
      headers: getCorsHeaders(origin)
    });
  } catch (error: any) {
    console.error('Get player progress error:', error);
    return errorResponse(
      error.message || 'Failed to get player progress',
      500,
      origin
    );
  }
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { playerId } = context.params;
  const origin = context.request.headers.get('Origin');

  try {
    const updates = await context.request.json() as any;

    await queryD1WithResilience(
      context.env.DB,
      `UPDATE player_progress
       SET games_played = ?,
           wins = ?,
           losses = ?,
           total_runs = ?,
           total_hits = ?,
           total_home_runs = ?,
           unlocked_characters = ?,
           unlocked_stadiums = ?,
           current_level = ?,
           experience = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE player_id = ?`,
      [
        updates.gamesPlayed,
        updates.wins,
        updates.losses,
        updates.totalRuns,
        updates.totalHits,
        updates.totalHomeRuns,
        JSON.stringify(updates.unlockedCharacters),
        JSON.stringify(updates.unlockedStadiums),
        updates.currentLevel,
        updates.experience,
        playerId
      ],
      { timeoutMs: 10000, maxRetries: 3, operation: 'Update Player Progress' }
    );

    const result = await queryD1WithResilience<any>(
      context.env.DB,
      "SELECT * FROM player_progress WHERE player_id = ?",
      [playerId as string],
      { timeoutMs: 10000, maxRetries: 3, operation: 'Get Updated Player Progress' }
    );

    return new Response(JSON.stringify(result.results?.[0]), {
      headers: getCorsHeaders(origin)
    });
  } catch (error: any) {
    console.error('Update player progress error:', error);
    return errorResponse(
      error.message || 'Failed to update player progress',
      500,
      origin
    );
  }
};

// Handle OPTIONS for CORS
export const onRequestOptions: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin');
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};
