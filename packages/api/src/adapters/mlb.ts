/**
 * MLB Data Adapter
 * Uses MLB Stats API and SportsDataIO
 */

import type { Team, Game, Standing, ApiResponse } from '@bsi/shared';
import { validateApiKey, retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class MLBAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://statsapi.mlb.com/api/v1';
  private readonly sportsDataIOKey: string;

  constructor() {
    // MLB Stats API is free, but we also support SportsDataIO
    this.sportsDataIOKey = validateApiKey(
      process.env.SPORTSDATAIO_API_KEY,
      'SportsDataIO'
    );
    this.apiKey = ''; // MLB Stats API doesn't require key
  }

  /**
   * Get all MLB teams
   */
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return retryWithBackoff(async () => {
      const response = await fetch(`${this.baseUrl}/teams?sportId=1`);

      if (!response.ok) {
        throw new Error(`MLB API error: ${response.statusText}`);
      }

      const data = await response.json();

      const teams: Team[] = data.teams.map((team: any) => ({
        id: team.id.toString(),
        name: team.name,
        abbreviation: team.abbreviation,
        city: team.locationName,
        logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`,
        division: team.division?.name,
        conference: team.league?.name,
      }));

      return {
        data: teams,
        source: {
          provider: 'MLB Stats API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  /**
   * Get standings for a specific division or all MLB
   */
  async getStandings(divisionId?: string): Promise<ApiResponse<Standing[]>> {
    return retryWithBackoff(async () => {
      const url = divisionId
        ? `${this.baseUrl}/standings?leagueId=103,104&season=2025&standingsTypes=regularSeason&divisionId=${divisionId}`
        : `${this.baseUrl}/standings?leagueId=103,104&season=2025&standingsTypes=regularSeason`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`MLB API error: ${response.statusText}`);
      }

      const data = await response.json();

      const standings: Standing[] = [];

      data.records?.forEach((division: any) => {
        division.teamRecords?.forEach((record: any) => {
          standings.push({
            team: {
              id: record.team.id.toString(),
              name: record.team.name,
              abbreviation: record.team.abbreviation || '',
              city: record.team.locationName || '',
            },
            wins: record.wins,
            losses: record.losses,
            winPercentage: parseFloat(record.winningPercentage),
            gamesBack: parseFloat(record.gamesBack) || 0,
            streak: record.streak?.streakCode,
            lastTen: record.records?.splitRecords?.find((r: any) => r.type === 'lastTen')?.record,
          });
        });
      });

      return {
        data: standings,
        source: {
          provider: 'MLB Stats API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  /**
   * Get live/scheduled games for a specific date
   */
  async getGames(date?: string): Promise<ApiResponse<Game[]>> {
    return retryWithBackoff(async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const url = `${this.baseUrl}/schedule?sportId=1&date=${targetDate}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`MLB API error: ${response.statusText}`);
      }

      const data = await response.json();

      const games: Game[] = data.dates?.[0]?.games?.map((game: any) => ({
        id: game.gamePk.toString(),
        sport: 'MLB' as const,
        date: game.gameDate,
        status: this.mapGameStatus(game.status.statusCode),
        homeTeam: {
          id: game.teams.home.team.id.toString(),
          name: game.teams.home.team.name,
          abbreviation: game.teams.home.team.abbreviation,
          city: game.teams.home.team.locationName || '',
        },
        awayTeam: {
          id: game.teams.away.team.id.toString(),
          name: game.teams.away.team.name,
          abbreviation: game.teams.away.team.abbreviation,
          city: game.teams.away.team.locationName || '',
        },
        homeScore: game.teams.home.score || 0,
        awayScore: game.teams.away.score || 0,
        period: game.linescore?.currentInning ? `${game.linescore.currentInning}${game.linescore.inningHalf}` : undefined,
        venue: game.venue?.name,
      })) || [];

      return {
        data: games,
        source: {
          provider: 'MLB Stats API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  private mapGameStatus(statusCode: string): Game['status'] {
    switch (statusCode) {
      case 'F':
      case 'FT':
      case 'FR':
        return 'final';
      case 'I':
      case 'IR':
      case 'IA':
        return 'live';
      case 'P':
      case 'S':
      case 'PR':
        return 'scheduled';
      case 'PP':
      case 'PO':
        return 'postponed';
      case 'C':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }
}
