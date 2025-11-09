/**
 * League-Wide Sports Data Orchestrator
 *
 * Coordinates data fetching across all sports leagues:
 * - MLB (Baseball)
 * - NFL (Football)
 * - NBA (Basketball)
 * - NCAA Football
 * - College Baseball (PRIORITY)
 *
 * Timezone: America/Chicago
 */

import { MLBAdapter } from '../adapters/mlb';
import { NFLAdapter } from '../adapters/nfl';
import { NBAAdapter } from '../adapters/nba';
import { NCAAFootballAdapter } from '../adapters/ncaaFootball';
import { CollegeBaseballAdapter } from '../adapters/collegeBaseball';

import type {
  Sport,
  Game,
  Team,
  Standing,
  ApiResponse,
  DataSource,
} from '@bsi/shared';

import { getChicagoTimestamp, retryWithBackoff } from '@bsi/shared';

/**
 * Sport adapter interface - all adapters must implement these methods
 */
interface SportAdapter {
  getTeams(): Promise<ApiResponse<Team[]>>;
  getStandings(params?: any): Promise<ApiResponse<Standing[]>>;
  getGames(params?: any): Promise<ApiResponse<Game[]>>;
}

/**
 * Search result across all leagues
 */
export interface SearchResult {
  sport: Sport;
  type: 'team' | 'player' | 'game';
  id: string;
  name: string;
  relevanceScore: number; // 0-1 scale
  metadata: {
    abbreviation?: string;
    city?: string;
    conference?: string;
    division?: string;
    logo?: string;
    record?: string;
  };
}

/**
 * Multi-league game response with aggregated confidence
 */
export interface MultiLeagueResponse<T> {
  data: T[];
  sources: DataSource[];
  aggregatedConfidence: number;
  timestamp: string;
  errors?: Array<{
    sport: Sport;
    message: string;
  }>;
}

/**
 * League Orchestrator - Unified access to all sports data
 */
export class LeagueOrchestrator {
  private adapters: Map<Sport, SportAdapter>;

  constructor() {
    // Initialize all sport adapters
    this.adapters = new Map<Sport, SportAdapter>([
      ['MLB', new MLBAdapter()],
      ['NFL', new NFLAdapter()],
      ['NBA', new NBAAdapter()],
      ['NCAA_FOOTBALL', new NCAAFootballAdapter()],
      ['COLLEGE_BASEBALL', new CollegeBaseballAdapter()],
    ]);
  }

  /**
   * Get games from ALL leagues for a specific date
   *
   * @param date - YYYY-MM-DD format in America/Chicago timezone
   * @returns All games across all leagues
   */
  async getAllGames(date?: string): Promise<MultiLeagueResponse<Game>> {
    const targetDate = date || this.getTodayInChicago();

    // Fetch games from all leagues in parallel
    const results = await Promise.allSettled([
      this.getMLBGames(targetDate),
      this.getNFLGames(targetDate),
      this.getNBAGames(targetDate),
      this.getNCAAFootballGames(targetDate),
      this.getCollegeBaseballGames(targetDate),
    ]);

    const allGames: Game[] = [];
    const sources: DataSource[] = [];
    const errors: Array<{ sport: Sport; message: string }> = [];

    // Process results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allGames.push(...result.value.data);
        sources.push(result.value.source);
      } else if (result.status === 'rejected') {
        const sport = this.getLeagueByIndex(index);
        errors.push({
          sport,
          message: result.reason?.message || 'Unknown error',
        });
        console.error(`[LeagueOrchestrator] Failed to fetch ${sport} games:`, result.reason);
      }
    });

    // Sort by date
    allGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate aggregated confidence
    const aggregatedConfidence =
      sources.length > 0
        ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
        : 0;

    return {
      data: allGames,
      sources,
      aggregatedConfidence,
      timestamp: getChicagoTimestamp(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get standings from ALL leagues
   */
  async getAllStandings(): Promise<MultiLeagueResponse<Standing>> {
    const results = await Promise.allSettled([
      this.adapters.get('MLB')?.getStandings(),
      this.adapters.get('NFL')?.getStandings(2025),
      this.adapters.get('NBA')?.getStandings('2025'),
      // NCAA standings need conference parameter, skip for now
    ]);

    const allStandings: Standing[] = [];
    const sources: DataSource[] = [];
    const errors: Array<{ sport: Sport; message: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allStandings.push(...result.value.data);
        sources.push(result.value.source);
      } else if (result.status === 'rejected') {
        const sport = this.getLeagueByIndex(index);
        errors.push({
          sport,
          message: result.reason?.message || 'Unknown error',
        });
      }
    });

    const aggregatedConfidence =
      sources.length > 0
        ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
        : 0;

    return {
      data: allStandings,
      sources,
      aggregatedConfidence,
      timestamp: getChicagoTimestamp(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get teams from ALL leagues
   */
  async getAllTeams(): Promise<MultiLeagueResponse<Team>> {
    const results = await Promise.allSettled([
      this.adapters.get('MLB')?.getTeams(),
      this.adapters.get('NFL')?.getTeams(),
      this.adapters.get('NBA')?.getTeams(),
      // NCAA teams require additional logic
    ]);

    const allTeams: Team[] = [];
    const sources: DataSource[] = [];
    const errors: Array<{ sport: Sport; message: string }> = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allTeams.push(...result.value.data);
        sources.push(result.value.source);
      } else if (result.status === 'rejected') {
        const sport = this.getLeagueByIndex(index);
        errors.push({
          sport,
          message: result.reason?.message || 'Unknown error',
        });
      }
    });

    const aggregatedConfidence =
      sources.length > 0
        ? sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length
        : 0;

    return {
      data: allTeams,
      sources,
      aggregatedConfidence,
      timestamp: getChicagoTimestamp(),
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Unified search across ALL leagues
   *
   * Searches teams by:
   * - Full name (e.g., "St. Louis Cardinals")
   * - City (e.g., "St. Louis")
   * - Abbreviation (e.g., "STL")
   * - Partial match (e.g., "Cardinals")
   *
   * @param query - Search query
   * @returns Search results ranked by relevance
   */
  async search(query: string): Promise<SearchResult[]> {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    // Fetch all teams
    const teamsResponse = await this.getAllTeams();

    const results: SearchResult[] = [];

    // Search teams
    teamsResponse.data.forEach((team) => {
      const relevanceScore = this.calculateRelevance(team, normalizedQuery);

      if (relevanceScore > 0) {
        results.push({
          sport: this.inferSportFromTeam(team),
          type: 'team',
          id: team.id,
          name: team.name,
          relevanceScore,
          metadata: {
            abbreviation: team.abbreviation,
            city: team.city,
            conference: team.conference,
            division: team.division,
            logo: team.logo,
          },
        });
      }
    });

    // Sort by relevance (highest first)
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  }

  /**
   * Get all LIVE games across all leagues
   */
  async getLiveGames(): Promise<MultiLeagueResponse<Game>> {
    const allGamesResponse = await this.getAllGames();

    // Filter to only live games
    const liveGames = allGamesResponse.data.filter((game) => game.status === 'live');

    return {
      data: liveGames,
      sources: allGamesResponse.sources,
      aggregatedConfidence: allGamesResponse.aggregatedConfidence,
      timestamp: getChicagoTimestamp(),
      errors: allGamesResponse.errors,
    };
  }

  /**
   * Get games for a specific league
   */
  async getGamesByLeague(sport: Sport, params?: any): Promise<ApiResponse<Game[]>> {
    const adapter = this.adapters.get(sport);

    if (!adapter) {
      throw new Error(`No adapter found for sport: ${sport}`);
    }

    return adapter.getGames(params);
  }

  /**
   * Get standings for a specific league
   */
  async getStandingsByLeague(sport: Sport, params?: any): Promise<ApiResponse<Standing[]>> {
    const adapter = this.adapters.get(sport);

    if (!adapter) {
      throw new Error(`No adapter found for sport: ${sport}`);
    }

    return adapter.getStandings(params);
  }

  /**
   * Get teams for a specific league
   */
  async getTeamsByLeague(sport: Sport): Promise<ApiResponse<Team[]>> {
    const adapter = this.adapters.get(sport);

    if (!adapter) {
      throw new Error(`No adapter found for sport: ${sport}`);
    }

    return adapter.getTeams();
  }

  // ========== Private Helper Methods ==========

  private async getMLBGames(date: string): Promise<ApiResponse<Game[]>> {
    return this.adapters.get('MLB')!.getGames(date);
  }

  private async getNFLGames(_date: string): Promise<ApiResponse<Game[]>> {
    // NFL uses week, not date - get current week
    const currentWeek = this.getCurrentNFLWeek();
    return this.adapters.get('NFL')!.getGames({ season: 2025, week: currentWeek });
  }

  private async getNBAGames(date: string): Promise<ApiResponse<Game[]>> {
    return this.adapters.get('NBA')!.getGames(date);
  }

  private async getNCAAFootballGames(_date: string): Promise<ApiResponse<Game[]>> {
    // NCAA Football uses week - get current week
    const currentWeek = this.getCurrentNCAAWeek();
    return this.adapters.get('NCAA_FOOTBALL')!.getGames(currentWeek);
  }

  private async getCollegeBaseballGames(date: string): Promise<ApiResponse<Game[]>> {
    return this.adapters.get('COLLEGE_BASEBALL')!.getGames(date);
  }

  /**
   * Calculate relevance score for team search
   */
  private calculateRelevance(team: Team, query: string): number {
    let score = 0;

    const name = team.name.toLowerCase();
    const city = team.city.toLowerCase();
    const abbr = team.abbreviation.toLowerCase();

    // Exact matches get highest score
    if (name === query || abbr === query) {
      score = 1.0;
    }
    // Starts with query
    else if (name.startsWith(query) || city.startsWith(query)) {
      score = 0.8;
    }
    // Contains query
    else if (name.includes(query) || city.includes(query)) {
      score = 0.6;
    }
    // Abbreviation partial match
    else if (abbr.includes(query)) {
      score = 0.4;
    }

    return score;
  }

  /**
   * Infer sport from team based on ID patterns or conference/division
   */
  private inferSportFromTeam(team: Team): Sport {
    // MLB teams have numeric IDs
    if (team.division?.includes('AL') || team.division?.includes('NL')) {
      return 'MLB';
    }

    // NFL teams have conference AFC/NFC
    if (team.conference === 'AFC' || team.conference === 'NFC') {
      return 'NFL';
    }

    // NBA teams have conference Eastern/Western
    if (team.conference === 'Eastern' || team.conference === 'Western') {
      return 'NBA';
    }

    // Default to MLB (since we can't determine)
    return 'MLB';
  }

  /**
   * Get sport by index in results array
   */
  private getLeagueByIndex(index: number): Sport {
    const leagues: Sport[] = ['MLB', 'NFL', 'NBA', 'NCAA_FOOTBALL', 'COLLEGE_BASEBALL'];
    return leagues[index] || 'MLB';
  }

  /**
   * Get current NFL week (1-18)
   */
  private getCurrentNFLWeek(): number {
    // NFL season runs September - February
    // Week 1 starts ~Sept 8, Week 18 ends ~Jan 8
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const day = now.getDate();

    // September - December: weeks 1-17
    if (month === 8) return 1; // September
    if (month === 9) return 5; // October
    if (month === 10) return 9; // November
    if (month === 11) return 13; // December

    // January: weeks 17-18 + playoffs
    if (month === 0) {
      return day < 8 ? 18 : 1; // Playoffs or offseason
    }

    // Offseason
    return 1;
  }

  /**
   * Get current NCAA Football week (1-15)
   */
  private getCurrentNCAAWeek(): number {
    // NCAA season runs August - January
    const now = new Date();
    const month = now.getMonth();

    if (month === 7) return 1; // August (Week 0-1)
    if (month === 8) return 4; // September
    if (month === 9) return 8; // October
    if (month === 10) return 12; // November
    if (month === 11) return 15; // December (Conference Championships)

    // January: Playoffs/Bowl Games
    if (month === 0) return 15;

    // Offseason
    return 1;
  }

  /**
   * Get today's date in YYYY-MM-DD format (America/Chicago)
   */
  private getTodayInChicago(): string {
    const now = new Date();
    const chicagoTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [month, day, year] = chicagoTime.split('/');
    return `${year}-${month}-${day}`;
  }
}

/**
 * Export singleton instance
 */
export const orchestrator = new LeagueOrchestrator();
