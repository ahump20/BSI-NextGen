import type {
  NCAAGame,
  NCAABoxScore,
  BattingLine,
  PitchingLine,
  TeamStats,
} from '@bsi/shared';

export interface NCAAAdapterConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
}

export class NCAAAdapter {
  private config: Required<NCAAAdapterConfig>;
  private headers: Record<string, string>;

  constructor(config: NCAAAdapterConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      baseURL: config.baseURL || 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball',
      timeout: config.timeout || 10000,
    };

    this.headers = {
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Accept': 'application/json',
      ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
    };
  }

  /**
   * Fetch games list with optional date filter
   */
  async getGames(date?: string): Promise<NCAAGame[]> {
    const params = new URLSearchParams();
    if (date) {
      params.append('dates', date.replace(/-/g, ''));
    }

    const url = `${this.config.baseURL}/scoreboard${params.toString() ? `?${params}` : ''}`;
    const response = await this.fetchWithTimeout(url, { headers: this.headers });
    const data = await response.json();

    return this.transformGamesList(data);
  }

  /**
   * Fetch complete box score for a game
   */
  async getGame(gameId: string): Promise<NCAABoxScore> {
    const gameResponse = await this.fetchWithTimeout(
      `${this.config.baseURL}/summary?event=${gameId}`,
      { headers: this.headers }
    );
    const gameData = await gameResponse.json();

    return this.transformGameData(gameData);
  }

  /**
   * Transform ESPN games list response
   */
  private transformGamesList(data: any): NCAAGame[] {
    if (!data.events || !Array.isArray(data.events)) {
      return [];
    }

    return data.events.map((event: any) => {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

      return {
        id: event.id,
        date: event.date,
        name: event.name,
        shortName: event.shortName,
        status: {
          type: competition?.status?.type?.name || 'scheduled',
          detail: competition?.status?.type?.detail || '',
          completed: competition?.status?.type?.completed || false,
          inning: competition?.status?.period || 0,
          inningHalf: competition?.status?.type?.shortDetail?.includes('Top') ? 'top' : 'bottom',
        },
        teams: {
          home: {
            id: homeTeam?.team?.id || '',
            name: homeTeam?.team?.displayName || '',
            abbreviation: homeTeam?.team?.abbreviation || '',
            logo: homeTeam?.team?.logo || '',
            score: parseInt(homeTeam?.score || '0', 10),
            record: homeTeam?.records?.[0]?.summary || '0-0',
            conference: homeTeam?.team?.conferenceId || '',
          },
          away: {
            id: awayTeam?.team?.id || '',
            name: awayTeam?.team?.displayName || '',
            abbreviation: awayTeam?.team?.abbreviation || '',
            logo: awayTeam?.team?.logo || '',
            score: parseInt(awayTeam?.score || '0', 10),
            record: awayTeam?.records?.[0]?.summary || '0-0',
            conference: awayTeam?.team?.conferenceId || '',
          },
        },
        venue: {
          name: competition?.venue?.fullName || '',
          city: competition?.venue?.address?.city || '',
          state: competition?.venue?.address?.state || '',
        },
      };
    });
  }

  /**
   * Transform ESPN box score response into our format
   */
  private transformGameData(data: any): NCAABoxScore {
    const event = data.header;
    const competition = data.boxscore;
    const homeTeam = competition?.teams?.[0];
    const awayTeam = competition?.teams?.[1];

    // Helper to calculate batting average
    const calcAvg = (hits: number, atBats: number): string => {
      return atBats > 0 ? (hits / atBats).toFixed(3) : '.000';
    };

    // Helper to calculate ERA
    const calcERA = (earnedRuns: number, inningsPitched: number): string => {
      return inningsPitched > 0 ? ((earnedRuns * 9) / inningsPitched).toFixed(2) : '0.00';
    };

    // Transform batting lines
    const transformBatting = (players: any[]): BattingLine[] => {
      if (!players || !Array.isArray(players)) return [];

      return players.map((p: any) => ({
        name: p.athlete?.displayName || 'Unknown',
        position: p.athlete?.position?.abbreviation || '',
        atBats: parseInt(p.stats?.find((s: any) => s.name === 'AB')?.value || '0', 10),
        runs: parseInt(p.stats?.find((s: any) => s.name === 'R')?.value || '0', 10),
        hits: parseInt(p.stats?.find((s: any) => s.name === 'H')?.value || '0', 10),
        rbi: parseInt(p.stats?.find((s: any) => s.name === 'RBI')?.value || '0', 10),
        walks: parseInt(p.stats?.find((s: any) => s.name === 'BB')?.value || '0', 10),
        strikeouts: parseInt(p.stats?.find((s: any) => s.name === 'K')?.value || '0', 10),
        avg: calcAvg(
          parseInt(p.stats?.find((s: any) => s.name === 'H')?.value || '0', 10),
          parseInt(p.stats?.find((s: any) => s.name === 'AB')?.value || '0', 10)
        ),
      }));
    };

    // Transform pitching lines
    const transformPitching = (players: any[]): PitchingLine[] => {
      if (!players || !Array.isArray(players)) return [];

      return players.map((p: any) => ({
        name: p.athlete?.displayName || 'Unknown',
        decision: p.stats?.find((s: any) => s.name === 'W' || s.name === 'L' || s.name === 'SV')?.abbreviation || '',
        inningsPitched: parseFloat(p.stats?.find((s: any) => s.name === 'IP')?.value || '0'),
        hits: parseInt(p.stats?.find((s: any) => s.name === 'H')?.value || '0', 10),
        runs: parseInt(p.stats?.find((s: any) => s.name === 'R')?.value || '0', 10),
        earnedRuns: parseInt(p.stats?.find((s: any) => s.name === 'ER')?.value || '0', 10),
        walks: parseInt(p.stats?.find((s: any) => s.name === 'BB')?.value || '0', 10),
        strikeouts: parseInt(p.stats?.find((s: any) => s.name === 'K')?.value || '0', 10),
        era: calcERA(
          parseInt(p.stats?.find((s: any) => s.name === 'ER')?.value || '0', 10),
          parseFloat(p.stats?.find((s: any) => s.name === 'IP')?.value || '0')
        ),
      }));
    };

    // Transform team stats
    const transformTeamStats = (teamData: any): TeamStats => ({
      runs: parseInt(teamData?.statistics?.find((s: any) => s.name === 'runs')?.displayValue || '0', 10),
      hits: parseInt(teamData?.statistics?.find((s: any) => s.name === 'hits')?.displayValue || '0', 10),
      errors: parseInt(teamData?.statistics?.find((s: any) => s.name === 'errors')?.displayValue || '0', 10),
      leftOnBase: parseInt(teamData?.statistics?.find((s: any) => s.name === 'leftOnBase')?.displayValue || '0', 10),
    });

    return {
      gameId: event.id,
      status: {
        type: event.competitions?.[0]?.status?.type?.name || 'scheduled',
        detail: event.competitions?.[0]?.status?.type?.detail || '',
        completed: event.competitions?.[0]?.status?.type?.completed || false,
        inning: event.competitions?.[0]?.status?.period || 0,
        inningHalf: event.competitions?.[0]?.status?.type?.shortDetail?.includes('Top') ? 'top' : 'bottom',
      },
      teams: {
        home: {
          id: homeTeam?.team?.id || '',
          name: homeTeam?.team?.displayName || '',
          abbreviation: homeTeam?.team?.abbreviation || '',
          logo: homeTeam?.team?.logo || '',
          score: parseInt(homeTeam?.score || '0', 10),
          record: homeTeam?.team?.record || '0-0',
          conference: homeTeam?.team?.conferenceId || '',
        },
        away: {
          id: awayTeam?.team?.id || '',
          name: awayTeam?.team?.displayName || '',
          abbreviation: awayTeam?.team?.abbreviation || '',
          logo: awayTeam?.team?.logo || '',
          score: parseInt(awayTeam?.score || '0', 10),
          record: awayTeam?.team?.record || '0-0',
          conference: awayTeam?.team?.conferenceId || '',
        },
      },
      batting: {
        home: transformBatting(homeTeam?.statistics?.batting || []),
        away: transformBatting(awayTeam?.statistics?.batting || []),
      },
      pitching: {
        home: transformPitching(homeTeam?.statistics?.pitching || []),
        away: transformPitching(awayTeam?.statistics?.pitching || []),
      },
      teamStats: {
        home: transformTeamStats(homeTeam),
        away: transformTeamStats(awayTeam),
      },
      venue: {
        name: event.competitions?.[0]?.venue?.fullName || '',
        city: event.competitions?.[0]?.venue?.address?.city || '',
        state: event.competitions?.[0]?.venue?.address?.state || '',
      },
      dataSource: 'ESPN College Baseball API',
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
    };
  }

  /**
   * Fetch with timeout support
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`NCAA API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`NCAA API request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Factory function to create NCAA adapter
 */
export function createNCAAAdapter(config?: NCAAAdapterConfig): NCAAAdapter {
  return new NCAAAdapter(config);
}
