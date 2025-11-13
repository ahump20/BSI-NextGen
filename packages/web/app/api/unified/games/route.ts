/**
 * Unified Games API Endpoint
 *
 * GET /api/unified/games?date=2025-01-11
 *
 * Returns games from ALL leagues (MLB, NFL, NBA, NCAA Football, College Baseball)
 * for a specific date.
 *
 * Timezone: America/Chicago
 */

import { NextRequest, NextResponse } from 'next/server';
import { LeagueOrchestrator } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('Unified-Games-API');

export const dynamic = 'force-dynamic';

/**
 * GET /api/unified/games
 *
 * Query params:
 * - date: YYYY-MM-DD format (optional, defaults to today in America/Chicago)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || undefined;

    // Create orchestrator with runtime API keys
    const orchestrator = new LeagueOrchestrator({
      sportsDataIOKey: process.env.SPORTSDATAIO_API_KEY,
    });

    // Fetch games from all leagues
    const response = await orchestrator.getAllGames(date);

    // Determine cache TTL based on whether there are live games
    const hasLiveGames = response.data.some((game) => game.status === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300; // 30s for live, 5min for others

    return NextResponse.json(
      {
        games: response.data,
        meta: {
          dataSource: 'Multi-League Orchestrator',
          leagues: ['MLB', 'NFL', 'NBA', 'NCAA Football', 'College Baseball'],
          sources: response.sources,
          aggregatedConfidence: response.aggregatedConfidence,
          lastUpdated: response.timestamp,
          timezone: 'America/Chicago',
          count: response.data.length,
          errors: response.errors,
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
        error: error instanceof Error ? error.message : 'Failed to fetch games',
        games: [],
      },
      { status: 500 }
    );
  }
}
