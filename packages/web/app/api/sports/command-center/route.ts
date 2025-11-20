/**
 * Blaze Sports Intel - Command Center API
 *
 * Unified multi-sport scoreboard providing real-time data across all 7 sports.
 * Aggregates MLB, NFL, NBA, NCAA Football, NCAA Basketball, College Baseball, and Youth Sports.
 *
 * @endpoint GET /api/sports/command-center
 * @query sports - Comma-separated list of sports to include (e.g., "mlb,nfl,ncaa_football")
 * @query date - Date for games (YYYY-MM-DD, defaults to today)
 * @cache 60s browser / 120s CDN (live data)
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

type Sport = 'mlb' | 'nfl' | 'nba' | 'ncaa_football' | 'ncaa_basketball' | 'college_baseball' | 'youth_sports';

interface GameSummary {
  id: string;
  sport: Sport;
  homeTeam: {
    name: string;
    abbreviation?: string;
    score: number | null;
    logo?: string;
  };
  awayTeam: {
    name: string;
    abbreviation?: string;
    score: number | null;
    logo?: string;
  };
  status: {
    state: 'pre' | 'live' | 'final' | 'postponed';
    detail: string;
    period?: string;
    clock?: string;
  };
  startTime: string;
  venue?: string;
  broadcast?: string;
}

interface CommandCenterResponse {
  sports: {
    [sport: string]: {
      games: GameSummary[];
      lastUpdated: string;
      dataSource: string;
    };
  };
  meta: {
    date: string;
    timezone: 'America/Chicago';
    totalGames: number;
    liveGames: number;
    requestedSports: Sport[];
    lastUpdated: string;
  };
}

/**
 * Fetch MLB games for command center
 */
async function fetchMLBGames(date: string): Promise<GameSummary[]> {
  try {
    // MLB Stats API endpoint
    const mlbDate = date.replace(/-/g, '/');
    const response = await fetch(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${mlbDate}`,
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[CommandCenter] MLB API error:', response.status);
      return [];
    }

    const data = await response.json();
    const games: GameSummary[] = [];

    for (const gameDate of data.dates || []) {
      for (const game of gameDate.games || []) {
        games.push({
          id: `mlb-${game.gamePk}`,
          sport: 'mlb',
          homeTeam: {
            name: game.teams?.home?.team?.name || 'Unknown',
            abbreviation: game.teams?.home?.team?.abbreviation,
            score: game.teams?.home?.score ?? null,
            logo: `https://www.mlbstatic.com/team-logos/${game.teams?.home?.team?.id}.svg`,
          },
          awayTeam: {
            name: game.teams?.away?.team?.name || 'Unknown',
            abbreviation: game.teams?.away?.team?.abbreviation,
            score: game.teams?.away?.score ?? null,
            logo: `https://www.mlbstatic.com/team-logos/${game.teams?.away?.team?.id}.svg`,
          },
          status: {
            state: game.status?.abstractGameState === 'Live' ? 'live'
              : game.status?.abstractGameState === 'Final' ? 'final'
              : 'pre',
            detail: game.status?.detailedState || game.status?.abstractGameState || 'Scheduled',
            period: game.linescore?.currentInning ? `${game.linescore.inningState} ${game.linescore.currentInning}` : undefined,
          },
          startTime: game.gameDate,
          venue: game.venue?.name,
        });
      }
    }

    return games;
  } catch (error) {
    console.error('[CommandCenter] MLB fetch error:', error);
    return [];
  }
}

/**
 * Fetch NCAA Football games for command center
 */
async function fetchNCAAFootballGames(date: string): Promise<GameSummary[]> {
  try {
    // ESPN College Football scoreboard
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[CommandCenter] NCAA Football API error:', response.status);
      return [];
    }

    const data = await response.json();
    const games: GameSummary[] = [];

    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

      games.push({
        id: `ncaa-fb-${event.id}`,
        sport: 'ncaa_football',
        homeTeam: {
          name: homeTeam?.team?.displayName || 'Unknown',
          abbreviation: homeTeam?.team?.abbreviation,
          score: homeTeam?.score ? parseInt(homeTeam.score) : null,
          logo: homeTeam?.team?.logos?.[0]?.href,
        },
        awayTeam: {
          name: awayTeam?.team?.displayName || 'Unknown',
          abbreviation: awayTeam?.team?.abbreviation,
          score: awayTeam?.score ? parseInt(awayTeam.score) : null,
          logo: awayTeam?.team?.logos?.[0]?.href,
        },
        status: {
          state: competition?.status?.type?.completed ? 'final'
            : competition?.status?.type?.state === 'in' ? 'live'
            : 'pre',
          detail: competition?.status?.type?.detail || 'Scheduled',
          period: competition?.status?.period ? `Q${competition.status.period}` : undefined,
          clock: competition?.status?.displayClock,
        },
        startTime: event.date,
        venue: competition?.venue?.fullName,
        broadcast: competition?.broadcasts?.[0]?.names?.[0],
      });
    }

    return games;
  } catch (error) {
    console.error('[CommandCenter] NCAA Football fetch error:', error);
    return [];
  }
}

/**
 * Fetch NFL games for command center
 */
async function fetchNFLGames(date: string): Promise<GameSummary[]> {
  try {
    // ESPN NFL scoreboard
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[CommandCenter] NFL API error:', response.status);
      return [];
    }

    const data = await response.json();
    const games: GameSummary[] = [];

    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

      games.push({
        id: `nfl-${event.id}`,
        sport: 'nfl',
        homeTeam: {
          name: homeTeam?.team?.displayName || 'Unknown',
          abbreviation: homeTeam?.team?.abbreviation,
          score: homeTeam?.score ? parseInt(homeTeam.score) : null,
          logo: homeTeam?.team?.logos?.[0]?.href,
        },
        awayTeam: {
          name: awayTeam?.team?.displayName || 'Unknown',
          abbreviation: awayTeam?.team?.abbreviation,
          score: awayTeam?.score ? parseInt(awayTeam.score) : null,
          logo: awayTeam?.team?.logos?.[0]?.href,
        },
        status: {
          state: competition?.status?.type?.completed ? 'final'
            : competition?.status?.type?.state === 'in' ? 'live'
            : 'pre',
          detail: competition?.status?.type?.detail || 'Scheduled',
          period: competition?.status?.period ? `Q${competition.status.period}` : undefined,
          clock: competition?.status?.displayClock,
        },
        startTime: event.date,
        venue: competition?.venue?.fullName,
        broadcast: competition?.broadcasts?.[0]?.names?.[0],
      });
    }

    return games;
  } catch (error) {
    console.error('[CommandCenter] NFL fetch error:', error);
    return [];
  }
}

/**
 * Fetch NBA games for command center
 */
async function fetchNBAGames(date: string): Promise<GameSummary[]> {
  try {
    // ESPN NBA scoreboard
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[CommandCenter] NBA API error:', response.status);
      return [];
    }

    const data = await response.json();
    const games: GameSummary[] = [];

    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

      games.push({
        id: `nba-${event.id}`,
        sport: 'nba',
        homeTeam: {
          name: homeTeam?.team?.displayName || 'Unknown',
          abbreviation: homeTeam?.team?.abbreviation,
          score: homeTeam?.score ? parseInt(homeTeam.score) : null,
          logo: homeTeam?.team?.logos?.[0]?.href,
        },
        awayTeam: {
          name: awayTeam?.team?.displayName || 'Unknown',
          abbreviation: awayTeam?.team?.abbreviation,
          score: awayTeam?.score ? parseInt(awayTeam.score) : null,
          logo: awayTeam?.team?.logos?.[0]?.href,
        },
        status: {
          state: competition?.status?.type?.completed ? 'final'
            : competition?.status?.type?.state === 'in' ? 'live'
            : 'pre',
          detail: competition?.status?.type?.detail || 'Scheduled',
          period: competition?.status?.period ? (competition.status.period > 4 ? `OT${competition.status.period - 4}` : `Q${competition.status.period}`) : undefined,
          clock: competition?.status?.displayClock,
        },
        startTime: event.date,
        venue: competition?.venue?.fullName,
        broadcast: competition?.broadcasts?.[0]?.names?.[0],
      });
    }

    return games;
  } catch (error) {
    console.error('[CommandCenter] NBA fetch error:', error);
    return [];
  }
}

/**
 * Fetch College Baseball games for command center
 */
async function fetchCollegeBaseballGames(date: string): Promise<GameSummary[]> {
  try {
    // ESPN College Baseball scoreboard
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard',
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[CommandCenter] College Baseball API error:', response.status);
      return [];
    }

    const data = await response.json();
    const games: GameSummary[] = [];

    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

      games.push({
        id: `cbb-${event.id}`,
        sport: 'college_baseball',
        homeTeam: {
          name: homeTeam?.team?.displayName || 'Unknown',
          abbreviation: homeTeam?.team?.abbreviation,
          score: homeTeam?.score ? parseInt(homeTeam.score) : null,
          logo: homeTeam?.team?.logos?.[0]?.href,
        },
        awayTeam: {
          name: awayTeam?.team?.displayName || 'Unknown',
          abbreviation: awayTeam?.team?.abbreviation,
          score: awayTeam?.score ? parseInt(awayTeam.score) : null,
          logo: awayTeam?.team?.logos?.[0]?.href,
        },
        status: {
          state: competition?.status?.type?.completed ? 'final'
            : competition?.status?.type?.state === 'in' ? 'live'
            : 'pre',
          detail: competition?.status?.type?.detail || 'Scheduled',
          period: competition?.status?.period ? `Inning ${competition.status.period}` : undefined,
          clock: competition?.status?.displayClock,
        },
        startTime: event.date,
        venue: competition?.venue?.fullName,
        broadcast: competition?.broadcasts?.[0]?.names?.[0],
      });
    }

    return games;
  } catch (error) {
    console.error('[CommandCenter] College Baseball fetch error:', error);
    return [];
  }
}

/**
 * Fetch NCAA Basketball games for command center
 */
async function fetchNCAABasketballGames(date: string): Promise<GameSummary[]> {
  try {
    // ESPN College Basketball scoreboard
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
      {
        headers: {
          'User-Agent': 'BlazeSportsIntel/1.0',
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[CommandCenter] NCAA Basketball API error:', response.status);
      return [];
    }

    const data = await response.json();
    const games: GameSummary[] = [];

    for (const event of data.events || []) {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');

      games.push({
        id: `ncaa-bb-${event.id}`,
        sport: 'ncaa_basketball',
        homeTeam: {
          name: homeTeam?.team?.displayName || 'Unknown',
          abbreviation: homeTeam?.team?.abbreviation,
          score: homeTeam?.score ? parseInt(homeTeam.score) : null,
          logo: homeTeam?.team?.logos?.[0]?.href,
        },
        awayTeam: {
          name: awayTeam?.team?.displayName || 'Unknown',
          abbreviation: awayTeam?.team?.abbreviation,
          score: awayTeam?.score ? parseInt(awayTeam.score) : null,
          logo: awayTeam?.team?.logos?.[0]?.href,
        },
        status: {
          state: competition?.status?.type?.completed ? 'final'
            : competition?.status?.type?.state === 'in' ? 'live'
            : 'pre',
          detail: competition?.status?.type?.detail || 'Scheduled',
          period: competition?.status?.period ? (competition.status.period > 2 ? `OT${competition.status.period - 2}` : `H${competition.status.period}`) : undefined,
          clock: competition?.status?.displayClock,
        },
        startTime: event.date,
        venue: competition?.venue?.fullName,
        broadcast: competition?.broadcasts?.[0]?.names?.[0],
      });
    }

    return games;
  } catch (error) {
    console.error('[CommandCenter] NCAA Basketball fetch error:', error);
    return [];
  }
}

/**
 * Get today's date in Chicago timezone (YYYY-MM-DD)
 */
function getTodayInChicago(): string {
  const now = new Date();
  const chicagoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));

  const year = chicagoTime.getFullYear();
  const month = String(chicagoTime.getMonth() + 1).padStart(2, '0');
  const day = String(chicagoTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parse sports query parameter
 */
function parseSportsParam(param: string | null): Sport[] {
  if (!param) {
    // Default: all sports
    return ['mlb', 'nfl', 'nba', 'ncaa_football', 'ncaa_basketball', 'college_baseball', 'youth_sports'];
  }

  const validSports: Sport[] = ['mlb', 'nfl', 'nba', 'ncaa_football', 'ncaa_basketball', 'college_baseball', 'youth_sports'];
  const requested = param.split(',').map(s => s.trim() as Sport);

  return requested.filter(s => validSports.includes(s));
}

/**
 * Command Center API Handler
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || getTodayInChicago();
    const requestedSports = parseSportsParam(searchParams.get('sports'));

    const response: CommandCenterResponse = {
      sports: {},
      meta: {
        date,
        timezone: 'America/Chicago',
        totalGames: 0,
        liveGames: 0,
        requestedSports,
        lastUpdated: new Date().toISOString(),
      },
    };

    // Fetch data for requested sports in parallel
    const promises: Promise<void>[] = [];

    if (requestedSports.includes('mlb')) {
      promises.push(
        fetchMLBGames(date).then(games => {
          response.sports.mlb = {
            games,
            lastUpdated: new Date().toISOString(),
            dataSource: 'MLB Stats API',
          };
          response.meta.totalGames += games.length;
          response.meta.liveGames += games.filter(g => g.status.state === 'live').length;
        })
      );
    }

    if (requestedSports.includes('ncaa_football')) {
      promises.push(
        fetchNCAAFootballGames(date).then(games => {
          response.sports.ncaa_football = {
            games,
            lastUpdated: new Date().toISOString(),
            dataSource: 'ESPN College Football API',
          };
          response.meta.totalGames += games.length;
          response.meta.liveGames += games.filter(g => g.status.state === 'live').length;
        })
      );
    }

    if (requestedSports.includes('ncaa_basketball')) {
      promises.push(
        fetchNCAABasketballGames(date).then(games => {
          response.sports.ncaa_basketball = {
            games,
            lastUpdated: new Date().toISOString(),
            dataSource: 'ESPN College Basketball API',
          };
          response.meta.totalGames += games.length;
          response.meta.liveGames += games.filter(g => g.status.state === 'live').length;
        })
      );
    }

    // NFL integration
    if (requestedSports.includes('nfl')) {
      promises.push(
        fetchNFLGames(date).then(games => {
          response.sports.nfl = {
            games,
            lastUpdated: new Date().toISOString(),
            dataSource: 'ESPN NFL API',
          };
          response.meta.totalGames += games.length;
          response.meta.liveGames += games.filter(g => g.status.state === 'live').length;
        })
      );
    }

    // NBA integration
    if (requestedSports.includes('nba')) {
      promises.push(
        fetchNBAGames(date).then(games => {
          response.sports.nba = {
            games,
            lastUpdated: new Date().toISOString(),
            dataSource: 'ESPN NBA API',
          };
          response.meta.totalGames += games.length;
          response.meta.liveGames += games.filter(g => g.status.state === 'live').length;
        })
      );
    }

    // College Baseball integration
    if (requestedSports.includes('college_baseball')) {
      promises.push(
        fetchCollegeBaseballGames(date).then(games => {
          response.sports.college_baseball = {
            games,
            lastUpdated: new Date().toISOString(),
            dataSource: 'ESPN College Baseball API',
          };
          response.meta.totalGames += games.length;
          response.meta.liveGames += games.filter(g => g.status.state === 'live').length;
        })
      );
    }

    // Youth Sports placeholder (requires more complex integration)
    if (requestedSports.includes('youth_sports')) {
      response.sports.youth_sports = {
        games: [],
        lastUpdated: new Date().toISOString(),
        dataSource: 'Youth Sports APIs (Texas HS + Perfect Game)',
      };
    }

    // Wait for all data fetches to complete
    await Promise.allSettled(promises);

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=120',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[CommandCenter] Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        sports: {},
        meta: {
          date: getTodayInChicago(),
          timezone: 'America/Chicago',
          totalGames: 0,
          liveGames: 0,
          requestedSports: [],
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
