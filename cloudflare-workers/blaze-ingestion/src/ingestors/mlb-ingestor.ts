/**
 * MLB Data Ingestor
 *
 * Fetches games from MLB Stats API and stores in D1 database
 */

import type { Env } from '../index';

export interface IngestionResult {
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}

interface MLBGameData {
  gamePk: number;
  season: string;
  gameDate: string;
  status: {
    abstractGameState: string;
    codedGameState: string;
    detailedState: string;
  };
  teams: {
    home: {
      team: { id: number; name: string };
      score?: number;
    };
    away: {
      team: { id: number; name: string };
      score?: number;
    };
  };
  venue?: {
    name: string;
  };
}

export class MLBIngestor {
  constructor(private env: Env) {}

  /**
   * Ingest today's MLB games
   */
  async ingestTodaysGames(): Promise<IngestionResult> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Fetch games from MLB Stats API
      const response = await fetch(
        `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`,
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`MLB API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const games: MLBGameData[] = data.dates?.[0]?.games || [];

      console.log(`[MLB Ingestor] Found ${games.length} games for ${today}`);

      // Process each game
      for (const game of games) {
        try {
          const wasUpdated = await this.upsertGame(game);
          if (wasUpdated) {
            result.updated++;
          } else {
            result.inserted++;
          }
        } catch (error) {
          result.failed++;
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Game ${game.gamePk}: ${errorMsg}`);
          console.error(
            '[MLB Ingestor] Failed to upsert game:',
            game.gamePk,
            error
          );
        }
      }

      return result;
    } catch (error) {
      console.error('[MLB Ingestor] Failed to ingest games:', error);
      throw error;
    }
  }

  /**
   * Ingest games for a specific date range
   */
  async ingestDateRange(
    startDate: string,
    endDate: string
  ): Promise<IngestionResult> {
    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through each day in the range
    for (
      let current = new Date(start);
      current <= end;
      current.setDate(current.getDate() + 1)
    ) {
      const dateStr = current.toISOString().split('T')[0];

      try {
        const response = await fetch(
          `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${dateStr}`,
          {
            headers: {
              'User-Agent': 'BlazeSportsIntel/1.0',
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          console.warn(`[MLB Ingestor] API error for ${dateStr}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const games: MLBGameData[] = data.dates?.[0]?.games || [];

        for (const game of games) {
          try {
            const wasUpdated = await this.upsertGame(game);
            if (wasUpdated) {
              result.updated++;
            } else {
              result.inserted++;
            }
          } catch (error) {
            result.failed++;
            result.errors.push(
              `${dateStr} - Game ${game.gamePk}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        console.log(`[MLB Ingestor] Processed ${games.length} games for ${dateStr}`);
      } catch (error) {
        console.error(`[MLB Ingestor] Failed to fetch games for ${dateStr}:`, error);
        result.errors.push(`${dateStr}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Upsert a single game (insert or update if exists)
   * @returns true if updated, false if inserted
   */
  private async upsertGame(gameData: MLBGameData): Promise<boolean> {
    const gameId = `mlb-${gameData.gamePk}`;
    const seasonId = `mlb-${gameData.season}`;
    const homeTeamId = `mlb-${gameData.teams.home.team.id}`;
    const awayTeamId = `mlb-${gameData.teams.away.team.id}`;

    // Check if game already exists
    const existing = await this.env.BLAZE_DB.prepare(
      'SELECT id FROM games WHERE id = ?'
    )
      .bind(gameId)
      .first<{ id: string }>();

    const scheduledAt = Math.floor(new Date(gameData.gameDate).getTime() / 1000); // Unix timestamp (seconds)
    const status = this.mapGameStatus(gameData.status.abstractGameState);
    const homeScore = gameData.teams.home.score ?? null;
    const awayScore = gameData.teams.away.score ?? null;

    if (existing) {
      // Update existing game
      await this.env.BLAZE_DB.prepare(
        `UPDATE games
         SET status = ?, home_score = ?, away_score = ?,
             updated_at = unixepoch()
         WHERE id = ?`
      )
        .bind(status, homeScore, awayScore, gameId)
        .run();

      console.log(`[MLB Ingestor] Updated game ${gameId} (status: ${status})`);
      return true;
    } else {
      // Insert new game
      await this.env.BLAZE_DB.prepare(
        `INSERT INTO games
         (id, season_id, external_id, home_team_id, away_team_id,
          scheduled_at, status, home_score, away_score, venue_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          gameId,
          seasonId,
          String(gameData.gamePk),
          homeTeamId,
          awayTeamId,
          scheduledAt,
          status,
          homeScore,
          awayScore,
          gameData.venue?.name || null
        )
        .run();

      console.log(`[MLB Ingestor] Inserted game ${gameId}`);
      return false;
    }
  }

  /**
   * Map MLB API status to our internal status
   */
  private mapGameStatus(abstractGameState: string): string {
    switch (abstractGameState.toLowerCase()) {
      case 'preview':
        return 'scheduled';
      case 'live':
        return 'live';
      case 'final':
        return 'final';
      case 'postponed':
        return 'postponed';
      case 'cancelled':
        return 'cancelled';
      default:
        console.warn(
          `[MLB Ingestor] Unknown game state: ${abstractGameState}, defaulting to scheduled`
        );
        return 'scheduled';
    }
  }

  /**
   * Backfill historical data
   */
  async backfillSeason(season: number): Promise<IngestionResult> {
    console.log(`[MLB Ingestor] Starting backfill for ${season} season`);

    // MLB regular season typically runs April through September
    const startDate = `${season}-03-20`; // Spring training start
    const endDate = `${season}-11-01`; // End of World Series

    return await this.ingestDateRange(startDate, endDate);
  }
}
