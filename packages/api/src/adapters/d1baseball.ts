/**
 * D1Baseball Rankings & Standings Adapter
 * Establishes college baseball authority with real-time conference standings
 * Uses NCAA/ESPN data sources for rankings and standings
 */

import type { D1BaseballRanking, ConferenceStanding, ApiResponse } from '@bsi/shared';
import { retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class D1BaseballAdapter {
  private readonly espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
  private readonly ncaaBaseUrl = 'https://stats.ncaa.org/rankings';

  constructor() {
    // Public APIs, no key needed
  }

  /**
   * Get national college baseball rankings (Top 25)
   * Uses ESPN's baseball rankings which aggregate from multiple polls
   */
  async getRankings(): Promise<ApiResponse<D1BaseballRanking[]>> {
    return retryWithBackoff(async () => {
      const url = `${this.espnBaseUrl}/rankings`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN Rankings API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      const rankings: D1BaseballRanking[] = [];

      // ESPN rankings structure
      if (data.rankings && data.rankings.length > 0) {
        const mainRanking = data.rankings[0]; // Use primary ranking
        mainRanking.ranks?.forEach((rank: any) => {
          const record = rank.team?.record || '0-0';
          const [wins, losses] = record.split('-').map((n: string) => parseInt(n) || 0);

          rankings.push({
            rank: rank.current || rank.rank || 0,
            team: rank.team?.displayName || rank.team?.name || 'Unknown',
            conference: rank.team?.conference?.name || 'Independent',
            record: record,
            wins: wins,
            losses: losses,
            previousRank: rank.previous,
            trend: this.getTrend(rank.current, rank.previous),
          });
        });
      }

      return {
        data: rankings,
        source: {
          provider: 'ESPN College Baseball Rankings',
          timestamp: getChicagoTimestamp(),
          confidence: 0.95,
        },
      };
    });
  }

  /**
   * Get conference standings for a specific conference
   */
  async getConferenceStandings(conference: string): Promise<ApiResponse<ConferenceStanding[]>> {
    return retryWithBackoff(async () => {
      // Map common conference names to ESPN group IDs
      const conferenceMap: Record<string, string> = {
        'ACC': '1',
        'SEC': '8',
        'Big 12': '4',
        'Big Ten': '5',
        'Pac-12': '9',
        'Big East': '2',
        'American': '151',
        'Conference USA': '12',
        'Mountain West': '17',
        'Sun Belt': '37',
        'MAC': '15',
        'WAC': '30',
      };

      const groupId = conferenceMap[conference] || conference;
      const url = `${this.espnBaseUrl}/standings?group=${groupId}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN Standings API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      const standings: ConferenceStanding[] = [];

      // Parse ESPN standings structure
      if (data.standings) {
        data.standings.forEach((group: any) => {
          group.entries?.forEach((entry: any) => {
            const team = entry.team;
            const stats = entry.stats || [];

            // Find relevant stats
            const overallRecord = stats.find((s: any) => s.name === 'overall')?.displayValue || '0-0';
            const confRecord = stats.find((s: any) => s.name === 'vs. Conf.')?.displayValue || '0-0';
            const streak = stats.find((s: any) => s.name === 'streak')?.displayValue;

            const [overallWins, overallLosses] = overallRecord.split('-').map((n: string) => parseInt(n) || 0);
            const [confWins, confLosses] = confRecord.split('-').map((n: string) => parseInt(n) || 0);

            standings.push({
              team: team?.displayName || team?.name || 'Unknown',
              conferenceRecord: confRecord,
              overallRecord: overallRecord,
              conferenceWins: confWins,
              conferenceLosses: confLosses,
              overallWins: overallWins,
              overallLosses: overallLosses,
              winPercentage: overallWins + overallLosses > 0 ? overallWins / (overallWins + overallLosses) : 0,
              streak: streak,
            });
          });
        });
      }

      return {
        data: standings,
        source: {
          provider: `ESPN ${conference} Standings`,
          timestamp: getChicagoTimestamp(),
          confidence: 0.95,
        },
      };
    });
  }

  /**
   * Get all conferences with standings
   */
  async getAllConferences(): Promise<ApiResponse<string[]>> {
    return {
      data: [
        'ACC',
        'SEC',
        'Big 12',
        'Big Ten',
        'Pac-12',
        'Big East',
        'American',
        'Conference USA',
        'Mountain West',
        'Sun Belt',
        'MAC',
        'WAC',
      ],
      source: {
        provider: 'BSI Static Data',
        timestamp: getChicagoTimestamp(),
        confidence: 1.0,
      },
    };
  }

  /**
   * Determine ranking trend (up/down/same)
   */
  private getTrend(current: number, previous?: number): 'up' | 'down' | 'same' | undefined {
    if (!previous) return undefined;
    if (current < previous) return 'up'; // Lower rank number = better
    if (current > previous) return 'down';
    return 'same';
  }
}
