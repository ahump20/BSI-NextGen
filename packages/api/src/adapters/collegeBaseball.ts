/**
 * College Baseball Data Adapter
 * PRIORITY: Fill the ESPN gap - provide FULL box scores, previews, and recaps
 * ESPN shows ONLY the score and inning - we show everything
 */

import type { Game, Team, Standing, ApiResponse, BattingLine, PitchingLine, CollegeBaseballGame } from '@bsi/shared';
import { validateApiKey, retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class CollegeBaseballAdapter {
  private readonly espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
  private readonly ncaaBaseUrl = 'https://stats.ncaa.org/rankings';

  constructor() {
    // ESPN API is public, no key needed
  }

  /**
   * Get college baseball teams
   */
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return retryWithBackoff(async () => {
      const url = `${this.espnBaseUrl}/teams`;

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

      const rawTeams = data.sports?.[0]?.leagues?.[0]?.teams || [];
      const teams: Team[] = rawTeams.map((item: any) => ({
        id: item.team?.id || '',
        name: item.team?.displayName || '',
        abbreviation: item.team?.abbreviation || '',
        city: item.team?.location || '',
        logo: item.team?.logos?.[0]?.href || '',
        conference: item.team?.groups?.[0]?.name,
      }));

      return {
        data: teams,
        source: {
          provider: 'ESPN API',
          timestamp: getChicagoTimestamp(),
          confidence: 0.95,
        },
      };
    });
  }

  /**
   * Get college baseball games with FULL box scores
   * This is what ESPN SHOULD provide but doesn't
   */
  async getGames(params?: { date?: string }): Promise<ApiResponse<Game[]>> {
    const date = params?.date;
    return this.getGamesWithBoxScores(date);
  }

  /**
   * Get college baseball games with FULL box scores (internal method)
   * This is what ESPN SHOULD provide but doesn't
   */
  private async getGamesWithBoxScores(date?: string): Promise<ApiResponse<Game[]>> {
    return retryWithBackoff(async () => {
      const targetDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
      const url = `${this.espnBaseUrl}/scoreboard?dates=${targetDate}`;

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

      const games: Game[] = await Promise.all(
        (data.events || []).map(async (event: any) => {
          const homeCompetitor = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
          const awayCompetitor = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');

          const game: Game = {
            id: event.id,
            sport: 'COLLEGE_BASEBALL',
            date: event.date,
            status: this.mapGameStatus(event.status?.type?.name),
            homeTeam: {
              id: homeCompetitor?.team?.id || '',
              name: homeCompetitor?.team?.displayName || '',
              abbreviation: homeCompetitor?.team?.abbreviation || '',
              city: homeCompetitor?.team?.location || '',
              logo: homeCompetitor?.team?.logo || '',
            },
            awayTeam: {
              id: awayCompetitor?.team?.id || '',
              name: awayCompetitor?.team?.displayName || '',
              abbreviation: awayCompetitor?.team?.abbreviation || '',
              city: awayCompetitor?.team?.location || '',
              logo: awayCompetitor?.team?.logo || '',
            },
            homeScore: parseInt(homeCompetitor?.score || '0'),
            awayScore: parseInt(awayCompetitor?.score || '0'),
            period: event.status?.period ? `Inning ${event.status.period}` : undefined,
            venue: event.competitions?.[0]?.venue?.fullName,
          };

          // Fetch full box score if game is final or live (store in metadata)
          if (game.status === 'final' || game.status === 'live') {
            try {
              const boxScore = await this.getBoxScore(event.id);
              // Store box score in metadata since it's not part of standard Game type
              (game as any).boxScore = boxScore;
            } catch (error) {
              console.error(`Failed to fetch box score for game ${event.id}:`, error);
            }
          }

          return game;
        })
      );

      return {
        data: games,
        source: {
          provider: 'ESPN API + Blaze Box Score Enhancement',
          timestamp: getChicagoTimestamp(),
          confidence: 0.95, // Slightly lower due to box score enrichment
        },
      };
    });
  }

  /**
   * Get FULL box score - batting and pitching lines
   * THIS IS THE KEY DIFFERENTIATOR FROM ESPN
   */
  private async getBoxScore(gameId: string): Promise<{ battingLines: BattingLine[]; pitchingLines: PitchingLine[] }> {
    const url = `${this.espnBaseUrl}/summary?event=${gameId}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN box score error: ${response.statusText}`);
    }

    const data = await response.json() as any;

    const battingLines: BattingLine[] = [];
    const pitchingLines: PitchingLine[] = [];

    // Extract batting statistics
    data.boxscore?.players?.forEach((team: any) => {
      team.statistics?.forEach((statGroup: any) => {
        if (statGroup.name === 'Batting') {
          statGroup.athletes?.forEach((athlete: any) => {
            const stats = athlete.stats || [];
            const ab = parseInt(stats[0] || '0');
            const h = parseInt(stats[2] || '0');
            battingLines.push({
              name: athlete.athlete?.displayName || 'Unknown',
              position: athlete.athlete?.position?.abbreviation || '',
              atBats: ab,
              runs: parseInt(stats[1] || '0'),
              hits: h,
              rbi: parseInt(stats[3] || '0'),
              walks: parseInt(stats[4] || '0'),
              strikeouts: parseInt(stats[5] || '0'),
              avg: ab > 0 ? (h / ab).toFixed(3) : '.000',
            });
          });
        }

        if (statGroup.name === 'Pitching') {
          statGroup.athletes?.forEach((athlete: any) => {
            const stats = athlete.stats || [];
            const ip = parseFloat(stats[0] || '0');
            const er = parseInt(stats[3] || '0');
            pitchingLines.push({
              name: athlete.athlete?.displayName || 'Unknown',
              decision: athlete.athlete?.displayValue || '',
              inningsPitched: ip,
              hits: parseInt(stats[1] || '0'),
              runs: parseInt(stats[2] || '0'),
              earnedRuns: er,
              walks: parseInt(stats[4] || '0'),
              strikeouts: parseInt(stats[5] || '0'),
              era: ip > 0 ? ((er * 9) / ip).toFixed(2) : '0.00',
            });
          });
        }
      });
    });

    return { battingLines, pitchingLines };
  }

  /**
   * Get conference standings
   */
  async getStandings(conference?: string): Promise<ApiResponse<Standing[]>> {
    return retryWithBackoff(async () => {
      // ESPN doesn't provide great standings for college baseball
      // We'll need to aggregate from game results or use NCAA direct
      const url = conference
        ? `${this.espnBaseUrl}/standings?group=${conference}`
        : `${this.espnBaseUrl}/standings`;

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

      // Transform ESPN standings to standard Standing type
      const rawStandings = data.standings || [];
      const standings: Standing[] = rawStandings.flatMap((conference: any) =>
        (conference.standings?.entries || []).map((entry: any) => {
          const stats = entry.stats || [];
          const wins = stats.find((s: any) => s.name === 'wins')?.value || 0;
          const losses = stats.find((s: any) => s.name === 'losses')?.value || 0;
          const gamesPlayed = wins + losses;

          return {
            team: {
              id: entry.team?.id || '',
              name: entry.team?.displayName || '',
              abbreviation: entry.team?.abbreviation || '',
              city: entry.team?.location || '',
              logo: entry.team?.logos?.[0]?.href || '',
              conference: conference.name,
            },
            wins,
            losses,
            winPercentage: gamesPlayed > 0 ? wins / gamesPlayed : 0,
            gamesBack: stats.find((s: any) => s.name === 'gamesBehind')?.value || 0,
            streak: stats.find((s: any) => s.name === 'streak')?.displayValue,
            lastTen: stats.find((s: any) => s.name === 'L10')?.displayValue,
          };
        })
      );

      return {
        data: standings,
        source: {
          provider: 'ESPN API',
          timestamp: getChicagoTimestamp(),
          confidence: 0.9,
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
