/**
 * NCAA Football Data Adapter
 * Uses ESPN API for college football data
 */

import type { Team, Game, Standing, ApiResponse } from '@bsi/shared';
import { retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class NCAAFootballAdapter {
  private readonly baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/college-football';

  constructor() {
    // ESPN API is public
  }

  /**
   * Get all FBS teams
   */
  async getTeams(group?: string): Promise<ApiResponse<Team[]>> {
    return retryWithBackoff(async () => {
      const url = group
        ? `${this.baseUrl}/teams?group=${group}`
        : `${this.baseUrl}/teams?group=80`; // Default to FBS

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      const teams: Team[] = [];

      data.sports?.[0]?.leagues?.[0]?.teams?.forEach((teamObj: any) => {
        const team = teamObj.team;
        teams.push({
          id: team.id,
          name: team.displayName,
          abbreviation: team.abbreviation,
          city: team.location,
          logo: team.logos?.[0]?.href,
          conference: team.groups?.[0]?.name,
        });
      });

      return {
        data: teams,
        source: {
          provider: 'ESPN API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  /**
   * Get conference standings
   */
  async getStandings(conference?: string): Promise<ApiResponse<Standing[]>> {
    return retryWithBackoff(async () => {
      const url = conference
        ? `${this.baseUrl}/standings?group=${conference}`
        : `${this.baseUrl}/standings`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      const standings: Standing[] = [];

      data.children?.forEach((conf: any) => {
        conf.standings?.entries?.forEach((entry: any) => {
          const stats = entry.stats || [];
          standings.push({
            team: {
              id: entry.team?.id || '',
              name: entry.team?.displayName || '',
              abbreviation: entry.team?.abbreviation || '',
              city: entry.team?.location || '',
              logo: entry.team?.logos?.[0]?.href,
              conference: conf.name,
            },
            wins: parseInt(stats.find((s: any) => s.name === 'wins')?.value || '0'),
            losses: parseInt(stats.find((s: any) => s.name === 'losses')?.value || '0'),
            winPercentage: parseFloat(stats.find((s: any) => s.name === 'winPercent')?.value || '0'),
            streak: stats.find((s: any) => s.name === 'streak')?.displayValue,
          });
        });
      });

      return {
        data: standings,
        source: {
          provider: 'ESPN API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  /**
   * Get scores for a specific week
   */
  async getGames(params?: { week?: number; season?: number } | number): Promise<ApiResponse<Game[]>> {
    // Support both object param and legacy number param for backwards compatibility
    const week = typeof params === 'object' ? params?.week : params;
    const season = typeof params === 'object' ? (params?.season ?? 2025) : 2025;

    return retryWithBackoff(async () => {
      const url = week
        ? `${this.baseUrl}/scoreboard?week=${week}&seasontype=2&year=${season}`
        : `${this.baseUrl}/scoreboard`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      const games: Game[] = (data.events || []).map((event: any) => {
        const competition = event.competitions?.[0];
        const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

        return {
          id: event.id,
          sport: 'NCAA_FOOTBALL' as const,
          date: event.date,
          status: this.mapGameStatus(event.status?.type?.name),
          homeTeam: {
            id: homeTeam?.team?.id || '',
            name: homeTeam?.team?.displayName || '',
            abbreviation: homeTeam?.team?.abbreviation || '',
            city: homeTeam?.team?.location || '',
            logo: homeTeam?.team?.logo || '',
          },
          awayTeam: {
            id: awayTeam?.team?.id || '',
            name: awayTeam?.team?.displayName || '',
            abbreviation: awayTeam?.team?.abbreviation || '',
            city: awayTeam?.team?.location || '',
            logo: awayTeam?.team?.logo || '',
          },
          homeScore: parseInt(homeTeam?.score || '0'),
          awayScore: parseInt(awayTeam?.score || '0'),
          period: event.status?.period ? `Q${event.status.period}` : undefined,
          venue: competition?.venue?.fullName,
        };
      });

      return {
        data: games,
        source: {
          provider: 'ESPN API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  private mapGameStatus(status: string): Game['status'] {
    switch (status?.toLowerCase()) {
      case 'status.type.final':
        return 'final';
      case 'status.type.inprogress':
        return 'live';
      case 'status.type.scheduled':
      case 'status.type.pre':
        return 'scheduled';
      case 'status.type.postponed':
        return 'postponed';
      case 'status.type.canceled':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }
}
