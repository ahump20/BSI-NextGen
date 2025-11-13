/**
 * College Baseball Data Adapter
 * PRIORITY: Fill the ESPN gap - provide FULL box scores, previews, and recaps
 * ESPN shows ONLY the score and inning - we show everything
 */

import type {
  CollegeBaseballGame,
  ApiResponse,
  BattingLine,
  PitchingLine,
  CollegeBaseballBoxScore,
  LinescoreFrame,
  ScoringPlay,
} from '@bsi/shared';
import { retryWithBackoff, getChicagoTimestamp } from '@bsi/shared';

type ESPNLinescore = {
  value?: number | string;
  displayValue?: string;
};

type ESPNCompetitor = {
  homeAway?: 'home' | 'away';
  score?: string | number;
  team?: {
    id?: string;
    displayName?: string;
    abbreviation?: string;
    location?: string;
    logo?: string;
  };
  linescores?: ESPNLinescore[];
};

type ESPNCompetition = {
  competitors?: ESPNCompetitor[];
  venue?: {
    fullName?: string;
  };
  conferenceCompetition?: boolean;
};

type ESPNStatus = {
  type?: {
    name?: string;
    state?: string;
    shortDetail?: string;
    detail?: string;
  };
};

type ESPNEvent = {
  id: string;
  date: string;
  status?: ESPNStatus;
  competitions?: ESPNCompetition[];
};

type ESPNBoxscoreAthlete = {
  athlete?: {
    displayName?: string;
    position?: {
      abbreviation?: string;
    };
    statistics?: Array<{
      name?: string;
      displayValue?: string;
    }>;
  };
  stats?: string[];
};

type ESPNBoxscoreStatistic = {
  name?: string;
  athletes?: ESPNBoxscoreAthlete[];
};

type ESPNBoxscorePlayer = {
  team?: {
    homeAway?: 'home' | 'away';
  };
  statistics?: ESPNBoxscoreStatistic[];
};

type ESPNScoringPlay = {
  period?: {
    number?: number;
    displayValue?: string;
  };
  half?: string;
  text?: string;
  scoringPlay?: {
    text?: string;
  };
  team?: {
    homeAway?: 'home' | 'away';
  };
  awayScore?: number | string;
  homeScore?: number | string;
  outs?: number;
  outsAfterPlay?: number;
};

type ESPNScoreboardResponse = {
  events?: ESPNEvent[];
};

type ESPNBoxscoreResponse = {
  boxscore?: {
    players?: ESPNBoxscorePlayer[];
  };
  scoringPlays?: ESPNScoringPlay[];
};

export class CollegeBaseballAdapter {
  private readonly espnBaseUrl = 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball';

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

      const data: ESPNScoreboardResponse = await response.json();

      const games: CollegeBaseballGame[] = await Promise.all(
        (data.events || []).map(async event => {
          const competition = event.competitions?.[0];
          const homeCompetitor = competition?.competitors?.find(competitor => competitor.homeAway === 'home');
          const awayCompetitor = competition?.competitors?.find(competitor => competitor.homeAway === 'away');

          const game: CollegeBaseballGame = {
            id: event.id,
            sport: 'COLLEGE_BASEBALL',
            date: event.date,
            status: this.mapGameStatus(event.status),
            conference: competition?.conferenceCompetition ? 'Conference Game' : 'Non-Conference',
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
            homeScore: this.parseScore(homeCompetitor?.score),
            awayScore: this.parseScore(awayCompetitor?.score),
            period: event.status?.type?.shortDetail || event.status?.type?.detail || undefined,
            venue: competition?.venue?.fullName,
            linescore: this.buildLinescore(competition?.competitors),
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
  private async getBoxScore(gameId: string): Promise<CollegeBaseballBoxScore> {
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

    const data: ESPNBoxscoreResponse = await response.json();

    const battingLines: Record<'home' | 'away', BattingLine[]> = { home: [], away: [] };
    const pitchingLines: Record<'home' | 'away', PitchingLine[]> = { home: [], away: [] };

    // Extract batting statistics
    data.boxscore?.players?.forEach(team => {
      const side: 'home' | 'away' = team.team?.homeAway === 'home' ? 'home' : 'away';

      team.statistics?.forEach(statGroup => {
        if (statGroup.name === 'Batting') {
          statGroup.athletes?.forEach(athlete => {
            const stats = athlete.stats || [];
            battingLines[side].push({
              player: athlete.athlete?.displayName || 'Unknown',
              team: side,
              position: athlete.athlete?.position?.abbreviation,
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
          statGroup.athletes?.forEach(athlete => {
            const stats = athlete.stats || [];
            const decisionStat = athlete.athlete?.statistics?.find(stat => stat.name === 'decision');
            pitchingLines[side].push({
              player: athlete.athlete?.displayName || 'Unknown',
              team: side,
              decision: decisionStat?.displayValue || null,
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

    const scoringPlays: ScoringPlay[] = (data.scoringPlays || []).map(play => ({
      inning: play.period?.number || 0,
      halfInning: (play.period?.displayValue || play.half || '')
        .toString()
        .toLowerCase()
        .includes('bot')
        ? 'Bottom'
        : 'Top',
      description: play.text || play.scoringPlay?.text || '',
      scoringTeam: play.team?.homeAway === 'home' ? 'home' : 'away',
      awayScore: typeof play.awayScore === 'number' ? play.awayScore : parseInt(play.awayScore || '0'),
      homeScore: typeof play.homeScore === 'number' ? play.homeScore : parseInt(play.homeScore || '0'),
      outs: play.outs || play.outsAfterPlay || undefined,
    }));

    return {
      batting: battingLines,
      pitching: pitchingLines,
      scoringPlays,
      lastUpdated: getChicagoTimestamp(),
    };
  }

  /**
   * Get conference standings
   */
  async getStandings(conference?: string): Promise<ApiResponse<Record<string, unknown>[]>> {
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

  private mapGameStatus(status: ESPNStatus | string | undefined): CollegeBaseballGame['status'] {
    const raw = (typeof status === 'string' ? status : status?.type?.name || status?.type?.state || '').toLowerCase();

    if (raw.includes('final')) {
      return 'final';
    }

    if (raw.includes('inprogress') || raw.includes('in_progress') || raw.includes('live')) {
      return 'live';
    }

    if (raw.includes('postponed')) {
      return 'postponed';
    }

    if (raw.includes('cancelled') || raw.includes('canceled')) {
      return 'cancelled';
    }

    return 'scheduled';
  }

  private buildLinescore(competitors: ESPNCompetitor[] | undefined): LinescoreFrame[] | undefined {
    if (!competitors) {
      return undefined;
    }

    const home = competitors.find(competitor => competitor.homeAway === 'home');
    const away = competitors.find(competitor => competitor.homeAway === 'away');

    const homeLines = home?.linescores || [];
    const awayLines = away?.linescores || [];
    const frames: LinescoreFrame[] = [];

    const totalFrames = Math.max(homeLines.length, awayLines.length);
    for (let i = 0; i < totalFrames; i++) {
      const homeFrame = homeLines[i] || {};
      const awayFrame = awayLines[i] || {};
      frames.push({
        inning: homeFrame.displayValue || awayFrame.displayValue || `${i + 1}`,
        home: this.parseScore(homeFrame.value),
        away: this.parseScore(awayFrame.value),
      });
    }

    return frames.length > 0 ? frames : undefined;
  }

  private parseScore(value: string | number | undefined): number {
    if (typeof value === 'number') {
      return value;
    }

    const parsed = parseInt(value || '0', 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
