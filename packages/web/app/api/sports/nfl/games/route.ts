import { NextRequest, NextResponse } from 'next/server';
import { NFLAdapter } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/nfl/games
 * Fetch NFL games for a specific week
 *
 * Query params:
 * - season: Year (default: 2025)
 * - week: Week number 1-18 (default: current week)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const season = parseInt(searchParams.get('season') || '2025');
    const week = parseInt(searchParams.get('week') || '1');

    const adapter = new NFLAdapter(process.env.SPORTSDATAIO_API_KEY);
    const response = await adapter.getGames({ season, week });

    // Cache based on game status
    const hasLiveGames = response.data.some(game => game.status === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live, 5min otherwise

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
