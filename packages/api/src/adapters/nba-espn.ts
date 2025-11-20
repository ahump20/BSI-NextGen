/**
 * NBA Data Adapter (ESPN)
 * Uses ESPN API for current 2025-2026 season data
 */

import type { Team, Game, Standing, ApiResponse } from '@bsi/shared';
import { retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class NBAESPNAdapter {
  private readonly baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

  constructor() {
    // ESPN API is public
  }

  /**
   * Get current NBA season year
   * NBA season runs Oct-Jun, so we use the year the season started
   */
  private getCurrentSeason(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    // NBA season runs Oct-Jun
    // If Jul-Sep (months 6-8), use current year; else use current year if >= Oct
    return month >= 6 && month < 9
      ? now.getFullYear().toString()
      : month >= 9
        ? now.getFullYear().toString()
        : (now.getFullYear() - 1).toString();
  }

  /**
   * Get all NBA teams
   */
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return retryWithBackoff(async () => {
      const response = await fetch(`${this.baseUrl}/teams`, {
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
   * Get NBA standings for current 2025-2026 season
   */
  async getStandings(): Promise<ApiResponse<Standing[]>> {
    return retryWithBackoff(async () => {
      const response = await fetch(`${this.baseUrl}/standings`, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      console.log(`[NBA ESPN Adapter] Current season: ${this.getCurrentSeason()}, Standings count: ${data.children?.length || 0}`);

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
            gamesBack: parseFloat(stats.find((s: any) => s.name === 'gamesBehind')?.displayValue || '0'),
            streak: stats.find((s: any) => s.name === 'streak')?.displayValue,
          });
        });
      });

      return {
        data: standings,
        source: {
          provider: 'ESPN API (2025-2026 Season)',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  /**
   * Get scores for a specific date
   */
  async getGames(date?: string): Promise<ApiResponse<Game[]>> {
    return retryWithBackoff(async () => {
      const targetDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');

      const response = await fetch(`${this.baseUrl}/scoreboard?dates=${targetDate}`, {
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
          sport: 'NBA' as const,
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
