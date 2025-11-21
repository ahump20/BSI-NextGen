/**
 * D1Baseball Rankings & Standings Adapter
 * Fetches college baseball rankings and conference standings
 *
 * Data Source: D1Baseball.com (Top 25 rankings + conference standings)
 * Timezone: America/Chicago
 * Update Frequency: Weekly for rankings, daily for standings
 */

export interface D1BaseballRanking {
  rank: number;
  previousRank?: number;
  team: {
    id: string;
    name: string;
    school: string;
    conference: string;
    logo?: string;
  };
  record: string; // e.g., "25-5"
  conferenceRecord?: string; // e.g., "12-3"
  points?: number;
  firstPlaceVotes?: number;
  lastWeekResult?: string; // e.g., "3-1"
}

export interface ConferenceStandings {
  conference: string;
  teams: StandingsTeam[];
  lastUpdated: string;
}

export interface StandingsTeam {
  rank: number;
  team: {
    id: string;
    name: string;
    school: string;
    logo?: string;
  };
  overallRecord: {
    wins: number;
    losses: number;
    percentage: string;
  };
  conferenceRecord: {
    wins: number;
    losses: number;
    percentage: string;
  };
  homeRecord?: string;
  awayRecord?: string;
  streak?: string; // e.g., "W5", "L2"
  runsScored?: number;
  runsAllowed?: number;
  runDifferential?: number;
}

/**
 * D1Baseball Adapter Configuration
 */
interface D1BaseballAdapterConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export class D1BaseballAdapter {
  private readonly config: Required<D1BaseballAdapterConfig>;
  private readonly headers: Record<string, string>;

  constructor(config: D1BaseballAdapterConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.D1BASEBALL_API_KEY || '',
      baseURL: config.baseURL || 'https://d1baseball.com/api',
      timeout: config.timeout || 10000,
      cache: config.cache !== false,
      cacheTTL: config.cacheTTL || 3600, // 1 hour default
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
   * Fetch Top 25 rankings from D1Baseball
   */
  async getRankings(week?: string): Promise<D1BaseballRanking[]> {
    try {
      const params = new URLSearchParams();
      if (week) {
        params.append('week', week);
      }

      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}/rankings?${params}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.warn(`D1Baseball API error: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return this.transformRankings(data);
    } catch (error) {
      console.error('[D1Baseball Adapter] Failed to fetch rankings:', error);
      return [];
    }
  }

  /**
   * Fetch conference standings
   */
  async getConferenceStandings(conference: string): Promise<ConferenceStandings | null> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}/standings/${encodeURIComponent(conference)}`,
        { headers: this.headers }
      );

      if (!response.ok) {
        console.warn(`D1Baseball API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return this.transformStandings(conference, data);
    } catch (error) {
      console.error('[D1Baseball Adapter] Failed to fetch standings:', error);
      return null;
    }
  }

  /**
   * Fetch all conference standings
   */
  async getAllConferences(): Promise<string[]> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseURL}/conferences`,
        { headers: this.headers }
      );

      if (!response.ok) {
        return this.getDefaultConferences();
      }

      const data = await response.json();
      return data.conferences || this.getDefaultConferences();
    } catch (error) {
      console.error('[D1Baseball Adapter] Failed to fetch conferences:', error);
      return this.getDefaultConferences();
    }
  }

  /**
   * Private: Transform rankings data
   */
  private transformRankings(data: any): D1BaseballRanking[] {
    if (!data.rankings || !Array.isArray(data.rankings)) {
      return [];
    }

    return data.rankings.map((r: any, index: number) => ({
      rank: r.rank || index + 1,
      previousRank: r.previousRank,
      team: {
        id: r.team?.id || '',
        name: r.team?.name || '',
        school: r.team?.school || r.team?.name || '',
        conference: r.team?.conference || '',
        logo: r.team?.logo,
      },
      record: r.record || '0-0',
      conferenceRecord: r.conferenceRecord,
      points: r.points,
      firstPlaceVotes: r.firstPlaceVotes || 0,
      lastWeekResult: r.lastWeekResult,
    }));
  }

  /**
   * Private: Transform standings data
   */
  private transformStandings(conference: string, data: any): ConferenceStandings {
    const teams: StandingsTeam[] = (data.teams || []).map((t: any, index: number) => {
      const overallWins = t.overallWins || 0;
      const overallLosses = t.overallLosses || 0;
      const confWins = t.conferenceWins || 0;
      const confLosses = t.conferenceLosses || 0;

      const overallPct = overallWins + overallLosses > 0
        ? (overallWins / (overallWins + overallLosses)).toFixed(3)
        : '.000';

      const confPct = confWins + confLosses > 0
        ? (confWins / (confWins + confLosses)).toFixed(3)
        : '.000';

      return {
        rank: t.rank || index + 1,
        team: {
          id: t.team?.id || '',
          name: t.team?.name || '',
          school: t.team?.school || t.team?.name || '',
          logo: t.team?.logo,
        },
        overallRecord: {
          wins: overallWins,
          losses: overallLosses,
          percentage: overallPct,
        },
        conferenceRecord: {
          wins: confWins,
          losses: confLosses,
          percentage: confPct,
        },
        homeRecord: t.homeRecord,
        awayRecord: t.awayRecord,
        streak: t.streak,
        runsScored: t.runsScored,
        runsAllowed: t.runsAllowed,
        runDifferential: t.runDifferential,
      };
    });

    return {
      conference,
      teams,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Private: Get default Power 5 conferences
   */
  private getDefaultConferences(): string[] {
    return [
      'SEC',
      'ACC',
      'Big 12',
      'Big Ten',
      'Pac-12',
      'Big East',
      'American',
      'Conference USA',
      'Mountain West',
      'Sun Belt',
      'WAC',
      'MAAC',
      'Atlantic 10',
      'Big West',
      'Ivy League',
    ];
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
 * Factory function to create D1Baseball adapter instance
 */
export function createD1BaseballAdapter(config?: D1BaseballAdapterConfig): D1BaseballAdapter {
  return new D1BaseballAdapter(config);
}
