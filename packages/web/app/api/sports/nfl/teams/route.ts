import { NextRequest, NextResponse } from 'next/server';
import { NFLAdapter } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/nfl/teams
 * Fetch all NFL teams
 */
export async function GET() {
  try {
    const adapter = new NFLAdapter(process.env.SPORTSDATAIO_API_KEY);
    const response = await adapter.getTeams();

    return NextResponse.json(response, {
      headers: {
        // Team data rarely changes, cache for 1 hour
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch (error) {
    console.error('[NFL Teams API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NFL teams',
      },
      { status: 500 }
    );
  }
}
