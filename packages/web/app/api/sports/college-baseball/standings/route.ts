import { NextRequest, NextResponse } from 'next/server';
import { createD1BaseballAdapter } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/college-baseball/standings
 * Fetch NCAA conference standings
 *
 * Query params:
 * - conference: Conference name (optional, defaults to all)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conference = searchParams.get('conference');

    const adapter = createD1BaseballAdapter({
      baseURL: process.env.D1BASEBALL_API_URL,
      timeout: 15000,
    });

    let standings;
    if (conference) {
      // Fetch specific conference
      const conferenceStandings = await adapter.getConferenceStandings(conference);
      standings = conferenceStandings ? [conferenceStandings] : [];
    } else {
      // Fetch all conferences
      standings = await adapter.getAllConferenceStandings();
    }

    // Standings update daily - cache for 1 hour
    const cacheTTL = 3600;

    return NextResponse.json(
      {
        standings,
        meta: {
          dataSource: 'D1Baseball.com',
          lastUpdated: new Date().toISOString(),
          timezone: 'America/Chicago',
          count: standings.length,
        },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
        },
      }
    );
  } catch (error) {
    console.error('[D1Baseball Standings API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch standings',
        standings: [],
      },
      { status: 500 }
    );
  }
}
