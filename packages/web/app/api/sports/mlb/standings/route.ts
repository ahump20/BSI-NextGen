import { NextRequest, NextResponse } from 'next/server';
import { MLBAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/mlb/standings
 * Fetch MLB standings for a specific division or all divisions
 *
 * Query params:
 * - divisionId: MLB division ID (optional, fetches all if not specified)
 *   - AL East: 201
 *   - AL Central: 202
 *   - AL West: 200
 *   - NL East: 204
 *   - NL Central: 205
 *   - NL West: 203
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const divisionId = searchParams.get('divisionId') || undefined;

    const adapter = new MLBAdapter();
    const response = await adapter.getStandings(divisionId);

    return NextResponse.json(response, {
      headers: {
        // Standings change infrequently, cache for 5 minutes
        'Cache-Control': 'public, max-age=300, s-maxage=600',
      },
    });
  } catch (error) {
    console.error('[MLB Standings API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch MLB standings',
      },
      { status: 500 }
    );
  }
}
