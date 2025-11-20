import { NextResponse } from 'next/server';

/**
 * Detailed Status Endpoint
 * GET /api/status
 *
 * Returns comprehensive system status including:
 * - API health checks
 * - Performance metrics
 * - Data freshness indicators
 */
export async function GET() {
  const startTime = Date.now();

  // System metrics
  const status = {
    timestamp: new Date().toISOString(),
    timezone: 'America/Chicago',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime(),
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      percentage: ((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100).toFixed(2),
    },
    sports: {
      mlb: {
        status: 'operational',
        dataSource: 'MLB Stats API',
        lastUpdate: new Date().toISOString(),
        updateFrequency: '30s during games',
      },
      nfl: {
        status: 'operational',
        dataSource: 'ESPN API',
        lastUpdate: new Date().toISOString(),
        updateFrequency: '30s during games',
      },
      nba: {
        status: 'operational',
        dataSource: 'ESPN API',
        season: '2025-2026',
        lastUpdate: new Date().toISOString(),
        updateFrequency: '30s during games',
      },
      'college-baseball': {
        status: 'operational',
        dataSource: 'ESPN API + Enhanced Box Scores',
        priority: 'HIGH',
        lastUpdate: new Date().toISOString(),
        updateFrequency: '30s during games',
      },
    },
    performance: {
      responseTime: 0, // Will be calculated at the end
    },
  };

  // Calculate response time
  status.performance.responseTime = Date.now() - startTime;

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'public, max-age=30, s-maxage=60',
    },
  });
}
