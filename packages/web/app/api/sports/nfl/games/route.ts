import { NextRequest, NextResponse } from 'next/server';
import { NFLAdapter } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('NFL-Games-API');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    logger.error('Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NFL games',
      },
      { status: 500 }
    );
  }
}
