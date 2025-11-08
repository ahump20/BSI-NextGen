/**
 * MLB Data Adapter
 * Uses MLB Stats API and SportsDataIO
 */

import type { Team, Game, Standing, ApiResponse, MLBGame, MLBBoxScore, MLBPlayByPlay, MLBPlayerStats, MLBInningScore } from '@bsi/shared';
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

      const data = await response.json() as any;

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

      const data = await response.json() as any;

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

      const data = await response.json() as any;

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

  /**
   * Get enhanced MLB games with box scores and play-by-play
   */
  async getEnhancedGames(date?: string): Promise<ApiResponse<MLBGame[]>> {
    const gamesResponse = await this.getGames(date);
    const enhancedGames = await Promise.all(
      gamesResponse.data.map(async (game) => {
        const mlbGame: MLBGame = { ...game, sport: 'MLB' };

        // Fetch box score for live and final games
        if (game.status === 'live' || game.status === 'final') {
          try {
            mlbGame.boxScore = await this.getBoxScore(game.id);
            mlbGame.playByPlay = await this.getPlayByPlay(game.id);
          } catch (error) {
            console.error(`Failed to fetch enhanced data for game ${game.id}:`, error);
          }
        }

        return mlbGame;
      })
    );

    return {
      data: enhancedGames,
      source: gamesResponse.source,
    };
  }

  /**
   * Get box score for a specific game
   */
  async getBoxScore(gameId: string): Promise<MLBBoxScore> {
    const url = `${this.baseUrl}/game/${gameId}/boxscore`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MLB boxscore API error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    // Parse linescore
    const linescore: MLBInningScore[] = data.linescore?.innings?.map((inning: any) => ({
      inning: inning.num,
      home: inning.home?.runs || 0,
      away: inning.away?.runs || 0,
    })) || [];

    // Parse team stats
    const homeTeamStats = {
      team: data.teams.home.team,
      teamStats: {
        hits: data.teams.home.teamStats?.batting?.hits || 0,
        runs: data.teams.home.teamStats?.batting?.runs || 0,
        errors: data.teams.home.teamStats?.fielding?.errors || 0,
        leftOnBase: data.teams.home.teamStats?.batting?.leftOnBase || 0,
      },
    };

    const awayTeamStats = {
      team: data.teams.away.team,
      teamStats: {
        hits: data.teams.away.teamStats?.batting?.hits || 0,
        runs: data.teams.away.teamStats?.batting?.runs || 0,
        errors: data.teams.away.teamStats?.fielding?.errors || 0,
        leftOnBase: data.teams.away.teamStats?.batting?.leftOnBase || 0,
      },
    };

    // Parse player stats
    const homePlayers = this.parsePlayerStats(data.teams.home.players);
    const awayPlayers = this.parsePlayerStats(data.teams.away.players);

    return {
      teams: {
        home: homeTeamStats,
        away: awayTeamStats,
      },
      players: {
        home: homePlayers,
        away: awayPlayers,
      },
      linescore,
    };
  }

  /**
   * Get play-by-play data for a specific game
   */
  async getPlayByPlay(gameId: string): Promise<MLBPlayByPlay[]> {
    const url = `${this.baseUrl}/game/${gameId}/playByPlay`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`MLB play-by-play API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const playByPlay: MLBPlayByPlay[] = [];

    data.allPlays?.forEach((play: any) => {
      const inning = play.about?.inning || 1;
      const halfInning = play.about?.halfInning === 'top' ? 'top' : 'bottom';

      let inningData = playByPlay.find(
        (pbp) => pbp.inning === inning && pbp.halfInning === halfInning
      );

      if (!inningData) {
        inningData = {
          inning,
          halfInning,
          events: [],
        };
        playByPlay.push(inningData);
      }

      inningData.events.push({
        id: play.atBatIndex?.toString() || '',
        description: play.result?.description || 'Unknown play',
        result: play.result?.event || 'Unknown',
        batter: play.matchup?.batter?.fullName || 'Unknown',
        pitcher: play.matchup?.pitcher?.fullName || 'Unknown',
        runners: play.runners?.map((r: any) => r.details?.runner?.fullName).filter(Boolean),
        outs: play.count?.outs || 0,
        runsScored: play.result?.rbi || 0,
      });
    });

    return playByPlay;
  }

  /**
   * Parse player stats from box score data
   */
  private parsePlayerStats(players: any): MLBPlayerStats[] {
    const playerStats: MLBPlayerStats[] = [];

    Object.values(players || {}).forEach((player: any) => {
      if (!player.person) return;

      const stats: MLBPlayerStats = {
        player: {
          id: player.person.id.toString(),
          name: player.person.fullName,
          team: '',
          position: player.position?.abbreviation || 'Unknown',
        },
        position: player.position?.abbreviation || 'Unknown',
      };

      // Batting stats
      if (player.stats?.batting) {
        const batting = player.stats.batting;
        stats.battingStats = {
          atBats: batting.atBats || 0,
          runs: batting.runs || 0,
          hits: batting.hits || 0,
          rbi: batting.rbi || 0,
          walks: batting.baseOnBalls || 0,
          strikeouts: batting.strikeOuts || 0,
          avg: parseFloat(batting.avg || '0'),
        };
      }

      // Pitching stats
      if (player.stats?.pitching) {
        const pitching = player.stats.pitching;
        stats.pitchingStats = {
          inningsPitched: parseFloat(pitching.inningsPitched || '0'),
          hits: pitching.hits || 0,
          runs: pitching.runs || 0,
          earnedRuns: pitching.earnedRuns || 0,
          walks: pitching.baseOnBalls || 0,
          strikeouts: pitching.strikeOuts || 0,
          era: parseFloat(pitching.era || '0'),
          pitchCount: pitching.numberOfPitches || 0,
        };
      }

      playerStats.push(stats);
    });

    return playerStats;
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
