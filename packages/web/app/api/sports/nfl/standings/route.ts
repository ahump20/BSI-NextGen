import { NextRequest, NextResponse } from 'next/server';
import { NFLAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/nfl/standings
 * Fetch NFL standings for a specific season
 *
 * Query params:
 * - season: NFL season year (optional, defaults to current year)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentYear = new Date().getFullYear();
    const season = parseInt(searchParams.get('season') || currentYear.toString());

    const adapter = new NFLAdapter();
    const response = await adapter.getStandings(season);

    return NextResponse.json(response, {
      headers: {
        // Standings change infrequently, cache for 5 minutes
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('[NFL Standings API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NFL standings',
      },
      { status: 500 }
    );
  }
}
