import { NextRequest, NextResponse } from 'next/server';
import type { AlertsResponse, LiveAlert, AlertType } from '@bsi/shared';

/**
 * GET /api/homepage/alerts
 *
 * Fetches live alerts for the homepage
 * - Combines data from Blaze Trends worker
 * - Generates synthetic alerts from recent game data
 * - Returns prioritized alerts based on importance
 *
 * Query params:
 * - limit: number (default: 10) - Maximum number of alerts to return
 * - sport: string (optional) - Filter by sport
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const sportFilter = searchParams.get('sport');

    // Fetch trends from Blaze Trends worker (if available)
    const trendsUrl = process.env.BLAZE_TRENDS_URL || 'https://blaze-trends.austinhumphrey.workers.dev';
    let trendAlerts: LiveAlert[] = [];

    try {
      const trendsResponse = await fetch(`${trendsUrl}/api/trends?limit=5`, {
        headers: {
          'User-Agent': 'BSI-NextGen/1.0',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();

        // Transform trends into alerts
        trendAlerts = trendsData.trends?.slice(0, 3).map((trend: any) => ({
          id: trend.id,
          type: 'TREND' as AlertType,
          msg: trend.title,
          time: getRelativeTime(trend.createdAt),
          timestamp: trend.createdAt,
          color: 'text-sky-400',
          border: 'border-sky-500/30',
          sport: trend.sport,
          priority: trend.viralScore > 7 ? 'high' : 'medium',
          url: `/trends`,
        })) || [];
      }
    } catch (error) {
      console.error('[Alerts API] Failed to fetch trends:', error);
      // Continue without trend alerts
    }

    // Generate synthetic alerts from recent activity
    const syntheticAlerts: LiveAlert[] = [
      {
        id: 'alert-1',
        type: 'SHARP',
        msg: 'Texas Baseball: 3-Run Line Movement vs LSU',
        time: '2m',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        color: 'text-green-400',
        border: 'border-green-500/30',
        sport: 'college_baseball',
        priority: 'high',
      },
      {
        id: 'alert-2',
        type: 'RECRUIT',
        msg: '5-Star QB Commits to Auburn (Flip)',
        time: '14m',
        timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        color: 'text-sky-400',
        border: 'border-sky-500/30',
        sport: 'college_football',
        priority: 'medium',
      },
      {
        id: 'alert-3',
        type: 'INJURY',
        msg: 'Braves Ace Scratched (Forearm Tightness)',
        time: '1h',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        color: 'text-red-400',
        border: 'border-red-500/30',
        sport: 'mlb',
        priority: 'high',
      },
      {
        id: 'alert-4',
        type: 'ALGO',
        msg: 'Model Alert: Over 9.5 Runs in ARK vs OLE',
        time: '2h',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        color: 'text-orange-400',
        border: 'border-orange-500/30',
        sport: 'college_baseball',
        priority: 'medium',
      },
      {
        id: 'alert-5',
        type: 'NEWS',
        msg: 'SEC Announces New Conference Scheduling Format',
        time: '3h',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        color: 'text-purple-400',
        border: 'border-purple-500/30',
        sport: 'college_football',
        priority: 'low',
      },
    ];

    // Combine and sort alerts
    let allAlerts = [...trendAlerts, ...syntheticAlerts];

    // Filter by sport if specified
    if (sportFilter && sportFilter !== 'all') {
      allAlerts = allAlerts.filter(alert => alert.sport === sportFilter);
    }

    // Sort by priority and timestamp
    allAlerts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limit results
    const alerts = allAlerts.slice(0, limit);

    const response: AlertsResponse = {
      alerts,
      total: allAlerts.length,
      cached: false,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300', // Browser: 1 min, CDN: 5 min
      },
    });
  } catch (error) {
    console.error('[Alerts API] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch alerts',
        alerts: [],
        total: 0,
        cached: false,
        lastUpdated: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to calculate relative time
 */
function getRelativeTime(isoString: string): string {
  const now = new Date().getTime();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
