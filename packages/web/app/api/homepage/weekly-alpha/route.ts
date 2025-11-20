import { NextRequest, NextResponse } from 'next/server';
import type { WeeklyAlphaResponse, WeeklyAlpha, SportPerformance } from '@bsi/shared';

/**
 * GET /api/homepage/weekly-alpha
 *
 * Fetches weekly performance metrics for betting/analytics models
 * - Total units won/lost
 * - Win rate percentage
 * - Performance breakdown by sport
 * - ROI calculations
 *
 * Query params:
 * - weeks: number (default: 1) - Number of weeks to include
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const weeks = parseInt(searchParams.get('weeks') || '1', 10);

    // TODO: Integrate with actual analytics engine
    // For now, return realistic mock data

    // Generate performance data for different sports
    const sports: SportPerformance[] = [
      {
        name: 'NCAA Baseball',
        roi: 85,
        color: 'bg-orange-500',
        units: 12.4,
        picks: 28,
        wins: 18,
        losses: 10,
      },
      {
        name: 'SEC Football',
        roi: 62,
        color: 'bg-sky-500',
        units: 8.7,
        picks: 15,
        wins: 10,
        losses: 5,
      },
      {
        name: 'MLB Props',
        roi: 74,
        color: 'bg-white',
        units: 6.1,
        picks: 22,
        wins: 14,
        losses: 8,
      },
      {
        name: 'NBA Totals',
        roi: 58,
        color: 'bg-red-500',
        units: 3.2,
        picks: 18,
        wins: 11,
        losses: 7,
      },
      {
        name: 'College Basketball',
        roi: 71,
        color: 'bg-purple-500',
        units: 5.8,
        picks: 20,
        wins: 13,
        losses: 7,
      },
    ];

    // Calculate totals
    const totalUnits = sports.reduce((sum, sport) => sum + sport.units, 0);
    const totalPicks = sports.reduce((sum, sport) => sum + sport.picks, 0);
    const totalWins = sports.reduce((sum, sport) => sum + sport.wins, 0);
    const winRate = totalPicks > 0 ? (totalWins / totalPicks) * 100 : 0;

    const alpha: WeeklyAlpha = {
      totalUnits: parseFloat(totalUnits.toFixed(1)),
      winRate: parseFloat(winRate.toFixed(1)),
      sports,
      lastUpdated: new Date().toISOString(),
      timezone: 'America/Chicago',
    };

    const response: WeeklyAlphaResponse = {
      alpha,
      cached: false,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=1800', // Browser: 10 min, CDN: 30 min
      },
    });
  } catch (error) {
    console.error('[Weekly Alpha API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch weekly alpha',
        alpha: null,
        cached: false,
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/homepage/weekly-alpha
 *
 * Records a new pick result
 *
 * Body:
 * - sport: string
 * - result: 'win' | 'loss' | 'push'
 * - units: number
 * - confidence: number (1-10)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sport, result, units, confidence } = body;

    // Validate input
    if (!sport || !result || units === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sport, result, units' },
        { status: 400 }
      );
    }

    // TODO: Implement actual database storage for picks
    // For now, return success response

    return NextResponse.json({
      success: true,
      message: `Pick recorded: ${sport} - ${result} (${units} units)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Weekly Alpha API] POST Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to record pick',
      },
      { status: 500 }
    );
  }
}
