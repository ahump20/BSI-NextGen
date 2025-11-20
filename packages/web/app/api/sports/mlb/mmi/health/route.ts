import { NextRequest, NextResponse } from 'next/server';
import { MMIHealthResponse } from '@bsi/shared';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

/**
 * MMI Service URL from environment
 * PRODUCTION: Must be set via Cloudflare environment variables
 * DEVELOPMENT: Can use localhost
 */
const MMI_SERVICE_URL = process.env.MMI_SERVICE_URL;

/**
 * Check if MMI service is configured
 */
function isMMIServiceConfigured(): boolean {
  return Boolean(MMI_SERVICE_URL && !MMI_SERVICE_URL.includes('localhost'));
}

/**
 * GET /api/sports/mlb/mmi/health
 *
 * Health check endpoint for MMI service integration.
 *
 * Checks:
 * - MMI service availability
 * - MLB Stats API connectivity
 * - Service version
 *
 * Response: MMIHealthResponse
 * - status: 'healthy' | 'degraded' | 'unhealthy'
 * - version: Package version
 * - components: Individual component health
 *
 * Example:
 * GET /api/sports/mlb/mmi/health
 */
export async function GET(request: NextRequest) {
  // Check if MMI service is configured
  if (!isMMIServiceConfigured()) {
    return NextResponse.json(
      {
        status: 'unavailable',
        message: 'MMI service not configured',
        config: {
          mmi_service_url: MMI_SERVICE_URL || 'Not set',
        },
        timestamp: new Date().toISOString(),
        timezone: 'America/Chicago',
        documentation: 'https://github.com/ahump20/BSI-NextGen/blob/main/packages/mmi/README.md',
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Service-Status': 'unconfigured',
        },
      }
    );
  }

  const checks: {
    mmi_service: 'up' | 'down';
    mlb_api: 'up' | 'down';
    error?: string;
  } = {
    mmi_service: 'down',
    mlb_api: 'down',
  };

  try {
    // Check MMI service health
    const mmiHealthResponse = await fetch(`${MMI_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (mmiHealthResponse.ok) {
      const mmiHealth = await mmiHealthResponse.json() as MMIHealthResponse;
      checks.mmi_service = 'up';

      // If MMI service provides component health, use it
      if (mmiHealth.components?.mlb_api) {
        checks.mlb_api = mmiHealth.components.mlb_api;
      }
    }
  } catch (error) {
    console.error('[MMI Health] MMI service check failed:', error);
    checks.error = error instanceof Error ? error.message : 'Unknown error';
  }

  // If MMI service is up but didn't report MLB API status, check directly
  if (checks.mmi_service === 'up' && checks.mlb_api === 'down') {
    try {
      const mlbResponse = await fetch(
        'https://statsapi.mlb.com/api/v1/schedule?sportId=1',
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (mlbResponse.ok) {
        checks.mlb_api = 'up';
      }
    } catch (error) {
      console.error('[MMI Health] MLB API check failed:', error);
    }
  }

  // Determine overall status
  const allHealthy = checks.mmi_service === 'up' && checks.mlb_api === 'up';
  const someDegraded = checks.mmi_service === 'up' || checks.mlb_api === 'up';

  const status = allHealthy ? 'healthy' : someDegraded ? 'degraded' : 'unhealthy';

  const response = {
    status,
    timestamp: new Date().toISOString(),
    timezone: 'America/Chicago',
    services: {
      mmi_service: checks.mmi_service,
      mlb_api: checks.mlb_api,
    },
    config: {
      mmi_service_url: MMI_SERVICE_URL,
    },
    ...(checks.error && { error: checks.error }),
  };

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Service-Status': status,
    },
  });
}
