import { NextRequest, NextResponse } from 'next/server';
import { MLBAdapter, NFLAdapter, NBAAdapter } from '@bsi/api';
import type { Game } from '@bsi/shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Normalized game format for Command Center
 */
type LiveScore = {
  sport: string;
  league: string;
  gameId: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logo?: string;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo?: string;
  };
  homeScore: number;
  awayScore: number;
  status: string;
  period?: string;
  startTime: string;
  venue?: string;
  detailLink: string;
};

type LiveScoresResponse = {
  success: boolean;
  games: LiveScore[];
  timestamp: string;
  sources: {
    [key: string]: {
      success: boolean;
      count: number;
      error?: string;
    };
  };
};

/**
 * GET /api/sports/live-scores
 * Aggregate live scores from all sports for Command Center dashboard
 *
 * Query params:
 * - sport: Filter by specific sport (mlb, nfl, nba, ncaa-football, ncaa-basketball, youth-sports)
 * - status: Filter by game status (live, scheduled, final)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sportFilter = searchParams.get('sport');
  const statusFilter = searchParams.get('status');

  const today = new Date().toISOString().split('T')[0];
  const sources: LiveScoresResponse['sources'] = {};
  const allGames: LiveScore[] = [];

  // Parallel fetch from all sports APIs
  const fetchPromises: Promise<void>[] = [];

  // MLB - if no filter or MLB filter
  if (!sportFilter || sportFilter === 'mlb') {
    fetchPromises.push(
      (async () => {
        try {
          const adapter = new MLBAdapter();
          const response = await adapter.getGames(today);

          sources.mlb = {
            success: true,
            count: response.data.length,
          };

          response.data.forEach((game: Game) => {
            allGames.push({
              sport: 'MLB',
              league: 'Major League Baseball',
              gameId: game.id,
              homeTeam: {
                name: game.homeTeam.name,
                abbreviation: game.homeTeam.abbreviation,
                logo: game.homeTeam.logo,
              },
              awayTeam: {
                name: game.awayTeam.name,
                abbreviation: game.awayTeam.abbreviation,
                logo: game.awayTeam.logo,
              },
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              status: game.status,
              period: game.period,
              startTime: game.date,
              venue: game.venue,
              detailLink: `/sports/mlb?gameId=${game.id}`,
            });
          });
        } catch (error) {
          console.error('[Live Scores] MLB error:', error);
          sources.mlb = {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })()
    );
  }

  // NFL - if no filter or NFL filter
  if (!sportFilter || sportFilter === 'nfl') {
    fetchPromises.push(
      (async () => {
        try {
          const adapter = new NFLAdapter(process.env.SPORTSDATAIO_API_KEY);
          const response = await adapter.getGames({ season: 2025, week: 1 });

          sources.nfl = {
            success: true,
            count: response.data.length,
          };

          response.data.forEach((game: Game) => {
            allGames.push({
              sport: 'NFL',
              league: 'National Football League',
              gameId: game.id,
              homeTeam: {
                name: game.homeTeam.name,
                abbreviation: game.homeTeam.abbreviation,
                logo: game.homeTeam.logo,
              },
              awayTeam: {
                name: game.awayTeam.name,
                abbreviation: game.awayTeam.abbreviation,
                logo: game.awayTeam.logo,
              },
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              status: game.status,
              period: game.period,
              startTime: game.date,
              venue: game.venue,
              detailLink: `/sports/nfl?gameId=${game.id}`,
            });
          });
        } catch (error) {
          console.error('[Live Scores] NFL error:', error);
          sources.nfl = {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })()
    );
  }

  // NBA - if no filter or NBA filter
  if (!sportFilter || sportFilter === 'nba') {
    fetchPromises.push(
      (async () => {
        try {
          const adapter = new NBAAdapter(process.env.SPORTSDATAIO_API_KEY);
          const response = await adapter.getGames(today);

          sources.nba = {
            success: true,
            count: response.data.length,
          };

          response.data.forEach((game: Game) => {
            allGames.push({
              sport: 'NBA',
              league: 'National Basketball Association',
              gameId: game.id,
              homeTeam: {
                name: game.homeTeam.name,
                abbreviation: game.homeTeam.abbreviation,
                logo: game.homeTeam.logo,
              },
              awayTeam: {
                name: game.awayTeam.name,
                abbreviation: game.awayTeam.abbreviation,
                logo: game.awayTeam.logo,
              },
              homeScore: game.homeScore,
              awayScore: game.awayScore,
              status: game.status,
              period: game.period,
              startTime: game.date,
              venue: game.venue,
              detailLink: `/sports/nba?gameId=${game.id}`,
            });
          });
        } catch (error) {
          console.error('[Live Scores] NBA error:', error);
          sources.nba = {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })()
    );
  }

  // NCAA Football - ESPN API (simplified for now)
  if (!sportFilter || sportFilter === 'ncaa-football') {
    fetchPromises.push(
      (async () => {
        try {
          // Call ESPN API for NCAA football scoreboard
          const response = await fetch(
            'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'
          );

          if (!response.ok) {
            throw new Error(`ESPN API error: ${response.statusText}`);
          }

          const data = await response.json();
          const games = data.events || [];

          sources['ncaa-football'] = {
            success: true,
            count: games.length,
          };

          games.forEach((event: any) => {
            const homeTeam = event.competitions?.[0]?.competitors?.find(
              (c: any) => c.homeAway === 'home'
            );
            const awayTeam = event.competitions?.[0]?.competitors?.find(
              (c: any) => c.homeAway === 'away'
            );

            if (homeTeam && awayTeam) {
              allGames.push({
                sport: 'NCAA Football',
                league: 'College Football',
                gameId: event.id,
                homeTeam: {
                  name: homeTeam.team.displayName,
                  abbreviation: homeTeam.team.abbreviation,
                  logo: homeTeam.team.logo,
                },
                awayTeam: {
                  name: awayTeam.team.displayName,
                  abbreviation: awayTeam.team.abbreviation,
                  logo: awayTeam.team.logo,
                },
                homeScore: parseInt(homeTeam.score || '0'),
                awayScore: parseInt(awayTeam.score || '0'),
                status: event.status.type.state,
                period: event.status.type.shortDetail,
                startTime: event.date,
                venue: event.competitions?.[0]?.venue?.fullName,
                detailLink: `/sports/ncaa-football?gameId=${event.id}`,
              });
            }
          });
        } catch (error) {
          console.error('[Live Scores] NCAA Football error:', error);
          sources['ncaa-football'] = {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })()
    );
  }

  // NCAA Basketball - ESPN API
  if (!sportFilter || sportFilter === 'ncaa-basketball') {
    fetchPromises.push(
      (async () => {
        try {
          const response = await fetch(
            'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'
          );

          if (!response.ok) {
            throw new Error(`ESPN API error: ${response.statusText}`);
          }

          const data = await response.json();
          const games = data.events || [];

          sources['ncaa-basketball'] = {
            success: true,
            count: games.length,
          };

          games.forEach((event: any) => {
            const homeTeam = event.competitions?.[0]?.competitors?.find(
              (c: any) => c.homeAway === 'home'
            );
            const awayTeam = event.competitions?.[0]?.competitors?.find(
              (c: any) => c.homeAway === 'away'
            );

            if (homeTeam && awayTeam) {
              allGames.push({
                sport: 'NCAA Basketball',
                league: 'College Basketball',
                gameId: event.id,
                homeTeam: {
                  name: homeTeam.team.displayName,
                  abbreviation: homeTeam.team.abbreviation,
                  logo: homeTeam.team.logo,
                },
                awayTeam: {
                  name: awayTeam.team.displayName,
                  abbreviation: awayTeam.team.abbreviation,
                  logo: awayTeam.team.logo,
                },
                homeScore: parseInt(homeTeam.score || '0'),
                awayScore: parseInt(awayTeam.score || '0'),
                status: event.status.type.state,
                period: event.status.type.shortDetail,
                startTime: event.date,
                venue: event.competitions?.[0]?.venue?.fullName,
                detailLink: `/sports/ncaa-basketball?gameId=${event.id}`,
              });
            }
          });
        } catch (error) {
          console.error('[Live Scores] NCAA Basketball error:', error);
          sources['ncaa-basketball'] = {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })()
    );
  }

  // College Baseball - ESPN API
  if (!sportFilter || sportFilter === 'college-baseball') {
    fetchPromises.push(
      (async () => {
        try {
          const response = await fetch(
            'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard'
          );

          if (!response.ok) {
            throw new Error(`ESPN API error: ${response.statusText}`);
          }

          const data = await response.json();
          const games = data.events || [];

          sources['college-baseball'] = {
            success: true,
            count: games.length,
          };

          games.forEach((event: any) => {
            const homeTeam = event.competitions?.[0]?.competitors?.find(
              (c: any) => c.homeAway === 'home'
            );
            const awayTeam = event.competitions?.[0]?.competitors?.find(
              (c: any) => c.homeAway === 'away'
            );

            if (homeTeam && awayTeam) {
              allGames.push({
                sport: 'College Baseball',
                league: 'NCAA Baseball',
                gameId: event.id,
                homeTeam: {
                  name: homeTeam.team.displayName,
                  abbreviation: homeTeam.team.abbreviation,
                  logo: homeTeam.team.logo,
                },
                awayTeam: {
                  name: awayTeam.team.displayName,
                  abbreviation: awayTeam.team.abbreviation,
                  logo: awayTeam.team.logo,
                },
                homeScore: parseInt(homeTeam.score || '0'),
                awayScore: parseInt(awayTeam.score || '0'),
                status: event.status.type.state,
                period: event.status.type.shortDetail,
                startTime: event.date,
                venue: event.competitions?.[0]?.venue?.fullName,
                detailLink: `/sports/college-baseball?gameId=${event.id}`,
              });
            }
          });
        } catch (error) {
          console.error('[Live Scores] College Baseball error:', error);
          sources['college-baseball'] = {
            success: false,
            count: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })()
    );
  }

  // Wait for all fetches to complete
  await Promise.all(fetchPromises);

  // Filter by status if requested
  let filteredGames = allGames;
  if (statusFilter) {
    filteredGames = allGames.filter((game) => {
      if (statusFilter === 'live') {
        return game.status === 'live' || game.status === 'in';
      }
      if (statusFilter === 'scheduled') {
        return game.status === 'scheduled' || game.status === 'pre';
      }
      if (statusFilter === 'final') {
        return game.status === 'final' || game.status === 'post';
      }
      return true;
    });
  }

  // Sort by start time (most recent first)
  filteredGames.sort((a, b) => {
    return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
  });

  // Determine cache TTL based on live games
  const hasLiveGames = filteredGames.some(
    (game) => game.status === 'live' || game.status === 'in'
  );
  const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live, 5min otherwise

  const response: LiveScoresResponse = {
    success: true,
    games: filteredGames,
    timestamp: new Date().toISOString(),
    sources,
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
    },
  });
}
