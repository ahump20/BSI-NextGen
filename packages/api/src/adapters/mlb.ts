/**
 * MLB Data Adapter
 * Uses MLB Stats API and SportsDataIO
 */

import type {
  Team,
  Game,
  Standing,
  ApiResponse,
  PitcherInfo,
  LinescoreSummary,
} from '@bsi/shared';
import {
  validateApiKey,
  getChicagoTimestamp,
  fetchWithTimeout,
  withProviderResilience,
  TeamSchema,
  StandingSchema,
  GameSchema,
  LinescoreSummarySchema,
} from '@bsi/shared';
import type { ZodType } from 'zod';

export class MLBAdapter {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://statsapi.mlb.com/api/v1';
  private readonly sportsDataIOKey: string;

  private filterValid<T>(items: T[], schema: ZodType<T>) {
    const valid: T[] = [];
    let rejected = 0;

    items.forEach((item) => {
      const result = schema.safeParse(item);
      if (result.success) {
        valid.push(result.data);
      } else {
        rejected += 1;
      }
    });

    return {
      valid,
      error: rejected > 0 ? `Filtered ${rejected} invalid records` : undefined,
    };
  }

  constructor() {
    // MLB Stats API is free, but we also support SportsDataIO
    this.sportsDataIOKey = validateApiKey(
      process.env.SPORTSDATAIO_API_KEY,
      'SportsDataIO'
    );
    this.apiKey = ''; // MLB Stats API doesn't require key
  }

  /**
   * Get current MLB season year
   * MLB season runs Feb-Oct, so we use current year unless in Nov-Jan
   */
  private getCurrentSeason(): number {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    // MLB season: Feb-Oct
    // If in Nov-Jan (months 10-12, 0), use next year; else use current year
    return month >= 10 ? now.getFullYear() + 1 : now.getFullYear();
  }

  /**
   * Get all MLB teams
  */
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return withProviderResilience('MLB', async () => {
      const upstreamResponse = await fetchWithTimeout(`${this.baseUrl}/teams?sportId=1`, {}, 10000);

      if (!upstreamResponse.ok) {
        throw new Error(`MLB API error: ${upstreamResponse.statusText}`);
      }

      const data = await upstreamResponse.json() as any;

      const teams: Team[] = data.teams.map((team: any) => ({
        id: team.id.toString(),
        name: team.name,
        abbreviation: team.abbreviation,
        city: team.locationName,
        logo: `https://www.mlbstatic.com/team-logos/${team.id}.svg`,
        division: team.division?.name,
        conference: team.league?.name,
      }));

      const { valid, error } = this.filterValid(teams, TeamSchema);

      const apiResponse: ApiResponse<Team[]> = {
        data: valid,
        source: {
          provider: 'MLB Stats API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
        error,
      };

      return apiResponse;
    });
  }

  /**
   * Get standings for a specific division or all MLB
   */
  async getStandings(divisionId?: string): Promise<ApiResponse<Standing[]>> {
    return withProviderResilience('MLB', async () => {
      const currentSeason = this.getCurrentSeason();
      const url = divisionId
        ? `${this.baseUrl}/standings?leagueId=103,104&season=${currentSeason}&standingsTypes=regularSeason&divisionId=${divisionId}`
        : `${this.baseUrl}/standings?leagueId=103,104&season=${currentSeason}&standingsTypes=regularSeason`;

      const upstreamResponse = await fetchWithTimeout(url, {}, 10000);

      if (!upstreamResponse.ok) {
        throw new Error(`MLB API error: ${upstreamResponse.statusText}`);
      }

      const data = await upstreamResponse.json() as any;

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

      const { valid, error } = this.filterValid(standings, StandingSchema);

      return {
        data: valid,
        source: {
          provider: 'MLB Stats API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
        error,
      };
    });
  }

  /**
   * Get live/scheduled games for a specific date
   */
  async getGames(date?: string): Promise<ApiResponse<Game[]>> {
    return withProviderResilience('MLB', async () => {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const url = `${this.baseUrl}/schedule?sportId=1&date=${targetDate}`;

      const upstreamResponse = await fetchWithTimeout(url, {}, 10000);

      if (!upstreamResponse.ok) {
        throw new Error(`MLB API error: ${upstreamResponse.statusText}`);
      }

      const data = await upstreamResponse.json() as any;

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
        period: game.linescore?.currentInning
          ? `${game.linescore.currentInning}${game.linescore.inningHalf}`
          : undefined,
        venue: game.venue?.name,
        broadcasters: game.broadcasts?.map((broadcast: any) => broadcast.name).filter(Boolean) || undefined,
        probablePitchers: this.mapProbablePitchers(game.probablePitchers),
        linescore: this.mapLinescore(game.linescore, game.teams),
      })) || [];

      const { valid, error } = this.filterValid<Game>(games, GameSchema as unknown as ZodType<Game>);
      const validGames: Game[] = valid;

      const apiResponse: ApiResponse<Game[]> = {
        data: validGames,
        source: {
          provider: 'MLB Stats API',
          timestamp: getChicagoTimestamp(),
          confidence: 1.0,
        },
        error,
      };

      return apiResponse;
    });
  }

  /**
   * Get box score/linescore snapshot for a specific game
   */
  async getBoxScore(gameId: string): Promise<ApiResponse<Game>> {
    return withProviderResilience('MLB', async () => {
      const upstreamResponse = await fetchWithTimeout(`${this.baseUrl}/game/${gameId}/linescore`, {}, 10000);

      if (!upstreamResponse.ok) {
        throw new Error(`MLB API error: ${upstreamResponse.statusText}`);
      }

      const data = await upstreamResponse.json() as any;
      const homeTeam = data.teams?.home?.team;
      const awayTeam = data.teams?.away?.team;

      const game: Game = {
        id: gameId,
        sport: 'MLB',
        date: data.gameDate || new Date().toISOString(),
        status: this.mapGameStatus(data.game?.status?.statusCode || data.currentInningState),
        homeTeam: {
          id: (homeTeam?.id ?? '').toString(),
          name: homeTeam?.name || 'Home',
          abbreviation: homeTeam?.abbreviation || homeTeam?.teamCode || 'HOME',
          city: homeTeam?.locationName || 'Home',
          logo: homeTeam?.id ? `https://www.mlbstatic.com/team-logos/${homeTeam.id}.svg` : undefined,
        },
        awayTeam: {
          id: (awayTeam?.id ?? '').toString(),
          name: awayTeam?.name || 'Away',
          abbreviation: awayTeam?.abbreviation || awayTeam?.teamCode || 'AWY',
          city: awayTeam?.locationName || 'Away',
          logo: awayTeam?.id ? `https://www.mlbstatic.com/team-logos/${awayTeam.id}.svg` : undefined,
        },
        homeScore: data.teams?.home?.runs ?? 0,
        awayScore: data.teams?.away?.runs ?? 0,
        period: data.currentInning ? `${data.currentInning}${data.inningHalf || ''}` : undefined,
        linescore: this.mapLinescore(data, data.teams),
      };

      const parsed = GameSchema.safeParse(game);
      if (!parsed.success) {
        throw new Error('Invalid MLB box score payload from upstream');
      }

      const normalizedGame: Game = parsed.data as Game;

      const apiResponse: ApiResponse<Game> = {
        data: normalizedGame,
        source: {
          provider: 'MLB Stats API',
          timestamp: getChicagoTimestamp(),
          confidence: 0.95,
        },
      };

      return apiResponse;
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

  private mapProbablePitchers(probable: any): Game['probablePitchers'] | undefined {
    if (!probable?.home && !probable?.away) {
      return undefined;
    }

    const home = this.toPitcherInfo(probable.home);
    const away = this.toPitcherInfo(probable.away);

    if (!home && !away) {
      return undefined;
    }

    return { home, away };
  }

  private toPitcherInfo(pitcher: any): PitcherInfo | undefined {
    if (!pitcher) {
      return undefined;
    }

    const name = [pitcher.firstName, pitcher.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (!name) {
      return undefined;
    }

    const stats = pitcher.stats?.pitching || pitcher.seasonStats?.pitching;

    const parseNumber = (value: any): number | undefined => {
      if (value === null || value === undefined) {
        return undefined;
      }

      const num = typeof value === 'string' ? parseFloat(value) : Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    const info: PitcherInfo = {
      name,
      throws: pitcher.pitchHand?.description || pitcher.pitchHand?.code,
      wins: parseNumber(stats?.wins),
      losses: parseNumber(stats?.losses),
      era: parseNumber(stats?.era),
    };

    return info;
  }

  private mapLinescore(linescore: any, teams: any): LinescoreSummary | undefined {
    if (!linescore) {
      return undefined;
    }

    const innings: LinescoreSummary['innings'] = Array.isArray(linescore.innings)
      ? linescore.innings.map((inning: any) => ({
          number: inning.num,
          home: inning.home?.runs ?? null,
          away: inning.away?.runs ?? null,
        }))
      : [];

    const totals: LinescoreSummary['totals'] = {
      home: {
        runs: linescore.teams?.home?.runs ?? teams?.home?.score ?? 0,
        hits: linescore.teams?.home?.hits ?? 0,
        errors: linescore.teams?.home?.errors ?? 0,
      },
      away: {
        runs: linescore.teams?.away?.runs ?? teams?.away?.score ?? 0,
        hits: linescore.teams?.away?.hits ?? 0,
        errors: linescore.teams?.away?.errors ?? 0,
      },
    };

    const summary: LinescoreSummary = {
      currentInning: linescore.currentInning ?? undefined,
      inningState: linescore.inningState || linescore.inningHalf || undefined,
      innings,
      totals,
    };

    const parsed = LinescoreSummarySchema.safeParse(summary);
    if (!parsed.success) {
      return undefined;
    }

    return parsed.data as LinescoreSummary;
  }
}
