import type {
  D1BaseballRanking,
  ConferenceStandings,
  ConferenceTeam,
} from '@bsi/shared';

export interface D1BaseballAdapterConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
}

export class D1BaseballAdapter {
  private config: Required<D1BaseballAdapterConfig>;
  private headers: Record<string, string>;

  constructor(config: D1BaseballAdapterConfig = {}) {
    this.config = {
      apiKey: config.apiKey || '',
      baseURL: config.baseURL || 'https://d1baseball.com/api',
      timeout: config.timeout || 10000,
    };

    this.headers = {
      'User-Agent': 'BlazeSportsIntel/1.0',
      'Accept': 'application/json',
      ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
    };
  }

  /**
   * Fetch Top 25 rankings
   */
  async getRankings(week?: string): Promise<D1BaseballRanking[]> {
    const params = new URLSearchParams();
    if (week) {
      params.append('week', week);
    }

    const url = `${this.config.baseURL}/rankings${params.toString() ? `?${params}` : ''}`;
    const response = await this.fetchWithTimeout(url, { headers: this.headers });
    const data = await response.json();

    return this.transformRankings(data);
  }

  /**
   * Fetch conference standings
   */
  async getConferenceStandings(conference: string): Promise<ConferenceStandings | null> {
    const url = `${this.config.baseURL}/standings/${encodeURIComponent(conference)}`;

    try {
      const response = await this.fetchWithTimeout(url, { headers: this.headers });
      const data = await response.json();

      return this.transformStandings(conference, data);
    } catch (error) {
      console.error(`Failed to fetch standings for ${conference}:`, error);
      return null;
    }
  }

  /**
   * Fetch all conference standings
   */
  async getAllConferenceStandings(): Promise<ConferenceStandings[]> {
    // Major D1 conferences
    const conferences = [
      'ACC', 'SEC', 'Big 12', 'Big Ten', 'Pac-12',
      'American', 'Conference USA', 'MAC', 'Mountain West',
      'Sun Belt', 'WAC', 'Big West', 'ASUN', 'Atlantic 10',
      'Big East', 'Colonial', 'Horizon', 'Ivy League',
      'MAAC', 'MEAC', 'Missouri Valley', 'Northeast',
      'Ohio Valley', 'Patriot', 'Southern', 'Southland',
      'SWAC', 'Summit', 'West Coast',
    ];

    const standingsPromises = conferences.map((conf) =>
      this.getConferenceStandings(conf)
    );

    const results = await Promise.allSettled(standingsPromises);

    return results
      .filter((result): result is PromiseFulfilledResult<ConferenceStandings | null> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map((result) => result.value!);
  }

  /**
   * Transform D1Baseball rankings response
   */
  private transformRankings(data: any): D1BaseballRanking[] {
    if (!data.rankings || !Array.isArray(data.rankings)) {
      return [];
    }

    return data.rankings.map((team: any, index: number) => {
      const previousRank = team.previousRank || 0;
      const currentRank = index + 1;

      let rankMovement: 'up' | 'down' | 'same' | 'new' = 'same';
      if (previousRank === 0) {
        rankMovement = 'new';
      } else if (currentRank < previousRank) {
        rankMovement = 'up';
      } else if (currentRank > previousRank) {
        rankMovement = 'down';
      }

      return {
        rank: currentRank,
        team: {
          id: team.teamId || team.id || `${team.school}-${currentRank}`,
          school: team.school || team.name,
          conference: team.conference || '',
          logo: team.logo || '',
        },
        record: {
          overall: team.record || '0-0',
          conference: team.conferenceRecord || '0-0',
          wins: parseInt(team.wins || '0', 10),
          losses: parseInt(team.losses || '0', 10),
        },
        previousRank,
        rankMovement,
        firstPlaceVotes: parseInt(team.firstPlaceVotes || '0', 10),
        points: parseInt(team.points || '0', 10),
      };
    });
  }

  /**
   * Transform conference standings response
   */
  private transformStandings(conference: string, data: any): ConferenceStandings {
    const teams: ConferenceTeam[] = [];

    if (data.teams && Array.isArray(data.teams)) {
      teams.push(
        ...data.teams.map((team: any) => ({
          id: team.teamId || team.id || `${team.school}-${conference}`,
          school: team.school || team.name,
          logo: team.logo || '',
          record: {
            overall: team.overallRecord || '0-0',
            conference: team.conferenceRecord || '0-0',
            wins: parseInt(team.wins || '0', 10),
            losses: parseInt(team.losses || '0', 10),
            conferenceWins: parseInt(team.conferenceWins || '0', 10),
            conferenceLosses: parseInt(team.conferenceLosses || '0', 10),
            winPercentage: parseFloat(team.winPercentage || '0'),
            conferenceWinPercentage: parseFloat(team.conferenceWinPercentage || '0'),
          },
          stats: {
            runsScored: parseInt(team.runsScored || '0', 10),
            runsAllowed: parseInt(team.runsAllowed || '0', 10),
            homeRecord: team.homeRecord || '0-0',
            awayRecord: team.awayRecord || '0-0',
            streak: team.streak || '',
          },
        }))
      );
    }

    // Sort by conference win percentage, then overall win percentage
    teams.sort((a, b) => {
      if (b.record.conferenceWinPercentage !== a.record.conferenceWinPercentage) {
        return b.record.conferenceWinPercentage - a.record.conferenceWinPercentage;
      }
      return b.record.winPercentage - a.record.winPercentage;
    });

    return {
      conference,
      teams,
      lastUpdated: new Date().toISOString(),
      dataSource: 'D1Baseball.com',
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
        throw new Error(`D1Baseball API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`D1Baseball API request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Factory function to create D1Baseball adapter
 */
export function createD1BaseballAdapter(config?: D1BaseballAdapterConfig): D1BaseballAdapter {
  return new D1BaseballAdapter(config);
}
