/**
 * Unified Live Games API Endpoint
 *
 * GET /api/unified/live
 *
 * Returns ONLY live games from all leagues
 *
 * Timezone: America/Chicago
 */

import { NextResponse } from 'next/server';
import { LeagueOrchestrator } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('Unified-Live-API');

export const dynamic = 'force-dynamic';

/**
 * GET /api/unified/live
 *
 * Returns only games with status='live'
 */
export async function GET() {
  try {
    // Create orchestrator with runtime API keys
    const orchestrator = new LeagueOrchestrator({
      sportsDataIOKey: process.env.SPORTSDATAIO_API_KEY,
    });

    // Fetch live games from all leagues
    const response = await orchestrator.getLiveGames();

    // Live games change frequently - cache for only 15 seconds
    const cacheTTL = 15;

    return NextResponse.json(
      {
        liveGames: response.data,
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
          'X-Live-Update': 'true', // Hint to client to refresh frequently
        },
      }
    );
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch live games',
        liveGames: [],
      },
      { status: 500 }
    );
  }
}
