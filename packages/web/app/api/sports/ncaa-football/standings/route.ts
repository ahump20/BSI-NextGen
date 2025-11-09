import { NextRequest, NextResponse } from 'next/server';
import { NCAAFootballAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/ncaa-football/standings
 * Fetch NCAA Football standings for a specific conference or all conferences
 *
 * Query params:
 * - conference: Conference ID (optional, fetches all if not specified)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const conference = searchParams.get('conference') || undefined;

    const adapter = new NCAAFootballAdapter();
    const response = await adapter.getStandings(conference);

    return NextResponse.json(response, {
      headers: {
        // Standings change infrequently, cache for 5 minutes
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('[NCAA Football Standings API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NCAA Football standings',
      },
      { status: 500 }
    );
  }
}
