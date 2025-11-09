import { NextRequest, NextResponse } from 'next/server';
import { NBAAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/nba/standings
 * Fetch NBA standings for current season
 *
 * Query params:
 * - season: Season year (default: 2025)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const season = searchParams.get('season') || '2025';

    const adapter = new NBAAdapter();
    const response = await adapter.getStandings(season);

    return NextResponse.json(response, {
      headers: {
        // Standings change infrequently, cache for 5 minutes
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('[NBA Standings API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NBA standings',
      },
      { status: 500 }
    );
  }
}
