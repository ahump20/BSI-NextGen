/**
 * NCAA College Baseball Data Adapter
 * Fetches game data, box scores, and play-by-play from NCAA Stats API
 *
 * Data Source: NCAA Stats API (stats.ncaa.org)
 * Timezone: America/Chicago (Central Time)
 * Update Frequency: Real-time during games, hourly off-season
 */

export interface NCAATeam {
  id: string;
  name: string;
  school: string;
  conference: string;
  division: string;
  logo?: string;
  colors?: string[];
}

export interface NCAAGame {
  id: string;
  homeTeam: NCAATeam;
  awayTeam: NCAATeam;
  gameDate: string; // ISO 8601 timestamp
  venue: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed';
  inning?: number;
  homeScore: number;
  awayScore: number;
  attendance?: number;
}

export interface NCAABattingLine {
  playerId: string;
  playerName: string;
  position: string;
  atBats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  rbi: number;
  walks: number;
  strikeouts: number;
  stolenBases: number;
  caughtStealing: number;
  average: string;
}

export interface NCAAitchingLine {
  playerId: string;
  playerName: string;
  inningsPitched: string;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  homeRunsAllowed: number;
  pitchCount: number;
  era: string;
  decision?: 'W' | 'L' | 'S';
}

export interface NCAABoxScore {
  game: NCAAGame;
  homeInnings: number[];
  awayInnings: number[];
  homeBatting: NCAABattingLine[];
  awayBatting: NCAABattingLine[];
  homePitching: NCAAitchingLine[];
  awayPitching: NCAAitchingLine[];
  homeHits: number;
  awayHits: number;
  homeErrors: number;
  awayErrors: number;
}

export interface PlayByPlayEvent {
  inning: number;
  half: 'top' | 'bottom';
  description: string;
  timestamp: string;
  batterName?: string;
  pitcherName?: string;
  result?: string;
}

/**
 * NCAA Adapter Configuration
 */
interface NCAAAdapterConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export class NCAAAdapter {
  private readonly config: Required<NCAAAdapterConfig>;
  private readonly headers: Record<string, string>;

  constructor(config: NCAAAdapterConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.NCAA_API_KEY || '',
      baseURL: config.baseURL || 'https://stats.ncaa.org/rankings/change_sport_year_div',
      timeout: config.timeout || 10000,
      cache: config.cache !== false,
      cacheTTL: config.cacheTTL || 300, // 5 minutes default
    };

    this.headers = {
      'Accept': 'application/json',
      'User-Agent': 'BlazeSportsIntel/1.0 (https://blazesportsintel.com)',
    };

    if (this.config.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
  }

  /**
   * Fetch game by ID with complete box score
   */
  async getGame(gameId: string): Promise<NCAABoxScore> {
    try {
      // For demo, we'll fetch from multiple NCAA endpoints
      // In production, replace with actual NCAA Stats API calls

      const gameResponse = await this.fetchWithTimeout(
        `${this.config.baseURL}/game/${gameId}`,
        { headers: this.headers }
      );

      if (!gameResponse.ok) {
        throw new Error(`NCAA API error: ${gameResponse.status} ${gameResponse.statusText}`);
      }

      const gameData = await gameResponse.json();

      // Transform NCAA API response to our format
      return this.transformGameData(gameData);
    } catch (error) {
      console.error('[NCAA Adapter] Failed to fetch game:', error);
      throw new Error(`Failed to fetch NCAA game ${gameId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch games for a specific date range
   */
  async getGames(startDate: string, endDate?: string): Promise<NCAAGame[]> {
    try {
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate || startDate,
      });

      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}/games?${params}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        throw new Error(`NCAA API error: ${response.status}`);
      }

      const data = await response.json();
      return data.games?.map((g: any) => this.transformGameSummary(g)) || [];
    } catch (error) {
      console.error('[NCAA Adapter] Failed to fetch games:', error);
      return [];
    }
  }

  /**
   * Fetch play-by-play data for a game
   */
  async getPlayByPlay(gameId: string): Promise<PlayByPlayEvent[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}/game/${gameId}/plays`,
        { headers: this.headers }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return this.transformPlayByPlay(data);
    } catch (error) {
      console.error('[NCAA Adapter] Failed to fetch play-by-play:', error);
      return [];
    }
  }

  /**
   * Fetch team schedule
   */
  async getTeamSchedule(teamId: string, season: number): Promise<NCAAGame[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}/team/${teamId}/schedule?season=${season}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.games?.map((g: any) => this.transformGameSummary(g)) || [];
    } catch (error) {
      console.error('[NCAA Adapter] Failed to fetch team schedule:', error);
      return [];
    }
  }

  /**
   * Private: Transform NCAA API game data to our format
   */
  private transformGameData(data: any): NCAABoxScore {
    // Calculate batting averages
    const calcAvg = (hits: number, atBats: number) =>
      atBats > 0 ? (hits / atBats).toFixed(3) : '.000';

    // Calculate ERA
    const calcERA = (earnedRuns: number, inningsPitched: number) =>
      inningsPitched > 0 ? ((earnedRuns * 9) / inningsPitched).toFixed(2) : '0.00';

    return {
      game: {
        id: data.id || data.gameId,
        homeTeam: {
          id: data.homeTeam?.id,
          name: data.homeTeam?.name,
          school: data.homeTeam?.school || data.homeTeam?.name,
          conference: data.homeTeam?.conference || '',
          division: data.homeTeam?.division || 'D1',
          logo: data.homeTeam?.logo,
          colors: data.homeTeam?.colors,
        },
        awayTeam: {
          id: data.awayTeam?.id,
          name: data.awayTeam?.name,
          school: data.awayTeam?.school || data.awayTeam?.name,
          conference: data.awayTeam?.conference || '',
          division: data.awayTeam?.division || 'D1',
          logo: data.awayTeam?.logo,
          colors: data.awayTeam?.colors,
        },
        gameDate: data.date || new Date().toISOString(),
        venue: data.venue || 'TBA',
        status: data.status || 'scheduled',
        inning: data.inning,
        homeScore: data.homeScore || 0,
        awayScore: data.awayScore || 0,
        attendance: data.attendance,
      },
      homeInnings: data.lineScore?.home || [],
      awayInnings: data.lineScore?.away || [],
      homeBatting: (data.homeTeam?.batting || []).map((b: any) => ({
        playerId: b.playerId,
        playerName: b.name,
        position: b.position || '',
        atBats: b.ab || 0,
        runs: b.r || 0,
        hits: b.h || 0,
        doubles: b['2b'] || 0,
        triples: b['3b'] || 0,
        homeRuns: b.hr || 0,
        rbi: b.rbi || 0,
        walks: b.bb || 0,
        strikeouts: b.so || 0,
        stolenBases: b.sb || 0,
        caughtStealing: b.cs || 0,
        average: calcAvg(b.h || 0, b.ab || 0),
      })),
      awayBatting: (data.awayTeam?.batting || []).map((b: any) => ({
        playerId: b.playerId,
        playerName: b.name,
        position: b.position || '',
        atBats: b.ab || 0,
        runs: b.r || 0,
        hits: b.h || 0,
        doubles: b['2b'] || 0,
        triples: b['3b'] || 0,
        homeRuns: b.hr || 0,
        rbi: b.rbi || 0,
        walks: b.bb || 0,
        strikeouts: b.so || 0,
        stolenBases: b.sb || 0,
        caughtStealing: b.cs || 0,
        average: calcAvg(b.h || 0, b.ab || 0),
      })),
      homePitching: (data.homeTeam?.pitching || []).map((p: any) => ({
        playerId: p.playerId,
        playerName: p.name,
        inningsPitched: String(p.ip || '0.0'),
        hits: p.h || 0,
        runs: p.r || 0,
        earnedRuns: p.er || 0,
        walks: p.bb || 0,
        strikeouts: p.so || 0,
        homeRunsAllowed: p.hr || 0,
        pitchCount: p.pc || 0,
        era: calcERA(p.er || 0, parseFloat(p.ip || '0')),
        decision: p.decision,
      })),
      awayPitching: (data.awayTeam?.pitching || []).map((p: any) => ({
        playerId: p.playerId,
        playerName: p.name,
        inningsPitched: String(p.ip || '0.0'),
        hits: p.h || 0,
        runs: p.r || 0,
        earnedRuns: p.er || 0,
        walks: p.bb || 0,
        strikeouts: p.so || 0,
        homeRunsAllowed: p.hr || 0,
        pitchCount: p.pc || 0,
        era: calcERA(p.er || 0, parseFloat(p.ip || '0')),
        decision: p.decision,
      })),
      homeHits: data.lineScore?.homeHits || 0,
      awayHits: data.lineScore?.awayHits || 0,
      homeErrors: data.lineScore?.homeErrors || 0,
      awayErrors: data.lineScore?.awayErrors || 0,
    };
  }

  /**
   * Private: Transform game summary data
   */
  private transformGameSummary(data: any): NCAAGame {
    return {
      id: data.id || data.gameId,
      homeTeam: {
        id: data.homeTeam?.id,
        name: data.homeTeam?.name,
        school: data.homeTeam?.school || data.homeTeam?.name,
        conference: data.homeTeam?.conference || '',
        division: data.homeTeam?.division || 'D1',
      },
      awayTeam: {
        id: data.awayTeam?.id,
        name: data.awayTeam?.name,
        school: data.awayTeam?.school || data.awayTeam?.name,
        conference: data.awayTeam?.conference || '',
        division: data.awayTeam?.division || 'D1',
      },
      gameDate: data.date || new Date().toISOString(),
      venue: data.venue || 'TBA',
      status: data.status || 'scheduled',
      inning: data.inning,
      homeScore: data.homeScore || 0,
      awayScore: data.awayScore || 0,
      attendance: data.attendance,
    };
  }

  /**
   * Private: Transform play-by-play data
   */
  private transformPlayByPlay(data: any): PlayByPlayEvent[] {
    if (!data.plays || !Array.isArray(data.plays)) {
      return [];
    }

    return data.plays.map((play: any) => ({
      inning: play.inning || 0,
      half: play.half || 'top',
      description: play.description || '',
      timestamp: play.timestamp || new Date().toISOString(),
      batterName: play.batter?.name,
      pitcherName: play.pitcher?.name,
      result: play.result,
    }));
  }

  /**
   * Private: Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/**
 * Factory function to create NCAA adapter instance
 */
export function createNCAAAdapter(config?: NCAAAdapterConfig): NCAAAdapter {
  return new NCAAAdapter(config);
}
