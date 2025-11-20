import { NextRequest, NextResponse } from 'next/server';
import { NBAESPNAdapter } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/nba/games
 * Fetch NBA games for a specific date (2025-2026 season)
 *
 * Query params:
 * - date: Date in YYYY-MM-DD format (default: today)
 *
 * Uses ESPN API for current season live data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const today = new Date().toISOString().split('T')[0];
    const date = searchParams.get('date') || today;

    const adapter = new NBAESPNAdapter();
    const response = await adapter.getGames(date);

    // Cache based on game status
    const hasLiveGames = response.data.some(game => game.status === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live, 5min otherwise

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
      },
    });
  } catch (error) {
    console.error('[NBA Games API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NBA games',
      },
      { status: 500 }
    );
  }
}
