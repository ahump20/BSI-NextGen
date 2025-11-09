import { NextRequest, NextResponse } from 'next/server';
import { NBAAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/nba/teams
 * Fetch all NBA teams
 *
 * Returns all 30 NBA teams with basic information
 */
export async function GET(request: NextRequest) {
  try {
    const adapter = new NBAAdapter();
    const response = await adapter.getTeams();

    return NextResponse.json(response, {
      headers: {
        // Team data rarely changes, cache for 1 hour
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch (error) {
    console.error('[NBA Teams API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NBA teams',
      },
      { status: 500 }
    );
  }
}
