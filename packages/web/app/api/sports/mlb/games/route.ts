import { NextRequest, NextResponse } from 'next/server';
import { MLBAdapter } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/mlb/games
 * Fetch MLB games for a specific date
 *
 * Query params:
 * - date: Date in YYYY-MM-DD format (optional, defaults to today)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    const date = searchParams.get('date') || today;

    const adapter = new MLBAdapter();
    const response = await adapter.getGames(date);

    // Cache based on game status
    const hasLiveGames = response.data.some(game => game.status === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live games, 5min otherwise

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
      },
    });
  } catch (error) {
    console.error('[MLB Games API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch MLB games',
      },
      { status: 500 }
    );
  }
}
