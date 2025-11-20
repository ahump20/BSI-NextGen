/**
 * NBA Data Adapter
 * Uses SportsDataIO for NBA data
 */

import type { Team, Game, Standing, ApiResponse } from '@bsi/shared';
import { validateApiKey, retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class NBAAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.sportsdata.io/v3/nba';

  constructor(apiKey?: string) {
    this.apiKey = validateApiKey(
      apiKey || process.env.SPORTSDATAIO_API_KEY,
      'SportsDataIO (NBA)'
    );
  }

  /**
   * Get current NBA season year
   * NBA season runs Oct-Jun, so we use the year the season started
   */
  private getCurrentSeason(): string {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    // NBA season runs Oct-Jun
    // If Jul-Sep (months 6-8), use current year; else use previous year if before Oct
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
      const response = await fetch(`${this.baseUrl}/scores/json/Teams`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`NBA API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      const teams: Team[] = data.map((team: any) => ({
        id: team.TeamID.toString(),
        name: team.Name,
        abbreviation: team.Key,
        city: team.City,
        logo: team.WikipediaLogoUrl,
        conference: team.Conference,
        division: team.Division,
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
   * Get NBA standings for current season
   */
  async getStandings(season?: string): Promise<ApiResponse<Standing[]>> {
    return retryWithBackoff(async () => {
      // Use "current" endpoint for latest data, or specific season if provided
      const endpoint = season
        ? `${this.baseUrl}/scores/json/Standings/${season}`
        : `${this.baseUrl}/scores/json/Standings/${this.getCurrentSeason()}`;

      const response = await fetch(endpoint, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`NBA API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      // Log season being returned vs requested for debugging
      console.log(`[NBA Adapter] Requested season: ${this.getCurrentSeason()}, Response count: ${data.length}`);

      const standings: Standing[] = data.map((team: any) => ({
        team: {
          id: team.TeamID.toString(),
          name: team.Name,
          abbreviation: team.Key,
          city: team.City,
          conference: team.Conference,
          division: team.Division,
        },
        wins: team.Wins,
        losses: team.Losses,
        winPercentage: team.Percentage,
        gamesBack: team.ConferenceRank > 1 ? parseFloat(team.GamesBack || '0') : 0,
        streak: team.Streak,
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
   * Get scores for a specific date
   */
  async getGames(date?: string): Promise<ApiResponse<Game[]>> {
    return retryWithBackoff(async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const response = await fetch(`${this.baseUrl}/scores/json/GamesByDate/${targetDate}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`NBA API error: ${response.statusText}`);
      }

      const data = await response.json() as any;

      const games: Game[] = data.map((game: any) => ({
        id: game.GameID.toString(),
        sport: 'NBA' as const,
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
        homeScore: game.HomeTeamScore || 0,
        awayScore: game.AwayTeamScore || 0,
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
