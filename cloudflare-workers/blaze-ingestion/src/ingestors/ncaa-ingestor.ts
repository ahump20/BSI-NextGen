/**
 * NCAA Football Data Ingestor
 *
 * Fetches games from ESPN API and stores in D1 database
 */

import type { Env } from '../index';
import type { IngestionResult } from './mlb-ingestor';

interface NCAAGameData {
  id: string;
  uid: string;
  date: string;
  name: string;
  season: {
    year: number;
  };
  week?: {
    number: number;
  };
  status: {
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
    };
  };
  competitions: Array<{
    id: string;
    venue?: {
      fullName: string;
    };
    attendance?: number;
    competitors: Array<{
      id: string;
      uid: string;
      type: string;
      homeAway: string;
      team: {
        id: string;
        uid: string;
        displayName: string;
      };
      score?: string;
    }>;
  }>;
}

export class NCAAIngestor {
  constructor(private env: Env) {}

  /**
   * Ingest current week's NCAA Football games
   */
  async ingestCurrentWeek(): Promise<IngestionResult> {
    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    try {
      const currentWeek = this.getCurrentWeek();

      console.log(`[NCAA Ingestor] Fetching games for Week ${currentWeek}`);

      // Fetch games from ESPN API
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard`,
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ESPN API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const games: NCAAGameData[] = data.events || [];

      console.log(`[NCAA Ingestor] Found ${games.length} games for Week ${currentWeek}`);

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
          result.errors.push(`Game ${game.id}: ${errorMsg}`);
          console.error('[NCAA Ingestor] Failed to upsert game:', game.id, error);
        }
      }

      return result;
    } catch (error) {
      console.error('[NCAA Ingestor] Failed to ingest games:', error);
      throw error;
    }
  }

  /**
   * Upsert a single game
   * @returns true if updated, false if inserted
   */
  private async upsertGame(gameData: NCAAGameData): Promise<boolean> {
    const gameId = `ncaa-fb-${gameData.id}`;
    const seasonId = `ncaa-fb-${gameData.season.year}`;

    const competition = gameData.competitions[0];
    if (!competition) {
      throw new Error('No competition data found');
    }

    const homeCompetitor = competition.competitors.find(c => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find(c => c.homeAway === 'away');

    if (!homeCompetitor || !awayCompetitor) {
      throw new Error('Missing home or away competitor');
    }

    const homeTeamId = `ncaa-fb-${homeCompetitor.team.id}`;
    const awayTeamId = `ncaa-fb-${awayCompetitor.team.id}`;

    // Check if game exists
    const existing = await this.env.BLAZE_DB.prepare(
      'SELECT id FROM games WHERE id = ?'
    )
      .bind(gameId)
      .first<{ id: string }>();

    const scheduledAt = Math.floor(new Date(gameData.date).getTime() / 1000);
    const status = this.mapGameStatus(gameData.status.type.state);
    const homeScore = homeCompetitor.score ? parseInt(homeCompetitor.score) : null;
    const awayScore = awayCompetitor.score ? parseInt(awayCompetitor.score) : null;

    if (existing) {
      // Update existing game
      await this.env.BLAZE_DB.prepare(
        `UPDATE games
         SET status = ?, home_score = ?, away_score = ?,
             attendance = ?, updated_at = unixepoch()
         WHERE id = ?`
      )
        .bind(status, homeScore, awayScore, competition.attendance, gameId)
        .run();

      console.log(`[NCAA Ingestor] Updated game ${gameId} (status: ${status})`);
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
          gameData.id,
          homeTeamId,
          awayTeamId,
          scheduledAt,
          status,
          homeScore,
          awayScore,
          competition.venue?.fullName || null,
          competition.attendance || null
        )
        .run();

      console.log(`[NCAA Ingestor] Inserted game ${gameId}`);
      return false;
    }
  }

  /**
   * Map ESPN API status to our internal status
   */
  private mapGameStatus(state: string): string {
    switch (state.toLowerCase()) {
      case 'pre':
        return 'scheduled';
      case 'in':
        return 'live';
      case 'post':
        return 'final';
      default:
        console.warn(`[NCAA Ingestor] Unknown state: ${state}, defaulting to scheduled`);
        return 'scheduled';
    }
  }

  /**
   * Get current NCAA week (simplified)
   */
  private getCurrentWeek(): number {
    const now = new Date();
    const seasonStart = new Date('2025-08-30'); // NCAA typically starts late August

    if (now < seasonStart) {
      return 0; // Preseason
    }

    const weeksSinceStart = Math.floor(
      (now.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    return Math.min(weeksSinceStart + 1, 15); // Regular season is ~13-15 weeks
  }

  /**
   * Ingest specific week
   */
  async ingestWeek(season: number, week: number): Promise<IngestionResult> {
    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    try {
      console.log(`[NCAA Ingestor] Fetching ${season} Week ${week}`);

      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=${season}&seasontype=2&week=${week}`,
        {
          headers: {
            'User-Agent': 'BlazeSportsIntel/1.0',
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`ESPN API returned ${response.status}`);
      }

      const data = await response.json();
      const games: NCAAGameData[] = data.events || [];

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
            `Week ${week} - Game ${game.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      console.log(`[NCAA Ingestor] Processed ${games.length} games for Week ${week}`);
    } catch (error) {
      console.error(`[NCAA Ingestor] Failed to fetch Week ${week}:`, error);
      result.errors.push(`Week ${week}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Backfill entire season
   */
  async backfillSeason(season: number): Promise<IngestionResult> {
    console.log(`[NCAA Ingestor] Starting backfill for ${season} season`);

    const result: IngestionResult = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    // NCAA regular season is typically 13 weeks
    for (let week = 1; week <= 15; week++) {
      const weekResult = await this.ingestWeek(season, week);

      result.inserted += weekResult.inserted;
      result.updated += weekResult.updated;
      result.failed += weekResult.failed;
      result.errors.push(...weekResult.errors);
    }

    return result;
  }
}
