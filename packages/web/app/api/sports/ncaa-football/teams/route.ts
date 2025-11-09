import { NextRequest, NextResponse } from 'next/server';
import { NCAAFootballAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/ncaa-football/teams
 * Fetch all NCAA Football teams
 *
 * Query params:
 * - group: Team group/division (optional, defaults to FBS - group 80)
 *   - FBS: 80
 *   - FCS: 81
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get('group') || undefined;

    const adapter = new NCAAFootballAdapter();
    const response = await adapter.getTeams(group);

    return NextResponse.json(response, {
      headers: {
        // Team data rarely changes, cache for 1 hour
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch (error) {
    console.error('[NCAA Football Teams API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NCAA Football teams',
      },
      { status: 500 }
    );
  }
}
