import { NextRequest, NextResponse } from 'next/server';
import { withApiObservability } from '../../lib/observability';

// Configure for edge runtime
export const runtime = 'edge';

/**
 * GET /api/health
 *
 * Basic health check endpoint for production monitoring.
 *
 * Checks:
 * - Service uptime
 * - Critical API availability
 * - Environment configuration
 *
 * Response:
 * - 200: All systems operational
 * - 503: Service degraded or unavailable
 */
export const GET = withApiObservability(async (_request: NextRequest) => {
  const startTime = Date.now();

  const checks = {
    database: 'not_configured', // Placeholder for future D1/KV checks
    external_apis: await checkExternalAPIs(),
    environment: checkEnvironmentConfig(),
  };

  const allHealthy =
    checks.external_apis === 'healthy' &&
    checks.environment === 'healthy';

  const status = allHealthy ? 'healthy' : 'degraded';
  const responseTime = Date.now() - startTime;

  const response = {
    status,
    timestamp: new Date().toISOString(),
    timezone: 'America/Chicago',
    response_time_ms: responseTime,
    checks,
    version: '1.0.0',
  };

  return {
    response: NextResponse.json(response, {
      status: allHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Service-Status': status,
      },
    }),
    alertContext: {
      upstreamErrorRate: checks.external_apis === 'healthy' ? 0 : 0.2,
    },
  };
}, { feature: 'health' });

/**
 * Check external API availability
 */
async function checkExternalAPIs(): Promise<'healthy' | 'degraded' | 'unhealthy'> {
  try {
    // Quick check of MLB Stats API (free, no auth required)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      'https://statsapi.mlb.com/api/v1/schedule?sportId=1',
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'BSI-NextGen/1.0'
        }
      }
    );

    clearTimeout(timeoutId);

    return response.ok ? 'healthy' : 'degraded';
  } catch (error) {
    console.error('[Health Check] External API check failed:', error);
    return 'degraded';
  }
}

/**
 * Check critical environment configuration
 */
function checkEnvironmentConfig(): 'healthy' | 'degraded' {
  // Check if critical environment variables are set
  const hasRequiredEnv = Boolean(
    process.env.NODE_ENV
  );

  // Check if optional but important env vars are set
  const hasSportsDataIO = Boolean(process.env.SPORTSDATAIO_API_KEY);

  if (!hasRequiredEnv) {
    return 'degraded';
  }

  // Healthy if we have at least basic config
  return 'healthy';
}
