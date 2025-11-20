import { NextRequest, NextResponse } from 'next/server';
import { apiHealthMonitor } from '@/lib/monitoring/api-health';

/**
 * System Health Check API
 *
 * GET /api/health
 *
 * Returns overall system health status and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const systemHealth = apiHealthMonitor.getSystemHealth();
    const allChecks = apiHealthMonitor.getAllHealthChecks();

    return NextResponse.json(
      {
        status: systemHealth.status,
        timestamp: new Date().toISOString(),
        system: {
          healthy: systemHealth.healthyEndpoints,
          degraded: systemHealth.degradedEndpoints,
          down: systemHealth.downEndpoints,
          averageResponseTime: Math.round(systemHealth.averageResponseTime),
          averageUptime: systemHealth.averageUptime.toFixed(2),
        },
        endpoints: allChecks.map((check) => ({
          endpoint: check.endpoint,
          status: check.status,
          responseTime: Math.round(check.responseTime),
          errorRate: check.errorRate.toFixed(2),
          dataQuality: check.dataQuality,
          lastChecked: check.lastChecked,
        })),
      },
      {
        status: systemHealth.status === 'down' ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[Health API] Error checking health:', error);
    return NextResponse.json(
      {
        status: 'down',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
