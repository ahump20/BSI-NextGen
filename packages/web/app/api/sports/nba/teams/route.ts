import { NextResponse } from 'next/server';
import { NBAAdapter } from '@bsi/api';
import { createLogger } from '@bsi/shared';

const logger = createLogger('NBA-Teams-API');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/nba/teams
 * Fetch all NBA teams
 */
export async function GET() {
  try {
    const adapter = new NBAAdapter(process.env.SPORTSDATAIO_API_KEY);
    const response = await adapter.getTeams();

    return NextResponse.json(response, {
      headers: {
        // Team data rarely changes, cache for 1 hour
        'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      },
    });
  } catch (error) {
    logger.error('Error fetching NBA teams:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NBA teams',
      },
      { status: 500 }
    );
  }
}
