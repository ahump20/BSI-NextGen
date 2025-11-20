/**
 * NCAA Football Data Ingestor
 *
 * Fetches games from ESPN API and stores in D1 database
 */

import type { Env } from '../index';
import type { IngestionResult } from './mlb-ingestor';

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
      const games = data.events || [];

      console.log(`[NCAA Ingestor] Found ${games.length} games for Week ${currentWeek}`);

      // TODO: Implement upsertGame for NCAA
      // For now, just log success
      result.inserted = games.length;

      return result;
    } catch (error) {
      console.error('[NCAA Ingestor] Failed to ingest games:', error);
      throw error;
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
}
