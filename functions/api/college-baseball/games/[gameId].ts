/**
 * College Baseball Game Box Score API Endpoint
 * GET /api/college-baseball/games/{gameId}
 *
 * Returns complete box score with batting lines, pitching lines, and line score
 * Fills the massive gap ESPN leaves by providing full college baseball box scores
 *
 * Data Source: NCAA Stats API
 * Timezone: America/Chicago
 * Cache: 30 seconds for live games, 5 minutes for final games
 */

import { createNCAAAdapter, NCAABoxScore } from '@adapters/ncaa-adapter';
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
 * GET /api/college-baseball/games/{gameId}
 * Fetch complete box score for a college baseball game
 */
export async function onRequestGet(context: any) {
  const origin = context.request.headers.get('Origin');
  const gameId = context.params.gameId;

  if (!gameId) {
    return errorResponse('Game ID is required', 400, origin);
  }

  try {
    const env = context.env as Env;

    // Check if game is in database
    const dbGame = await queryD1WithResilience<{
      id: string;
      status: string;
      home_team_id: string;
      away_team_id: string;
      game_date: number;
      home_score: number;
      away_score: number;
      venue: string;
    }>(
      env.DB,
      `SELECT id, status, home_team_id, away_team_id, game_date, home_score, away_score, venue
       FROM games
       WHERE id = ?`,
      [gameId],
      { timeoutMs: 5000, maxRetries: 2, operation: 'Fetch Game from D1' }
    );

    const existingGame = dbGame.results?.[0];

    // Determine cache TTL based on game status
    const isLive = existingGame?.status === 'in_progress';
    const isFinal = existingGame?.status === 'final';
    const cacheTTL = isLive ? 30 : isFinal ? 300 : 60;

    // Try to get from KV cache
    const cacheKey = `college-baseball:game:${gameId}`;
    let boxScore: NCAABoxScore | null = null;

    try {
      boxScore = await getKVWithResilience<NCAABoxScore>(
        env.KV,
        cacheKey,
        { type: 'json', timeoutMs: 3000, maxRetries: 1 }
      );

      if (boxScore) {
        return jsonResponse(
          {
            ...boxScore,
            meta: {
              cached: true,
              lastUpdated: new Date().toISOString(),
              timezone: 'America/Chicago',
              dataSource: 'NCAA Stats API',
            },
          },
          { cached: true, origin, maxAge: cacheTTL }
        );
      }
    } catch (error) {
      console.warn('[College Baseball] KV cache miss:', error);
    }

    // Fetch from NCAA API
    const adapter = createNCAAAdapter({
      apiKey: env.NCAA_API_KEY,
    });

    boxScore = await adapter.getGame(gameId);

    // Store box score in D1 database
    await storeGameInDatabase(env.DB, gameId, boxScore);

    // Cache in KV
    try {
      await env.KV.put(
        cacheKey,
        JSON.stringify(boxScore),
        { expirationTtl: cacheTTL }
      );
    } catch (error) {
      console.warn('[College Baseball] Failed to cache in KV:', error);
    }

    return jsonResponse(
      {
        ...boxScore,
        meta: {
          cached: false,
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          dataSource: 'NCAA Stats API',
        },
      },
      { cached: false, origin, maxAge: cacheTTL }
    );
  } catch (error: any) {
    console.error('[College Baseball] Failed to fetch game:', error);
    return errorResponse(
      `Failed to fetch game: ${error.message || 'Unknown error'}`,
      500,
      origin
    );
  }
}

/**
 * Store game and box score in D1 database
 */
async function storeGameInDatabase(
  db: D1Database,
  gameId: string,
  boxScore: NCAABoxScore
): Promise<void> {
  try {
    const { game, homeInnings, awayInnings, homeHits, awayHits, homeErrors, awayErrors } = boxScore;

    // Upsert game record
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
        gameId,
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
      { timeoutMs: 5000, maxRetries: 2, operation: 'Upsert Game' }
    );

    // Store batting stats for both teams
    for (const battingLine of boxScore.homeBatting) {
      await storeBattingStats(db, gameId, battingLine);
    }
    for (const battingLine of boxScore.awayBatting) {
      await storeBattingStats(db, gameId, battingLine);
    }

    // Store pitching stats for both teams
    for (const pitchingLine of boxScore.homePitching) {
      await storePitchingStats(db, gameId, pitchingLine);
    }
    for (const pitchingLine of boxScore.awayPitching) {
      await storePitchingStats(db, gameId, pitchingLine);
    }
  } catch (error) {
    console.error('[College Baseball] Failed to store game in database:', error);
    // Don't throw - we still want to return the data even if DB storage fails
  }
}

/**
 * Store batting stats for a player
 */
async function storeBattingStats(
  db: D1Database,
  gameId: string,
  batting: any
): Promise<void> {
  try {
    await queryD1WithResilience(
      db,
      `INSERT INTO batting_stats (
        id, game_id, player_id, at_bats, runs, hits, doubles, triples,
        home_runs, rbi, walks, strikeouts, stolen_bases, caught_stealing
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        at_bats = excluded.at_bats,
        runs = excluded.runs,
        hits = excluded.hits,
        doubles = excluded.doubles,
        triples = excluded.triples,
        home_runs = excluded.home_runs,
        rbi = excluded.rbi,
        walks = excluded.walks,
        strikeouts = excluded.strikeouts,
        stolen_bases = excluded.stolen_bases,
        caught_stealing = excluded.caught_stealing`,
      [
        `${gameId}-${batting.playerId}`,
        gameId,
        batting.playerId,
        batting.atBats,
        batting.runs,
        batting.hits,
        batting.doubles,
        batting.triples,
        batting.homeRuns,
        batting.rbi,
        batting.walks,
        batting.strikeouts,
        batting.stolenBases,
        batting.caughtStealing,
      ],
      { timeoutMs: 5000, maxRetries: 1, operation: 'Store Batting Stats' }
    );
  } catch (error) {
    console.warn('[College Baseball] Failed to store batting stats:', error);
  }
}

/**
 * Store pitching stats for a player
 */
async function storePitchingStats(
  db: D1Database,
  gameId: string,
  pitching: any
): Promise<void> {
  try {
    const win = pitching.decision === 'W';
    const loss = pitching.decision === 'L';
    const save = pitching.decision === 'S';

    await queryD1WithResilience(
      db,
      `INSERT INTO pitching_stats (
        id, game_id, player_id, innings_pitched, hits, runs, earned_runs,
        walks, strikeouts, home_runs_allowed, pitch_count, win, loss, save
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        innings_pitched = excluded.innings_pitched,
        hits = excluded.hits,
        runs = excluded.runs,
        earned_runs = excluded.earned_runs,
        walks = excluded.walks,
        strikeouts = excluded.strikeouts,
        home_runs_allowed = excluded.home_runs_allowed,
        pitch_count = excluded.pitch_count,
        win = excluded.win,
        loss = excluded.loss,
        save = excluded.save`,
      [
        `${gameId}-${pitching.playerId}`,
        gameId,
        pitching.playerId,
        parseFloat(pitching.inningsPitched || '0'),
        pitching.hits,
        pitching.runs,
        pitching.earnedRuns,
        pitching.walks,
        pitching.strikeouts,
        pitching.homeRunsAllowed,
        pitching.pitchCount,
        win ? 1 : 0,
        loss ? 1 : 0,
        save ? 1 : 0,
      ],
      { timeoutMs: 5000, maxRetries: 1, operation: 'Store Pitching Stats' }
    );
  } catch (error) {
    console.warn('[College Baseball] Failed to store pitching stats:', error);
  }
}
