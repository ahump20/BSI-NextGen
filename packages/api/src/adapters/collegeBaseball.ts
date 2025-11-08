/**
 * College Baseball Data Adapter
 * PRIORITY: Fill the ESPN gap - provide FULL box scores, previews, and recaps
 * ESPN shows ONLY the score and inning - we show everything
 */

import type { CollegeBaseballGame, ApiResponse, BattingLine, PitchingLine, EnhancedBoxScore, PlayByPlay, Play, InningScore, ConferenceStanding } from '@bsi/shared';
import { validateApiKey, retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';
import { D1BaseballAdapter } from './d1baseball';

export class CollegeBaseballAdapter {
  private readonly espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';
  private readonly ncaaBaseUrl = 'https://stats.ncaa.org/rankings';
  private readonly d1Baseball: D1BaseballAdapter;

  constructor() {
    // ESPN API is public, no key needed
    this.d1Baseball = new D1BaseballAdapter();
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

      const data = await response.json() as any;

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
              const boxScore = await this.getEnhancedBoxScore(event.id);
              game.boxScore = boxScore;
            } catch (error) {
              console.error(`Failed to fetch box score for game ${event.id}:`, error);
            }
          }

          // Fetch recap if game is final
          if (game.status === 'final') {
            try {
              game.recap = await this.getGameRecap(event.id);
            } catch (error) {
              console.error(`Failed to fetch recap for game ${event.id}:`, error);
            }
          }

          // Fetch preview if game is scheduled
          if (game.status === 'scheduled') {
            try {
              game.preview = await this.getGamePreview(event.id);
            } catch (error) {
              console.error(`Failed to fetch preview for game ${event.id}:`, error);
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
   * Get ENHANCED box score - batting, pitching, play-by-play, and inning scores
   * THIS IS THE KEY DIFFERENTIATOR FROM ESPN
   */
  private async getEnhancedBoxScore(gameId: string): Promise<EnhancedBoxScore> {
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

    // Extract play-by-play data
    const playByPlay: PlayByPlay[] = [];
    if (data.plays) {
      let currentInning = 1;
      let currentHalf: 'top' | 'bottom' = 'top';
      let currentOuts = 0;
      let plays: Play[] = [];

      data.plays.forEach((play: any) => {
        const inning = play.period?.number || currentInning;
        const isTopInning = play.homeAway === 'away';

        if (inning !== currentInning || (isTopInning ? 'top' : 'bottom') !== currentHalf) {
          if (plays.length > 0) {
            playByPlay.push({
              inning: currentInning,
              halfInning: currentHalf,
              outs: currentOuts,
              plays,
            });
          }
          currentInning = inning;
          currentHalf = isTopInning ? 'top' : 'bottom';
          currentOuts = 0;
          plays = [];
        }

        plays.push({
          id: play.id,
          description: play.text || play.shortText || 'Unknown play',
          timestamp: play.wallclock || '',
          batter: play.participants?.find((p: any) => p.athlete?.position?.abbreviation === 'B')?.athlete?.displayName || 'Unknown',
          pitcher: play.participants?.find((p: any) => p.athlete?.position?.abbreviation === 'P')?.athlete?.displayName || 'Unknown',
          result: play.type?.text || 'Unknown',
          runsScored: play.scoreValue || 0,
          rbi: play.rbi,
        });

        if (play.atBatId && play.atBatId.endsWith('out')) {
          currentOuts++;
        }
      });

      if (plays.length > 0) {
        playByPlay.push({
          inning: currentInning,
          halfInning: currentHalf,
          outs: currentOuts,
          plays,
        });
      }
    }

    // Extract inning scores (line score)
    const inningScores: InningScore[] = [];
    if (data.boxscore?.teams) {
      const innings = data.boxscore.teams[0]?.statistics?.find((s: any) => s.name === 'linescores')?.stats || [];
      const homeInnings = data.boxscore.teams.find((t: any) => t.homeAway === 'home')?.statistics?.find((s: any) => s.name === 'linescores')?.stats || [];
      const awayInnings = data.boxscore.teams.find((t: any) => t.homeAway === 'away')?.statistics?.find((s: any) => s.name === 'linescores')?.stats || [];

      const maxInnings = Math.max(homeInnings.length, awayInnings.length);
      for (let i = 0; i < maxInnings; i++) {
        inningScores.push({
          inning: i + 1,
          homeScore: parseInt(homeInnings[i] || '0'),
          awayScore: parseInt(awayInnings[i] || '0'),
        });
      }
    }

    return {
      battingLines,
      pitchingLines,
      playByPlay: playByPlay.length > 0 ? playByPlay : undefined,
      inningScores: inningScores.length > 0 ? inningScores : undefined,
    };
  }

  /**
   * Get game recap (post-game summary)
   */
  private async getGameRecap(gameId: string): Promise<string | undefined> {
    try {
      const url = `${this.espnBaseUrl}/summary?event=${gameId}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json() as any;
      return data.article?.story || data.recap?.headline || undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get game preview (pre-game summary)
   */
  private async getGamePreview(gameId: string): Promise<string | undefined> {
    try {
      const url = `${this.espnBaseUrl}/summary?event=${gameId}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json() as any;
      return data.gameInfo?.article?.story || data.preview?.headline || undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get conference standings using D1Baseball integration
   */
  async getStandings(conference: string): Promise<ApiResponse<ConferenceStanding[]>> {
    return this.d1Baseball.getConferenceStandings(conference);
  }

  /**
   * Get national rankings
   */
  async getRankings() {
    return this.d1Baseball.getRankings();
  }

  /**
   * Get all available conferences
   */
  async getConferences() {
    return this.d1Baseball.getAllConferences();
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
