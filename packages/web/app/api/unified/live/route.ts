/**
 * Unified Live Games API Endpoint
 *
 * GET /api/unified/live
 *
 * Returns ONLY live games from all leagues
 *
 * Timezone: America/Chicago
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@bsi/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/unified/live
 *
 * Returns only games with status='live'
 */
export async function GET(request: NextRequest) {
  try {
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
    console.error('[Unified Live Games API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch live games',
        liveGames: [],
      },
      { status: 500 }
    );
  }
}
