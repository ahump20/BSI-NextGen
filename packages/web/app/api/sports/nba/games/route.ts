import { NextRequest, NextResponse } from 'next/server';
import { NBAAdapter } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('NBA-Games-API');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/nba/games
 * Fetch NBA games for a specific date
 *
 * Query params:
 * - date: Date in YYYY-MM-DD format (default: today)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const today = new Date().toISOString().split('T')[0];
    const date = searchParams.get('date') || today;

    const adapter = new NBAAdapter(process.env.SPORTSDATAIO_API_KEY);
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
    logger.error('Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NBA games',
      },
      { status: 500 }
    );
  }
}
