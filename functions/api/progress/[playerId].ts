interface Env {
  DB: D1Database;
  KV: KVNamespace;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { playerId } = context.params;

  const result = await context.env.DB.prepare(
    "SELECT * FROM player_progress WHERE player_id = ?"
  ).bind(playerId).first();

  if (!result) {
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
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
};

export const onRequestPatch: PagesFunction<Env> = async (context) => {
  const { playerId } = context.params;
  const updates = await context.request.json() as any;

  await context.env.DB.prepare(`
    UPDATE player_progress
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
    WHERE player_id = ?
  `).bind(
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
  ).run();

  const result = await context.env.DB.prepare(
    "SELECT * FROM player_progress WHERE player_id = ?"
  ).bind(playerId).first();

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" }
  });
};
