import { NextRequest, NextResponse } from 'next/server';
import { MLBAdapter } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/mlb/teams
 * Fetch all MLB teams
 *
 * Returns all 30 MLB teams with basic information
 */
export async function GET(request: NextRequest) {
  try {
    const adapter = new MLBAdapter();
    const response = await adapter.getTeams();

    return NextResponse.json(response, {
      headers: {
        // Team data rarely changes, cache for 1 hour
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch (error) {
    console.error('[MLB Teams API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch MLB teams',
      },
      { status: 500 }
    );
  }
}
