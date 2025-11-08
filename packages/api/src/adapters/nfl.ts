/**
 * NFL Data Adapter
 * Uses SportsDataIO for comprehensive NFL data
 */

import type { Team, Game, Standing, ApiResponse } from '@bsi/shared';
import { validateApiKey, retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class NFLAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.sportsdata.io/v3/nfl';

  constructor() {
    this.apiKey = validateApiKey(
      process.env.SPORTSDATAIO_API_KEY,
      'SportsDataIO (NFL)'
    );
  }

  /**
   * Get all NFL teams
   */
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return retryWithBackoff(async () => {
      const response = await fetch(`${this.baseUrl}/scores/json/Teams`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`NFL API error: ${response.statusText}`);
      }

      const data = await response.json();

      const teams: Team[] = data.map((team: any) => ({
        id: team.TeamID.toString(),
        name: team.Name,
        abbreviation: team.Key,
        city: team.City,
        logo: team.WikipediaLogoUrl,
        division: team.Division,
        conference: team.Conference,
      }));

      return {
        data: teams,
        source: {
          provider: 'SportsDataIO',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  /**
   * Get NFL standings for current season
   */
  async getStandings(season: number = 2025): Promise<ApiResponse<Standing[]>> {
    return retryWithBackoff(async () => {
      const response = await fetch(`${this.baseUrl}/scores/json/Standings/${season}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`NFL API error: ${response.statusText}`);
      }

      const data = await response.json();

      const standings: Standing[] = data.map((team: any) => ({
        team: {
          id: team.TeamID.toString(),
          name: team.Name,
          abbreviation: team.Team,
          city: team.City,
          division: team.Division,
          conference: team.Conference,
        },
        wins: team.Wins,
        losses: team.Losses,
        winPercentage: team.Percentage,
        streak: team.Streak > 0 ? `W${team.Streak}` : `L${Math.abs(team.Streak)}`,
      }));

      return {
        data: standings,
        source: {
          provider: 'SportsDataIO',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  /**
   * Get scores for a specific week
   */
  async getGames(season: number = 2025, week: number = 1): Promise<ApiResponse<Game[]>> {
    return retryWithBackoff(async () => {
      const response = await fetch(
        `${this.baseUrl}/scores/json/ScoresByWeek/${season}/${week}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`NFL API error: ${response.statusText}`);
      }

      const data = await response.json();

      const games: Game[] = data.map((game: any) => ({
        id: game.GameKey,
        sport: 'NFL' as const,
        date: game.DateTime,
        status: this.mapGameStatus(game.Status),
        homeTeam: {
          id: game.HomeTeamID?.toString() || '',
          name: game.HomeTeam,
          abbreviation: game.HomeTeam,
          city: '',
        },
        awayTeam: {
          id: game.AwayTeamID?.toString() || '',
          name: game.AwayTeam,
          abbreviation: game.AwayTeam,
          city: '',
        },
        homeScore: game.HomeScore || 0,
        awayScore: game.AwayScore || 0,
        period: game.Quarter ? `Q${game.Quarter}` : undefined,
        venue: game.StadiumDetails?.Name,
      }));

      return {
        data: games,
        source: {
          provider: 'SportsDataIO',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
      };
    });
  }

  private mapGameStatus(status: string): Game['status'] {
    switch (status) {
      case 'Final':
      case 'F/OT':
        return 'final';
      case 'InProgress':
      case 'Halftime':
        return 'live';
      case 'Scheduled':
        return 'scheduled';
      case 'Postponed':
        return 'postponed';
      case 'Canceled':
        return 'cancelled';
      default:
        return 'scheduled';
    }
  }
}
