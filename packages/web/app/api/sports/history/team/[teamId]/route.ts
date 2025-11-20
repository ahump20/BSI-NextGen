import { NextRequest, NextResponse } from 'next/server';
import { getD1Client } from '@/lib/d1/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/history/team/[teamId]
 * Get historical game data for a team from D1
 *
 * Query params:
 * - limit: Number of games to return (default: 10)
 * - season: Filter by season year (optional)
 *
 * Example:
 * /api/sports/history/team/mlb-147?limit=20
 * /api/sports/history/team/nfl-hou?season=2024
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const season = searchParams.get('season');

    const { teamId } = params;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const d1 = getD1Client();

    // Check if D1 is available
    if (!d1.isAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Historical data not available - D1 not configured',
          hint: 'Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN',
        },
        { status: 503 }
      );
    }

    // Fetch from D1
    let result;
    if (season) {
      result = await d1.getTeamSeasonSummary(teamId, parseInt(season));
    } else {
      result = await d1.getTeamGames(teamId, limit);
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch team history',
        },
        { status: 500 }
      );
    }

    // Transform D1 data to API format
    const games = result.data.map((game) => ({
      id: game.id,
      sport: game.sport,
      league: game.league,
      date: game.game_time || game.game_date,
      status: game.status,
      homeTeam: {
        id: game.home_team_id,
      },
      awayTeam: {
        id: game.away_team_id,
      },
      homeScore: game.home_score,
      awayScore: game.away_score,
      period: game.period,
      venue: game.venue_name,
      season: game.season,
      week: game.week,
      metadata: game.metadata ? JSON.parse(game.metadata) : null,
    }));

    // Calculate summary stats
    const isHomeGames = games.filter((g) => g.homeTeam.id === teamId);
    const isAwayGames = games.filter((g) => g.awayTeam.id === teamId);

    const wins = games.filter((g) => {
      const isHome = g.homeTeam.id === teamId;
      return isHome
        ? g.homeScore > g.awayScore
        : g.awayScore > g.homeScore;
    }).length;

    const losses = games.filter((g) => {
      const isHome = g.homeTeam.id === teamId;
      return isHome
        ? g.homeScore < g.awayScore
        : g.awayScore < g.homeScore;
    }).length;

    return NextResponse.json(
      {
        success: true,
        teamId,
        season: season ? parseInt(season) : null,
        summary: {
          gamesPlayed: games.length,
          wins,
          losses,
          winPercentage:
            games.length > 0
              ? (wins / games.length).toFixed(3)
              : '0.000',
        },
        games,
        source: {
          provider: 'Cloudflare D1',
          timestamp: new Date().toISOString(),
          dataRange: {
            oldest: games[games.length - 1]?.date,
            newest: games[0]?.date,
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=1200', // 10min cache for historical data
        },
      }
    );
  } catch (error) {
    console.error('[Team History API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch team history',
      },
      { status: 500 }
    );
  }
}
