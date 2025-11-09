import { NextRequest, NextResponse } from 'next/server';
import { NFLAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/nfl/games
 * Fetch NFL games for a specific week and season
 *
 * Query params:
 * - season: NFL season year (optional, defaults to current year)
 * - week: Week number 1-18 for regular season (optional, defaults to 1)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const currentYear = new Date().getFullYear();
    const season = parseInt(searchParams.get('season') || currentYear.toString());
    const week = parseInt(searchParams.get('week') || '1');

    const adapter = new NFLAdapter();
    const response = await adapter.getGames(season, week);

    // Cache based on game status
    const hasLiveGames = response.data.some(game => game.status === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live games, 5min otherwise

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
      },
    });
  } catch (error) {
    console.error('[NFL Games API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NFL games',
      },
      { status: 500 }
    );
  }
}
