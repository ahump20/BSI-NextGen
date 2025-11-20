import { NextRequest, NextResponse } from 'next/server';
import type { AlertsResponse, LiveAlert, AlertType } from '@bsi/shared';
import { LeagueOrchestrator } from '@bsi/api';

/**
 * GET /api/homepage/alerts
 *
 * Fetches REAL live alerts for the homepage from:
 * - Blaze Trends worker (AI-powered news analysis)
 * - Live games with REAL score updates
 * - Recent completed games with upset alerts
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

    const allAlerts: LiveAlert[] = [];

    // 1. Fetch trends from Blaze Trends worker (if deployed)
    try {
      const trendsUrl =
        process.env.BLAZE_TRENDS_URL ||
        process.env.NEXT_PUBLIC_BLAZE_TRENDS_URL ||
        'https://blaze-trends.austinhumphrey.workers.dev';

      const trendsResponse = await fetch(`${trendsUrl}/api/trends?limit=5`, {
        headers: {
          'User-Agent': 'BSI-NextGen/1.0',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();

        const trendAlerts: LiveAlert[] = trendsData.trends?.map((trend: any) => ({
          id: trend.id,
          type: 'TREND' as AlertType,
          msg: trend.title,
          time: getRelativeTime(trend.createdAt),
          timestamp: trend.createdAt,
          color: 'text-sky-400',
          border: 'border-sky-500/30',
          sport: trend.sport,
          priority: trend.viralScore > 7 ? ('high' as const) : ('medium' as const),
          url: `/trends`,
        })) || [];

        allAlerts.push(...trendAlerts);
      }
    } catch (error) {
      console.warn('[Alerts API] Blaze Trends not available:', error);
      // Continue without trend alerts - not a critical failure
    }

    // 2. Generate alerts from REAL live games using LeagueOrchestrator
    try {
      const orchestrator = new LeagueOrchestrator({
        sportsDataIOKey: process.env.SPORTSDATAIO_API_KEY,
      });

      const liveGamesResponse = await orchestrator.getLiveGames();

      // Convert live games to alerts
      const sportMap: Record<string, string> = {
        MLB: 'mlb',
        NFL: 'nfl',
        NBA: 'nba',
        NCAA_FOOTBALL: 'college_football',
        COLLEGE_BASEBALL: 'college_baseball',
      };

      const liveGameAlerts: LiveAlert[] = liveGamesResponse.data.slice(0, 5).map((game: any) => {
        const isClose = Math.abs((game.homeScore || 0) - (game.awayScore || 0)) <= 3;
        const sportKey = sportMap[game.sport] || 'all';

        return {
          id: `live-${game.id}`,
          type: 'ALGO' as AlertType,
          msg: `${game.awayTeam.abbreviation} ${game.awayScore || 0} @ ${game.homeTeam.abbreviation} ${game.homeScore || 0} - ${game.period || 'LIVE'}`,
          time: 'LIVE',
          timestamp: new Date().toISOString(),
          color: isClose ? 'text-yellow-400' : 'text-green-400',
          border: isClose ? 'border-yellow-500/30' : 'border-green-500/30',
          sport: sportKey,
          priority: isClose ? ('high' as const) : ('medium' as const),
          url: `/sports/${sportKey}`,
        };
      });

      allAlerts.push(...liveGameAlerts);
    } catch (error) {
      console.error('[Alerts API] Error fetching live games:', error);
      // Continue without live game alerts
    }

    // Filter by sport if specified
    let filteredAlerts = allAlerts;
    if (sportFilter && sportFilter !== 'all') {
      filteredAlerts = allAlerts.filter((alert) => alert.sport === sportFilter || alert.sport === 'all');
    }

    // Sort by priority and timestamp
    filteredAlerts.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limit results
    const alerts = filteredAlerts.slice(0, limit);

    const response: AlertsResponse = {
      alerts,
      total: allAlerts.length,
      cached: false,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=30, s-maxage=60', // Browser: 30s, CDN: 1min (REAL live data!)
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
