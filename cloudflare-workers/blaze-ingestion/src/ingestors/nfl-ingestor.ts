/**
 * NFL Data Ingestor
 *
 * Fetches games from SportsDataIO NFL API and stores in D1 database
 */

import type { Env } from '../index';
import type { IngestionResult } from './mlb-ingestor';

interface NFLGameData {
  GameID: number;
  Season: number;
  Week: number;
  Date: string;
  Status: string;
  HomeTeamID: number;
  AwayTeamID: number;
  HomeTeam: string;
  AwayTeam: string;
  HomeScore: number | null;
  AwayScore: number | null;
  StadiumDetails?: {
    Name?: string;
  };
}

export class NFLIngestor {
  constructor(private env: Env) {}

  /**
   * Ingest current week's NFL games
   */
  async ingestCurrentWeek(): Promise<IngestionResult> {
    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    try {
      // Get current season and week
      const currentSeason = this.getCurrentSeason();
      const currentWeek = this.getCurrentWeek();

      console.log(`[NFL Ingestor] Fetching games for ${currentSeason} Week ${currentWeek}`);

      // Fetch games from SportsDataIO
      const response = await fetch(
        `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${currentSeason}/${currentWeek}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.env.SPORTSDATAIO_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`SportsDataIO API returned ${response.status}: ${response.statusText}`);
      }

      const games: NFLGameData[] = await response.json();

      console.log(`[NFL Ingestor] Found ${games.length} games for Week ${currentWeek}`);

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
          console.error('[NFL Ingestor] Failed to upsert game:', game.GameID, error);
        }
      }

      return result;
    } catch (error) {
      console.error('[NFL Ingestor] Failed to ingest games:', error);
      throw error;
    }
  }

  /**
   * Upsert a single game
   * @returns true if updated, false if inserted
   */
  private async upsertGame(gameData: NFLGameData): Promise<boolean> {
    const gameId = `nfl-${gameData.GameID}`;
    const seasonId = `nfl-${gameData.Season}`;
    const homeTeamId = `nfl-${gameData.HomeTeamID}`;
    const awayTeamId = `nfl-${gameData.AwayTeamID}`;

    // Check if game exists
    const existing = await this.env.BLAZE_DB.prepare(
      'SELECT id FROM games WHERE id = ?'
    )
      .bind(gameId)
      .first<{ id: string }>();

    const scheduledAt = Math.floor(new Date(gameData.Date).getTime() / 1000);
    const status = this.mapGameStatus(gameData.Status);
    const homeScore = gameData.HomeScore ?? null;
    const awayScore = gameData.AwayScore ?? null;

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

      console.log(`[NFL Ingestor] Updated game ${gameId} (status: ${status})`);
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
          String(gameData.GameID),
          homeTeamId,
          awayTeamId,
          scheduledAt,
          status,
          homeScore,
          awayScore,
          gameData.StadiumDetails?.Name || null
        )
        .run();

      console.log(`[NFL Ingestor] Inserted game ${gameId}`);
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
        console.warn(`[NFL Ingestor] Unknown status: ${status}, defaulting to scheduled`);
        return 'scheduled';
    }
  }

  /**
   * Get current NFL season year
   * NFL seasons span calendar years (Sep-Feb), so we use the year the season started
   */
  private getCurrentSeason(): number {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    // NFL season runs Sep-Feb
    // If Jan-Jul, use previous year; Aug-Dec use current year
    return month < 7 ? now.getFullYear() - 1 : now.getFullYear();
  }

  /**
   * Get current NFL week (simplified - should account for playoffs)
   */
  private getCurrentWeek(): number {
    const now = new Date();
    const currentSeason = this.getCurrentSeason();
    const seasonStart = new Date(`${currentSeason}-09-04`); // NFL season typically starts early September

    if (now < seasonStart) {
      return 1; // Preseason
    }

    const weeksSinceStart = Math.floor(
      (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return Math.min(weeksSinceStart + 1, 18); // Regular season is 18 weeks
  }

  /**
   * Backfill entire season
   */
  async backfillSeason(season: number): Promise<IngestionResult> {
    console.log(`[NFL Ingestor] Starting backfill for ${season} season`);

    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // NFL has 18 weeks in regular season
    for (let week = 1; week <= 18; week++) {
      try {
        const response = await fetch(
          `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}`,
          {
            headers: {
              'Ocp-Apim-Subscription-Key': this.env.SPORTSDATAIO_API_KEY,
            },
          }
        );

        if (!response.ok) {
          console.warn(`[NFL Ingestor] Failed to fetch Week ${week}: ${response.status}`);
          continue;
        }

        const games: NFLGameData[] = await response.json();

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
              `Week ${week} - Game ${game.GameID}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }

        console.log(`[NFL Ingestor] Processed ${games.length} games for Week ${week}`);
      } catch (error) {
        console.error(`[NFL Ingestor] Failed to fetch Week ${week}:`, error);
        result.errors.push(
          `Week ${week}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return result;
  }
}
