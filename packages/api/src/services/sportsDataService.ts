/**
 * Sports Data Service
 * Central orchestrator for all sports data
 */

import { MLBAdapter } from '../adapters/mlb';
import { NFLAdapter } from '../adapters/nfl';
import { NBAAdapter } from '../adapters/nba';
import { NCAAFootballAdapter } from '../adapters/ncaaFootball';
import { CollegeBaseballAdapter } from '../adapters/collegeBaseball';
import type { Sport, Team, Game, Standing, ApiResponse } from '@bsi/shared';

export class SportsDataService {
  private mlb: MLBAdapter;
  private nfl: NFLAdapter;
  private nba: NBAAdapter;
  private ncaaFootball: NCAAFootballAdapter;
  private collegeBaseball: CollegeBaseballAdapter;

  constructor() {
    this.mlb = new MLBAdapter();
    this.nfl = new NFLAdapter();
    this.nba = new NBAAdapter();
    this.ncaaFootball = new NCAAFootballAdapter();
    this.collegeBaseball = new CollegeBaseballAdapter();
  }

  /**
   * Get teams for a specific sport
   */
  async getTeams(sport: Sport): Promise<ApiResponse<Team[]>> {
    switch (sport) {
      case 'MLB':
        return this.mlb.getTeams();
      case 'NFL':
        return this.nfl.getTeams();
      case 'NBA':
        return this.nba.getTeams();
      case 'NCAA_FOOTBALL':
        return this.ncaaFootball.getTeams();
      case 'COLLEGE_BASEBALL':
        // College baseball teams come from games/standings
        return {
          data: [],
          source: {
            provider: 'ESPN API',
            timestamp: new Date().toISOString(),
            confidence: 1.0,
          },
        };
      default:
        throw new Error(`Unsupported sport: ${sport}`);
    }
  }

  /**
   * Get standings for a specific sport
   */
  async getStandings(sport: Sport, options?: any): Promise<ApiResponse<Standing[]>> {
    switch (sport) {
      case 'MLB':
        return this.mlb.getStandings(options?.divisionId);
      case 'NFL':
        return this.nfl.getStandings(options?.season || 2025);
      case 'NBA':
        return this.nba.getStandings(options?.season || '2025');
      case 'NCAA_FOOTBALL':
        return this.ncaaFootball.getStandings(options?.conference);
      case 'COLLEGE_BASEBALL':
        return this.collegeBaseball.getStandings(options?.conference);
      default:
        throw new Error(`Unsupported sport: ${sport}`);
    }
  }

  /**
   * Get games for a specific sport
   */
  async getGames(sport: Sport, options?: any): Promise<ApiResponse<Game[]>> {
    switch (sport) {
      case 'MLB':
        return this.mlb.getGames(options?.date);
      case 'NFL':
        return this.nfl.getGames(options?.season || 2025, options?.week || 1);
      case 'NBA':
        return this.nba.getGames(options?.date);
      case 'NCAA_FOOTBALL':
        return this.ncaaFootball.getGames(options?.week, options?.season || 2025);
      case 'COLLEGE_BASEBALL':
        return this.collegeBaseball.getGamesWithBoxScores(options?.date);
      default:
        throw new Error(`Unsupported sport: ${sport}`);
    }
  }

  /**
   * Get all live games across all sports
   */
  async getAllLiveGames(): Promise<ApiResponse<Game[]>> {
    const [mlbGames, nflGames, nbaGames, ncaaGames, cbGames] = await Promise.allSettled([
      this.mlb.getGames(),
      this.nfl.getGames(2025, 1),
      this.nba.getGames(),
      this.ncaaFootball.getGames(),
      this.collegeBaseball.getGamesWithBoxScores(),
    ]);

    const allGames: Game[] = [];

    if (mlbGames.status === 'fulfilled') {
      allGames.push(...mlbGames.value.data.filter(g => g.status === 'live'));
    }
    if (nflGames.status === 'fulfilled') {
      allGames.push(...nflGames.value.data.filter(g => g.status === 'live'));
    }
    if (nbaGames.status === 'fulfilled') {
      allGames.push(...nbaGames.value.data.filter(g => g.status === 'live'));
    }
    if (ncaaGames.status === 'fulfilled') {
      allGames.push(...ncaaGames.value.data.filter(g => g.status === 'live'));
    }
    if (cbGames.status === 'fulfilled') {
      allGames.push(...cbGames.value.data.filter(g => g.status === 'live'));
    }

    return {
      data: allGames,
      source: {
        provider: 'Blaze Sports Intel - Aggregated',
        timestamp: new Date().toISOString(),
        confidence: 1.0,
      },
    };
  }
}
