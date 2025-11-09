import { NextRequest, NextResponse } from 'next/server';
import { createD1BaseballAdapter } from '@bsi/api';

/**
 * GET /api/sports/college-baseball/rankings
 * Fetch D1Baseball Top 25 rankings
 *
 * Query params:
 * - week: Specific week number (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const week = searchParams.get('week');

    const adapter = createD1BaseballAdapter({
      baseURL: process.env.D1BASEBALL_API_URL,
      timeout: 15000,
    });

    const rankings = await adapter.getRankings(week || undefined);

    // Rankings update weekly - cache for 1 hour
    const cacheTTL = 3600;

    return NextResponse.json(
      {
        rankings,
        meta: {
          dataSource: 'D1Baseball.com',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          count: rankings.length,
        },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
        },
      }
    );
  } catch (error) {
    console.error('[D1Baseball Rankings API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch rankings',
        rankings: [],
      },
      { status: 500 }
    );
  }
}
