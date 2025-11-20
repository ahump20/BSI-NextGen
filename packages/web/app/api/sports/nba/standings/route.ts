import { NextRequest, NextResponse } from 'next/server';
import { NBAESPNAdapter } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/nba/standings
 * Fetch NBA standings for current 2025-2026 season
 *
 * Uses ESPN API for live current season data
 * (SportsDataIO may have delayed season updates)
 */
export async function GET(request: NextRequest) {
  try {
    const adapter = new NBAESPNAdapter();
    const response = await adapter.getStandings();

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
