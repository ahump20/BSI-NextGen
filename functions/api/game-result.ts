/**
 * Game Result API Endpoint
 * POST /api/game-result
 *
 * Records a completed game result and updates player progression:
 * - Increments games_played
 * - Updates wins/losses
 * - Adds stats (runs, hits, home runs)
 * - Awards experience points
 * - Checks for level ups
 */

import { getCorsHeaders, errorResponse } from './stats/_utils';

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

interface GameResult {
  playerId: string;
  won: boolean;
  runsScored: number;
  hitsRecorded: number;
  homeRunsHit: number;
}

// Experience calculation constants
const BASE_XP = 100; // XP for completing a game
const WIN_BONUS = 50; // Extra XP for winning
const RUN_XP = 5; // XP per run scored
const HIT_XP = 3; // XP per hit
const HR_XP = 10; // XP per home run
const LEVEL_THRESHOLD = 1000; // XP needed per level

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const origin = context.request.headers.get('Origin');

  try {
    const body = await context.request.json() as GameResult;
    const { playerId, won, runsScored, hitsRecorded, homeRunsHit } = body;

    // Validate input
    if (!playerId) {
      return errorResponse("playerId is required", 400, origin);
    }

    // Check if player exists
    let player = await context.env.DB.prepare(
      "SELECT * FROM player_progress WHERE player_id = ?"
    )
      .bind(playerId)
      .first();

    // Create new player record if doesn't exist
    if (!player) {
      await context.env.DB.prepare(`
        INSERT INTO player_progress (
          player_id, games_played, wins, losses, total_runs, total_hits,
          total_home_runs, unlocked_characters, unlocked_stadiums,
          current_level, experience
        ) VALUES (?, 0, 0, 0, 0, 0, 0, '[]', '[]', 1, 0)
      `)
        .bind(playerId)
        .run();

      // Fetch the newly created player
      player = await context.env.DB.prepare(
        "SELECT * FROM player_progress WHERE player_id = ?"
      )
        .bind(playerId)
        .first();
    }

    // Ensure player exists after creation
    if (!player) {
      return errorResponse("Failed to create or retrieve player", 500, origin);
    }

    // Calculate experience gained
    let xpGained = BASE_XP;
    xpGained += won ? WIN_BONUS : 0;
    xpGained += runsScored * RUN_XP;
    xpGained += hitsRecorded * HIT_XP;
    xpGained += homeRunsHit * HR_XP;

    // Calculate new totals
    const newGamesPlayed = (player.games_played as number) + 1;
    const newWins = (player.wins as number) + (won ? 1 : 0);
    const newLosses = (player.losses as number) + (won ? 0 : 1);
    const newTotalRuns = (player.total_runs as number) + runsScored;
    const newTotalHits = (player.total_hits as number) + hitsRecorded;
    const newTotalHomeRuns = (player.total_home_runs as number) + homeRunsHit;
    const newExperience = (player.experience as number) + xpGained;

    // Calculate level ups
    let newLevel = player.current_level as number;
    let remainingXP = newExperience;

    while (remainingXP >= LEVEL_THRESHOLD) {
      newLevel++;
      remainingXP -= LEVEL_THRESHOLD;
    }

    // Update player progress
    await context.env.DB.prepare(`
      UPDATE player_progress
      SET games_played = ?,
          wins = ?,
          losses = ?,
          total_runs = ?,
          total_hits = ?,
          total_home_runs = ?,
          current_level = ?,
          experience = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE player_id = ?
    `)
      .bind(
        newGamesPlayed,
        newWins,
        newLosses,
        newTotalRuns,
        newTotalHits,
        newTotalHomeRuns,
        newLevel,
        newExperience,
        playerId
      )
      .run();

    // Fetch updated player progress
    const updatedPlayer = await context.env.DB.prepare(
      "SELECT * FROM player_progress WHERE player_id = ?"
    )
      .bind(playerId)
      .first();

    // Parse JSON fields
    const response = {
      ...updatedPlayer,
      unlocked_characters: JSON.parse((updatedPlayer?.unlocked_characters as string) || "[]"),
      unlocked_stadiums: JSON.parse((updatedPlayer?.unlocked_stadiums as string) || "[]"),
      xp_gained: xpGained,
      leveled_up: newLevel > (player.current_level as number),
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: getCorsHeaders(origin),
    });
  } catch (error: any) {
    console.error("Game result submission error:", error);
    return errorResponse(
      error.message || "Failed to record game result",
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
