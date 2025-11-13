import { NextRequest, NextResponse } from 'next/server';
import { createNCAAAdapter } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('CollegeBaseball-Games-API');

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/college-baseball/games/[gameId]
 * Fetch complete NCAA college baseball box score
 *
 * Path params:
 * - gameId: Game ID from NCAA/ESPN
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { gameId: string } }
) {
  try {
    const { gameId } = params;

    if (!gameId) {
      return NextResponse.json(
        { error: 'Missing gameId parameter' },
        { status: 400 }
      );
    }

    const adapter = createNCAAAdapter({
      baseURL: process.env.NCAA_API_URL,
      timeout: 15000,
    });

    const boxScore = await adapter.getGame(gameId);

    // Cache based on game status
    let cacheTTL = 60; // Default: 1 minute
    if (boxScore.status.type === 'live') {
      cacheTTL = 30; // Live games: 30 seconds
    } else if (boxScore.status.completed) {
      cacheTTL = 300; // Completed games: 5 minutes
    }

    return NextResponse.json(boxScore, {
      headers: {
        'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
      },
    });
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch box score',
      },
      { status: 500 }
    );
  }
}
