/**
 * NBA Data Ingestor
 *
 * Fetches games from SportsDataIO NBA API and stores in D1 database
 */

import type { Env } from '../index';
import type { IngestionResult } from './mlb-ingestor';

interface NBAGameData {
  GameID: number;
  Season: number;
  SeasonType: number;
  Status: string;
  Day: string;
  DateTime: string;
  HomeTeamID: number;
  AwayTeamID: number;
  HomeTeam: string;
  AwayTeam: string;
  HomeTeamScore: number | null;
  AwayTeamScore: number | null;
  Stadium?: {
    Name?: string;
  };
  Attendance: number | null;
  Quarter: string | null;
}

export class NBAIngestor {
  constructor(private env: Env) {}

  /**
   * Ingest today's NBA games
   */
  async ingestTodaysGames(): Promise<IngestionResult> {
    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(`[NBA Ingestor] Fetching games for ${today}`);

      // Fetch games from SportsDataIO
      const response = await fetch(
        `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${today}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.env.SPORTSDATAIO_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`SportsDataIO API returned ${response.status}: ${response.statusText}`);
      }

      const games: NBAGameData[] = await response.json();

      console.log(`[NBA Ingestor] Found ${games.length} games for ${today}`);

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
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Game ${game.GameID}: ${errorMsg}`);
          console.error('[NBA Ingestor] Failed to upsert game:', game.GameID, error);
        }
      }

      return result;
    } catch (error) {
      console.error('[NBA Ingestor] Failed to ingest games:', error);
      throw error;
    }
  }

  /**
   * Upsert a single game
   * @returns true if updated, false if inserted
   */
  private async upsertGame(gameData: NBAGameData): Promise<boolean> {
    const gameId = `nba-${gameData.GameID}`;
    const seasonId = `nba-${gameData.Season}`;
    const homeTeamId = `nba-${gameData.HomeTeamID}`;
    const awayTeamId = `nba-${gameData.AwayTeamID}`;

    // Check if game exists
    const existing = await this.env.BLAZE_DB.prepare(
      'SELECT id FROM games WHERE id = ?'
    )
      .bind(gameId)
      .first<{ id: string }>();

    const scheduledAt = Math.floor(new Date(gameData.DateTime).getTime() / 1000);
    const status = this.mapGameStatus(gameData.Status);
    const homeScore = gameData.HomeTeamScore ?? null;
    const awayScore = gameData.AwayTeamScore ?? null;

    if (existing) {
      // Update existing game
      await this.env.BLAZE_DB.prepare(
        `UPDATE games
         SET status = ?, home_score = ?, away_score = ?,
             attendance = ?, updated_at = unixepoch()
         WHERE id = ?`
      )
        .bind(status, homeScore, awayScore, gameData.Attendance, gameId)
        .run();

      console.log(`[NBA Ingestor] Updated game ${gameId} (status: ${status}, quarter: ${gameData.Quarter})`);
      return true;
    } else {
      // Insert new game
      await this.env.BLAZE_DB.prepare(
        `INSERT INTO games
         (id, season_id, external_id, home_team_id, away_team_id,
          scheduled_at, status, home_score, away_score, venue_name, attendance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
        .bind(
          gameId,
          seasonId,
          String(gameData.GameID),
          homeTeamId,
          awayTeamId,
          scheduledAt,
          status,
          homeScore,
          awayScore,
          gameData.Stadium?.Name || null,
          gameData.Attendance
        )
        .run();

      console.log(`[NBA Ingestor] Inserted game ${gameId}`);
      return false;
    }
  }

  /**
   * Map SportsDataIO status to our internal status
   */
  private mapGameStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'scheduled';
      case 'inprogress':
        return 'live';
      case 'final':
      case 'f/ot':
        return 'final';
      case 'postponed':
        return 'postponed';
      case 'canceled':
        return 'cancelled';
      default:
        console.warn(`[NBA Ingestor] Unknown status: ${status}, defaulting to scheduled`);
        return 'scheduled';
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
          `https://api.sportsdata.io/v3/nba/scores/json/GamesByDate/${dateStr}`,
          {
            headers: {
              'Ocp-Apim-Subscription-Key': this.env.SPORTSDATAIO_API_KEY,
            },
          }
        );

        if (!response.ok) {
          console.warn(`[NBA Ingestor] API error for ${dateStr}: ${response.status}`);
          continue;
        }

        const games: NBAGameData[] = await response.json();

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
              `${dateStr} - Game ${game.GameID}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        console.log(`[NBA Ingestor] Processed ${games.length} games for ${dateStr}`);
      } catch (error) {
        console.error(`[NBA Ingestor] Failed to fetch games for ${dateStr}:`, error);
        result.errors.push(`${dateStr}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return result;
  }

  /**
   * Backfill entire season
   */
  async backfillSeason(season: number): Promise<IngestionResult> {
    console.log(`[NBA Ingestor] Starting backfill for ${season}-${season + 1} season`);

    // NBA season typically runs October through June
    const startDate = `${season}-10-01`;
    const endDate = `${season + 1}-06-30`;

    return await this.ingestDateRange(startDate, endDate);
  }
}
