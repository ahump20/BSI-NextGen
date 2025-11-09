/**
 * Unified Standings API Endpoint
 *
 * GET /api/unified/standings
 *
 * Returns standings from ALL leagues (MLB, NFL, NBA)
 *
 * Timezone: America/Chicago
 */

import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@bsi/api';

export const dynamic = 'force-dynamic';

/**
 * GET /api/unified/standings
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch standings from all leagues
    const response = await orchestrator.getAllStandings();

    // Standings change less frequently - cache for 5 minutes
    const cacheTTL = 300;

    return NextResponse.json(
      {
        standings: response.data,
        meta: {
          dataSource: 'Multi-League Orchestrator',
          leagues: ['MLB', 'NFL', 'NBA'],
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
    console.error('[Unified Standings API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch standings',
        standings: [],
      },
      { status: 500 }
    );
  }
}
