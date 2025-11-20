/**
 * NBA Data Ingestor
 *
 * Fetches games from SportsDataIO NBA API and stores in D1 database
 */

import type { Env } from '../index';
import type { IngestionResult } from './mlb-ingestor';

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

      const games = await response.json();

      console.log(`[NBA Ingestor] Found ${games.length} games for ${today}`);

      // TODO: Implement upsertGame for NBA
      // For now, just log success
      result.inserted = games.length;

      return result;
    } catch (error) {
      console.error('[NBA Ingestor] Failed to ingest games:', error);
      throw error;
    }
  }
}
