import { NextRequest, NextResponse } from 'next/server';
import { getD1Client } from '@/lib/d1/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/history/scoreboard
 * Get historical scoreboard data from D1
 *
 * Query params:
 * - sport: Filter by sport (optional)
 * - date: Specific date in YYYY-MM-DD format (optional, defaults to yesterday)
 * - days: Number of days to look back (default: 1)
 *
 * Examples:
 * /api/sports/history/scoreboard?sport=MLB&date=2025-01-15
 * /api/sports/history/scoreboard?days=7
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport');
    const dateParam = searchParams.get('date');
    const days = parseInt(searchParams.get('days') || '1');

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

    let result;

    if (dateParam) {
      // Specific date
      if (!sport) {
        return NextResponse.json(
          {
            error: 'Sport is required when querying by specific date',
          },
          { status: 400 }
        );
      }

      result = await d1.getGamesByDate(sport, dateParam);
    } else if (sport) {
      // Recent games for a sport
      result = await d1.getRecentGames(sport, days);
    } else {
      // All recent games (use live games view)
      result = await d1.getLiveGames();
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch historical scoreboard',
        },
        { status: 500 }
      );
    }

    // Group games by date
    const gamesByDate: { [date: string]: any[] } = {};

    result.data.forEach((game: any) => {
      const date = game.game_date;
      if (!gamesByDate[date]) {
        gamesByDate[date] = [];
      }

      gamesByDate[date].push({
        id: game.id,
        sport: game.sport,
        league: game.league,
        date: game.game_time || game.game_date,
        status: game.status,
        homeTeam: {
          name: game.home_team_name,
          abbreviation: game.home_team_abbr,
          logo: game.home_team_logo,
        },
        awayTeam: {
          name: game.away_team_name,
          abbreviation: game.away_team_abbr,
          logo: game.away_team_logo,
        },
        homeScore: game.home_score,
        awayScore: game.away_score,
        period: game.period,
        venue: game.venue_name,
      });
    });

    // Sort dates descending
    const sortedDates = Object.keys(gamesByDate).sort((a, b) =>
      b.localeCompare(a)
    );

    const scoreboard = sortedDates.map((date) => ({
      date,
      games: gamesByDate[date],
      gameCount: gamesByDate[date].length,
    }));

    return NextResponse.json(
      {
        success: true,
        sport: sport || 'all',
        dateRange: {
          from: sortedDates[sortedDates.length - 1],
          to: sortedDates[0],
        },
        totalGames: result.data.length,
        scoreboard,
        source: {
          provider: 'Cloudflare D1',
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, s-maxage=1200', // 10min cache
        },
      }
    );
  } catch (error) {
    console.error('[Historical Scoreboard API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch historical scoreboard',
      },
      { status: 500 }
    );
  }
}
