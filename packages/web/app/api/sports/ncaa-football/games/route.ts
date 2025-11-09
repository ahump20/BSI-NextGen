import { NextRequest, NextResponse } from 'next/server';
import { NCAAFootballAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/ncaa-football/games
 * Fetch NCAA Football games for a specific week and season
 *
 * Query params:
 * - week: Week number (optional, defaults to current week)
 * - season: Season year (optional, defaults to current year)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const currentYear = new Date().getFullYear();
    const week = searchParams.get('week') ? parseInt(searchParams.get('week')!) : undefined;
    const season = parseInt(searchParams.get('season') || currentYear.toString());

    const adapter = new NCAAFootballAdapter();
    const response = await adapter.getGames(week, season);

    // Cache based on game status
    const hasLiveGames = response.data.some(game => game.status === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live games, 5min otherwise

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
      },
    });
  } catch (error) {
    console.error('[NCAA Football Games API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NCAA Football games',
      },
      { status: 500 }
    );
  }
}
