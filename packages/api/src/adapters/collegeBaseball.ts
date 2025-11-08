/**
 * College Baseball Data Adapter
 * PRIORITY: Fill the ESPN gap - provide FULL box scores, previews, and recaps
 * ESPN shows ONLY the score and inning - we show everything
 */

import type { CollegeBaseballGame, ApiResponse, BattingLine, PitchingLine } from '@bsi/shared';
import { validateApiKey, retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

export class CollegeBaseballAdapter {
  private readonly espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
  private readonly ncaaBaseUrl = 'https://stats.ncaa.org/rankings';

  constructor() {
    // ESPN API is public, no key needed
  }

  /**
   * Get college baseball games with FULL box scores
   * This is what ESPN SHOULD provide but doesn't
   */
  async getGamesWithBoxScores(date?: string): Promise<ApiResponse<CollegeBaseballGame[]>> {
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

      const data = await response.json();

      const games: CollegeBaseballGame[] = await Promise.all(
        (data.events || []).map(async (event: any) => {
          const game: CollegeBaseballGame = {
            id: event.id,
            sport: 'COLLEGE_BASEBALL',
            date: event.date,
            status: this.mapGameStatus(event.status?.type?.name),
            conference: event.competitions?.[0]?.conferenceCompetition ? 'Yes' : 'No',
            homeTeam: {
              id: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.id || '',
              name: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName || '',
              abbreviation: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.abbreviation || '',
              city: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.location || '',
              logo: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.logo || '',
            },
            awayTeam: {
              id: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.id || '',
              name: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName || '',
              abbreviation: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.abbreviation || '',
              city: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.location || '',
              logo: event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.logo || '',
            },
            homeScore: parseInt(event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.score || '0'),
            awayScore: parseInt(event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.score || '0'),
            period: event.status?.period ? `Inning ${event.status.period}` : undefined,
            venue: event.competitions?.[0]?.venue?.fullName,
          };

          // Fetch full box score if game is final or live
          if (game.status === 'final' || game.status === 'live') {
            try {
              const boxScore = await this.getBoxScore(event.id);
              game.boxScore = boxScore;
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

    const data = await response.json();

    const battingLines: BattingLine[] = [];
    const pitchingLines: PitchingLine[] = [];

    // Extract batting statistics
    data.boxscore?.players?.forEach((team: any) => {
      team.statistics?.forEach((statGroup: any) => {
        if (statGroup.name === 'Batting') {
          statGroup.athletes?.forEach((athlete: any) => {
            const stats = athlete.stats || [];
            battingLines.push({
              player: athlete.athlete?.displayName || 'Unknown',
              ab: parseInt(stats[0] || '0'),
              r: parseInt(stats[1] || '0'),
              h: parseInt(stats[2] || '0'),
              rbi: parseInt(stats[3] || '0'),
              bb: parseInt(stats[4] || '0'),
              so: parseInt(stats[5] || '0'),
            });
          });
        }

        if (statGroup.name === 'Pitching') {
          statGroup.athletes?.forEach((athlete: any) => {
            const stats = athlete.stats || [];
            pitchingLines.push({
              player: athlete.athlete?.displayName || 'Unknown',
              ip: parseFloat(stats[0] || '0'),
              h: parseInt(stats[1] || '0'),
              r: parseInt(stats[2] || '0'),
              er: parseInt(stats[3] || '0'),
              bb: parseInt(stats[4] || '0'),
              so: parseInt(stats[5] || '0'),
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
  async getStandings(conference?: string): Promise<ApiResponse<any[]>> {
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

      const data = await response.json();

      return {
        data: data.standings || [],
        source: {
          provider: 'ESPN API',
          timestamp: getChicagoTimestamp(),
          confidence: 0.9,
        },
      };
    });
  }

  private mapGameStatus(status: string): CollegeBaseballGame['status'] {
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
