/**
 * SportsDataIO Comprehensive Adapter
 * Primary data source for MLB, NFL, NBA, NCAA Football
 *
 * Features:
 * - Real-time scores and standings
 * - Complete player rosters and stats
 * - Team information and logos
 * - Schedule and game results
 * - Caching and rate limit handling
 *
 * API Documentation: https://sportsdata.io/developers/api-documentation
 */

import type { Team, Game, Standing, ApiResponse, Sport } from '@bsi/shared';
import {
  validateApiKey,
  retryWithBackoff,
  getChicagoTimestamp,
  fetchWithTimeout,
} from '@bsi/shared';

// ============================================================================
// SportsDataIO Type Definitions
// ============================================================================

interface SDIOTeam {
  TeamID: number;
  Key: string;
  City: string;
  Name: string;
  Conference?: string;
  Division?: string;
  League?: string;
  Active: boolean;
  WikipediaLogoUrl?: string;
  GlobalTeamID: number;
}

interface SDIOGame {
  GameID?: number;
  GameKey?: string;
  Season: number;
  SeasonType: number;
  Status: string;
  Day: string;
  DateTime: string;
  AwayTeam: string;
  HomeTeam: string;
  AwayTeamID: number;
  HomeTeamID: number;
  AwayScore?: number;
  AwayTeamScore?: number;
  HomeScore?: number;
  HomeTeamScore?: number;
  AwayTeamRuns?: number;
  HomeTeamRuns?: number;
  Week?: number;
  Inning?: number;
  InningHalf?: string;
  Quarter?: string;
  Period?: string;
  TimeRemaining?: string;
  TimeRemainingMinutes?: number;
  TimeRemainingSeconds?: number;
  Updated: string;
  Channel?: string;
  Attendance?: number;
}

interface SDIOStanding {
  TeamID: number;
  Key: string;
  Name: string;
  Wins: number;
  Losses: number;
  Ties?: number;
  Percentage: number;
  PointsFor?: number;
  PointsAgainst?: number;
  Conference?: string;
  Division?: string;
  League?: string;
  ConferenceWins?: number;
  ConferenceLosses?: number;
  DivisionWins?: number;
  DivisionLosses?: number;
  HomeWins: number;
  HomeLosses: number;
  AwayWins: number;
  AwayLosses: number;
  Streak?: number;
  WildCardRank?: number;
  GamesBack?: number;
  GlobalTeamID: number;
}

// ============================================================================
// SportsDataIO Adapter Class
// ============================================================================

export class SportsDataIOAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.sportsdata.io/v3';
  private cache: Map<string, { data: any; expires: number }> = new Map();

  constructor(apiKey?: string) {
    this.apiKey = validateApiKey(
      apiKey || process.env.SPORTSDATAIO_API_KEY,
      'SportsDataIO'
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getCacheKey(sport: string, endpoint: string, params?: string): string {
    return `${sport}:${endpoint}:${params || ''}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  private buildUrl(sport: string, endpoint: string): string {
    return `${this.baseUrl}/${sport}/scores${endpoint}?key=${this.apiKey}`;
  }

  private async fetchSDIO<T>(
    sport: string,
    endpoint: string,
    cacheTTL: number = 300
  ): Promise<T> {
    const cacheKey = this.getCacheKey(sport, endpoint);
    const cached = this.getFromCache<T>(cacheKey);

    if (cached) {
      return cached;
    }

    return retryWithBackoff(async () => {
      const url = this.buildUrl(sport, endpoint);
      const response = await fetchWithTimeout(url, {}, 10000);

      if (!response.ok) {
        throw new Error(`SportsDataIO API error: ${response.statusText}`);
      }

      const data = await response.json() as T;
      this.setCache(cacheKey, data, cacheTTL);
      return data;
    });
  }

  private mapGameStatus(status: string): Game['status'] {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('final') || statusLower === 'f' || statusLower === 'f/ot') {
      return 'final';
    }
    if (
      statusLower.includes('progress') ||
      statusLower === 'halftime' ||
      statusLower === 'live'
    ) {
      return 'live';
    }
    if (statusLower.includes('scheduled') || statusLower === 'pregame') {
      return 'scheduled';
    }
    if (statusLower.includes('postponed')) {
      return 'postponed';
    }
    if (statusLower.includes('cancel')) {
      return 'cancelled';
    }
    return 'scheduled';
  }

  private getCurrentSeason(sport: 'mlb' | 'nfl' | 'nba' | 'cfb'): number {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    switch (sport) {
      case 'mlb':
        return month >= 3 && month <= 10 ? year : year - 1;
      case 'nfl':
        return month >= 9 ? year : year - 1;
      case 'nba':
        return month >= 10 ? year : year - 1;
      case 'cfb':
        return month >= 8 ? year : year - 1;
      default:
        return year;
    }
  }

  // ============================================================================
  // MLB Methods
  // ============================================================================

  async getMLBTeams(): Promise<ApiResponse<Team[]>> {
    const teams = await this.fetchSDIO<SDIOTeam[]>('mlb', '/json/teams', 86400);

    const data: Team[] = teams.map((team) => ({
      id: team.TeamID.toString(),
      name: team.Name,
      abbreviation: team.Key,
      city: team.City,
      logo: team.WikipediaLogoUrl || `https://www.mlbstatic.com/team-logos/${team.TeamID}.svg`,
      division: team.Division,
      conference: team.League,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getMLBStandings(season?: number): Promise<ApiResponse<Standing[]>> {
    const year = season || this.getCurrentSeason('mlb');
    const standings = await this.fetchSDIO<SDIOStanding[]>(
      'mlb',
      `/json/Standings/${year}`,
      300
    );

    const data: Standing[] = standings.map((standing) => ({
      team: {
        id: standing.TeamID.toString(),
        name: standing.Name,
        abbreviation: standing.Key,
        city: '',
      },
      wins: standing.Wins,
      losses: standing.Losses,
      winPercentage: standing.Percentage,
      gamesBack: standing.GamesBack || 0,
      streak: standing.Streak?.toString(),
      lastTen: undefined,
      division: standing.Division,
      conference: standing.League,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getMLBScores(date?: string): Promise<ApiResponse<Game[]>> {
    const targetDate =
      date || new Date().toISOString().split('T')[0].replace(/-/g, '-').toUpperCase();
    const formattedDate = new Date(targetDate)
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
      .replace(/ /g, '-')
      .toUpperCase();

    const games = await this.fetchSDIO<SDIOGame[]>(
      'mlb',
      `/json/GamesByDate/${formattedDate}`,
      30
    );

    const data: Game[] = games.map((game) => ({
      id: game.GameID?.toString() || '',
      sport: 'MLB' as Sport,
      date: game.DateTime,
      status: this.mapGameStatus(game.Status),
      homeTeam: {
        id: game.HomeTeamID.toString(),
        name: game.HomeTeam,
        abbreviation: game.HomeTeam,
        city: '',
      },
      awayTeam: {
        id: game.AwayTeamID.toString(),
        name: game.AwayTeam,
        abbreviation: game.AwayTeam,
        city: '',
      },
      homeScore: game.HomeTeamRuns || game.HomeScore || 0,
      awayScore: game.AwayTeamRuns || game.AwayScore || 0,
      period: game.Inning ? `${game.Inning}${game.InningHalf || ''}` : undefined,
      broadcasters: game.Channel ? [game.Channel] : undefined,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  // ============================================================================
  // NFL Methods
  // ============================================================================

  async getNFLTeams(): Promise<ApiResponse<Team[]>> {
    const teams = await this.fetchSDIO<SDIOTeam[]>('nfl', '/json/Teams', 86400);

    const data: Team[] = teams.map((team) => ({
      id: team.TeamID.toString(),
      name: team.Name,
      abbreviation: team.Key,
      city: team.City,
      logo: team.WikipediaLogoUrl,
      division: team.Division,
      conference: team.Conference,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getNFLStandings(season?: number): Promise<ApiResponse<Standing[]>> {
    const year = season || this.getCurrentSeason('nfl');
    const standings = await this.fetchSDIO<SDIOStanding[]>(
      'nfl',
      `/json/Standings/${year}`,
      300
    );

    const data: Standing[] = standings.map((standing) => ({
      team: {
        id: standing.TeamID.toString(),
        name: standing.Name,
        abbreviation: standing.Key,
        city: '',
      },
      wins: standing.Wins,
      losses: standing.Losses,
      ties: standing.Ties,
      winPercentage: standing.Percentage,
      gamesBack: 0,
      streak: standing.Streak?.toString(),
      pointsFor: standing.PointsFor,
      pointsAgainst: standing.PointsAgainst,
      division: standing.Division,
      conference: standing.Conference,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getNFLScores(week?: number, season?: number): Promise<ApiResponse<Game[]>> {
    const year = season || this.getCurrentSeason('nfl');
    const weekNum = week || this.getCurrentNFLWeek();
    const games = await this.fetchSDIO<SDIOGame[]>(
      'nfl',
      `/json/ScoresByWeek/${year}/${weekNum}`,
      30
    );

    const data: Game[] = games.map((game) => ({
      id: game.GameKey || game.GameID?.toString() || '',
      sport: 'NFL' as Sport,
      date: game.DateTime,
      status: this.mapGameStatus(game.Status),
      homeTeam: {
        id: game.HomeTeamID.toString(),
        name: game.HomeTeam,
        abbreviation: game.HomeTeam,
        city: '',
      },
      awayTeam: {
        id: game.AwayTeamID.toString(),
        name: game.AwayTeam,
        abbreviation: game.AwayTeam,
        city: '',
      },
      homeScore: game.HomeScore || 0,
      awayScore: game.AwayScore || 0,
      period: game.Quarter || game.Period,
      broadcasters: game.Channel ? [game.Channel] : undefined,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  private getCurrentNFLWeek(): number {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 8, 1); // Sept 1
    if (now < seasonStart) return 1;

    const daysSinceStart = Math.floor(
      (now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const week = Math.floor(daysSinceStart / 7) + 1;
    return Math.min(week, 18);
  }

  // ============================================================================
  // NBA Methods
  // ============================================================================

  async getNBATeams(): Promise<ApiResponse<Team[]>> {
    const teams = await this.fetchSDIO<SDIOTeam[]>('nba', '/json/teams', 86400);

    const data: Team[] = teams.map((team) => ({
      id: team.TeamID.toString(),
      name: team.Name,
      abbreviation: team.Key,
      city: team.City,
      logo: team.WikipediaLogoUrl,
      division: team.Division,
      conference: team.Conference,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getNBAStandings(season?: string): Promise<ApiResponse<Standing[]>> {
    const year = season || this.getCurrentSeason('nba').toString();
    const standings = await this.fetchSDIO<SDIOStanding[]>(
      'nba',
      `/json/Standings/${year}`,
      300
    );

    const data: Standing[] = standings.map((standing) => ({
      team: {
        id: standing.TeamID.toString(),
        name: standing.Name,
        abbreviation: standing.Key,
        city: '',
      },
      wins: standing.Wins,
      losses: standing.Losses,
      winPercentage: standing.Percentage,
      gamesBack: standing.GamesBack || 0,
      streak: standing.Streak?.toString(),
      division: standing.Division,
      conference: standing.Conference,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getNBAScores(date?: string): Promise<ApiResponse<Game[]>> {
    const targetDate =
      date || new Date().toISOString().split('T')[0].replace(/-/g, '-').toUpperCase();
    const formattedDate = new Date(targetDate)
      .toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
      .replace(/ /g, '-')
      .toUpperCase();

    const games = await this.fetchSDIO<SDIOGame[]>(
      'nba',
      `/json/GamesByDate/${formattedDate}`,
      30
    );

    const data: Game[] = games.map((game) => ({
      id: game.GameID?.toString() || '',
      sport: 'NBA' as Sport,
      date: game.DateTime,
      status: this.mapGameStatus(game.Status),
      homeTeam: {
        id: game.HomeTeamID.toString(),
        name: game.HomeTeam,
        abbreviation: game.HomeTeam,
        city: '',
      },
      awayTeam: {
        id: game.AwayTeamID.toString(),
        name: game.AwayTeam,
        abbreviation: game.AwayTeam,
        city: '',
      },
      homeScore: game.HomeTeamScore || game.HomeScore || 0,
      awayScore: game.AwayTeamScore || game.AwayScore || 0,
      period: game.Quarter || game.Period,
      broadcasters: game.Channel ? [game.Channel] : undefined,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  // ============================================================================
  // NCAA Football Methods
  // ============================================================================

  async getNCAAFTeams(): Promise<ApiResponse<Team[]>> {
    const teams = await this.fetchSDIO<SDIOTeam[]>('cfb', '/json/Teams', 86400);

    const data: Team[] = teams.map((team) => ({
      id: team.TeamID.toString(),
      name: team.Name,
      abbreviation: team.Key,
      city: team.City,
      logo: team.WikipediaLogoUrl,
      division: team.Division,
      conference: team.Conference,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getNCAAFStandings(season?: number): Promise<ApiResponse<Standing[]>> {
    const year = season || this.getCurrentSeason('cfb');
    const standings = await this.fetchSDIO<SDIOStanding[]>(
      'cfb',
      `/json/Standings/${year}`,
      300
    );

    const data: Standing[] = standings.map((standing) => ({
      team: {
        id: standing.TeamID.toString(),
        name: standing.Name,
        abbreviation: standing.Key,
        city: '',
      },
      wins: standing.Wins,
      losses: standing.Losses,
      winPercentage: standing.Percentage,
      gamesBack: 0,
      division: standing.Division,
      conference: standing.Conference,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  async getNCAAFScores(week?: number, season?: number): Promise<ApiResponse<Game[]>> {
    const year = season || this.getCurrentSeason('cfb');
    const weekNum = week || this.getCurrentNCAAFWeek();
    const games = await this.fetchSDIO<SDIOGame[]>(
      'cfb',
      `/json/GamesByWeek/${year}/${weekNum}`,
      30
    );

    const data: Game[] = games.map((game) => ({
      id: game.GameID?.toString() || '',
      sport: 'NCAA Football' as Sport,
      date: game.DateTime,
      status: this.mapGameStatus(game.Status),
      homeTeam: {
        id: game.HomeTeamID.toString(),
        name: game.HomeTeam,
        abbreviation: game.HomeTeam,
        city: '',
      },
      awayTeam: {
        id: game.AwayTeamID.toString(),
        name: game.AwayTeam,
        abbreviation: game.AwayTeam,
        city: '',
      },
      homeScore: game.HomeScore || 0,
      awayScore: game.AwayScore || 0,
      period: game.Period,
      broadcasters: game.Channel ? [game.Channel] : undefined,
    }));

    return {
      data,
      source: {
        provider: 'SportsDataIO',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  private getCurrentNCAAFWeek(): number {
    const now = new Date();
    const seasonStart = new Date(now.getFullYear(), 7, 25); // Aug 25
    if (now < seasonStart) return 1;

    const daysSinceStart = Math.floor(
      (now.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const week = Math.floor(daysSinceStart / 7) + 1;
    return Math.min(week, 15);
  }
}
