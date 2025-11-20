/**
 * D1 Database Client
 *
 * Provides access to D1 historical data from Next.js API routes
 *
 * Note: This is a lightweight wrapper that will use:
 * - D1 HTTP API when CLOUDFLARE_API_TOKEN is available
 * - Direct D1 binding when deployed on Cloudflare Pages (edge runtime)
 * - Graceful fallback when D1 is unavailable
 */

import type {
  GameRecord,
  TeamRecord,
  StandingRecord,
  RecentGameView,
  LiveGameView,
  LatestStandingsView,
} from './types';

type D1Result<T> = {
  success: boolean;
  data: T[];
  error?: string;
};

/**
 * D1 Client for historical data queries
 *
 * Usage:
 * const client = new D1Client();
 * const games = await client.getRecentGames('MLB', 7);
 */
export class D1Client {
  private accountId: string | null;
  private databaseId: string | null;
  private apiToken: string | null;
  private baseUrl: string | null;

  constructor() {
    // These would be set from environment variables
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID || null;
    this.databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID || null;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || null;

    if (this.accountId && this.databaseId) {
      this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;
    } else {
      this.baseUrl = null;
    }
  }

  /**
   * Check if D1 is available
   */
  isAvailable(): boolean {
    return this.baseUrl !== null && this.apiToken !== null;
  }

  /**
   * Execute a SQL query
   */
  private async query<T>(sql: string, params: any[] = []): Promise<D1Result<T>> {
    if (!this.isAvailable()) {
      return {
        success: false,
        data: [],
        error: 'D1 not configured',
      };
    }

    try {
      const response = await fetch(this.baseUrl!, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sql,
          params,
        }),
      });

      if (!response.ok) {
        throw new Error(`D1 API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(`D1 query failed: ${JSON.stringify(result.errors)}`);
      }

      return {
        success: true,
        data: result.result?.[0]?.results || [],
      };
    } catch (error) {
      console.error('[D1 Client] Query error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get recent games for a sport (last N days)
   */
  async getRecentGames(sport: string, days: number = 7): Promise<D1Result<RecentGameView>> {
    const sql = `
      SELECT * FROM v_recent_games
      WHERE sport = ?
      AND game_date >= date('now', '-' || ? || ' days')
      ORDER BY game_date DESC, game_time DESC
      LIMIT 100
    `;

    return this.query<RecentGameView>(sql, [sport, days]);
  }

  /**
   * Get live games across all sports or specific sport
   */
  async getLiveGames(sport?: string): Promise<D1Result<LiveGameView>> {
    let sql = `SELECT * FROM v_live_games`;
    const params: any[] = [];

    if (sport) {
      sql += ` WHERE sport = ?`;
      params.push(sport);
    }

    sql += ` ORDER BY game_time`;

    return this.query<LiveGameView>(sql, params);
  }

  /**
   * Get team's recent games
   */
  async getTeamGames(teamId: string, limit: number = 10): Promise<D1Result<GameRecord>> {
    const sql = `
      SELECT * FROM games
      WHERE (home_team_id = ? OR away_team_id = ?)
      ORDER BY game_date DESC, game_time DESC
      LIMIT ?
    `;

    return this.query<GameRecord>(sql, [teamId, teamId, limit]);
  }

  /**
   * Get latest standings for a sport/conference
   */
  async getLatestStandings(sport: string, conference?: string): Promise<D1Result<LatestStandingsView>> {
    let sql = `SELECT * FROM v_latest_standings WHERE sport = ?`;
    const params: any[] = [sport];

    if (conference) {
      sql += ` AND conference = ?`;
      params.push(conference);
    }

    sql += ` ORDER BY conference, division, wins DESC`;

    return this.query<LatestStandingsView>(sql, params);
  }

  /**
   * Get historical game data by ID
   */
  async getGame(gameId: string): Promise<D1Result<GameRecord>> {
    const sql = `SELECT * FROM games WHERE id = ?`;
    return this.query<GameRecord>(sql, [gameId]);
  }

  /**
   * Get team information
   */
  async getTeam(teamId: string): Promise<D1Result<TeamRecord>> {
    const sql = `SELECT * FROM teams WHERE id = ? AND is_active = 1`;
    return this.query<TeamRecord>(sql, [teamId]);
  }

  /**
   * Get all teams for a sport
   */
  async getTeamsBySport(sport: string): Promise<D1Result<TeamRecord>> {
    const sql = `
      SELECT * FROM teams
      WHERE sport = ? AND is_active = 1
      ORDER BY display_name
    `;
    return this.query<TeamRecord>(sql, [sport]);
  }

  /**
   * Get games for a specific date
   */
  async getGamesByDate(sport: string, date: string): Promise<D1Result<RecentGameView>> {
    const sql = `
      SELECT * FROM v_recent_games
      WHERE sport = ? AND game_date = ?
      ORDER BY game_time
    `;
    return this.query<RecentGameView>(sql, [sport, date]);
  }

  /**
   * Get head-to-head history between two teams
   */
  async getHeadToHead(team1Id: string, team2Id: string, limit: number = 10): Promise<D1Result<GameRecord>> {
    const sql = `
      SELECT * FROM games
      WHERE (
        (home_team_id = ? AND away_team_id = ?)
        OR (home_team_id = ? AND away_team_id = ?)
      )
      AND status = 'final'
      ORDER BY game_date DESC
      LIMIT ?
    `;

    return this.query<GameRecord>(sql, [team1Id, team2Id, team2Id, team1Id, limit]);
  }

  /**
   * Get season summary for a team
   */
  async getTeamSeasonSummary(teamId: string, season: number): Promise<D1Result<GameRecord>> {
    const sql = `
      SELECT * FROM games
      WHERE (home_team_id = ? OR away_team_id = ?)
      AND season = ?
      ORDER BY game_date
    `;

    return this.query<GameRecord>(sql, [teamId, teamId, season]);
  }
}

/**
 * Singleton instance
 */
let d1Client: D1Client | null = null;

/**
 * Get D1 client instance
 */
export function getD1Client(): D1Client {
  if (!d1Client) {
    d1Client = new D1Client();
  }
  return d1Client;
}
