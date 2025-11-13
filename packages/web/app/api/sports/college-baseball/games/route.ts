import { NextRequest, NextResponse } from 'next/server';
import { createNCAAAdapter } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('CollegeBaseball-Games-API');

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/college-baseball/games
 * Fetch NCAA college baseball games list
 *
 * Query params:
 * - date: YYYY-MM-DD format (optional, defaults to today)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    const adapter = createNCAAAdapter({
      baseURL: process.env.NCAA_API_URL,
      timeout: 15000,
    });

    const games = await adapter.getGames(date || undefined);

    // Cache for 30 seconds for live games, 5 minutes for completed
    const hasLiveGames = games.some((g) => g.status.type === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300;

    return NextResponse.json(
      {
        games,
        meta: {
          dataSource: 'ESPN College Baseball API',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          count: games.length,
        },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
        },
      }
    );
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NCAA games',
        games: [],
      },
      { status: 500 }
    );
  }
}
