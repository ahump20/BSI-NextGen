/**
 * Unified Search API Endpoint
 *
 * GET /api/unified/search?q=Cardinals
 *
 * Searches teams across ALL leagues
 *
 * Timezone: America/Chicago
 */

import { NextRequest, NextResponse } from 'next/server';
import { LeagueOrchestrator } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('Unified-Search-API');

export const dynamic = 'force-dynamic';

/**
 * GET /api/unified/search
 *
 * Query params:
 * - q: Search query (team name, city, abbreviation)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        {
          error: 'Query parameter "q" is required',
          results: [],
        },
        { status: 400 }
      );
    }

    // Create orchestrator with runtime API keys
    const orchestrator = new LeagueOrchestrator({
      sportsDataIOKey: process.env.SPORTSDATAIO_API_KEY,
    });

    // Search across all leagues
    const results = await orchestrator.search(query);

    // Cache search results for 1 hour (teams don't change often)
    const cacheTTL = 3600;

    return NextResponse.json(
      {
        results,
        meta: {
          dataSource: 'Multi-League Orchestrator',
          leagues: ['MLB', 'NFL', 'NBA', 'NCAA Football', 'College Baseball'],
          query,
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          count: results.length,
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
        error: error instanceof Error ? error.message : 'Search failed',
        results: [],
      },
      { status: 500 }
    );
  }
}
