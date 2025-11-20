/**
 * Instrumented API Route for Sports Data
 *
 * Production-ready API handler with full observability:
 * - Structured logging with correlation IDs
 * - Distributed tracing with OpenTelemetry
 * - Metrics recording to Cloudflare Analytics Engine
 * - Circuit breaker for external APIs
 * - Performance monitoring and SLO tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { SportsDataService } from '@bsi/api';
import type { Sport } from '@bsi/shared';

// Import observability helpers
import {
  RequestContext,
  StructuredLogger,
  MetricsRecorder,
  measureAsync,
} from '../../../../../../observability/helpers/telemetry';
import {
  CircuitBreakerManager,
  CircuitState,
} from '../../../../../../observability/helpers/circuit-breaker';

// ============================================================================
// Types
// ============================================================================

interface Env {
  ANALYTICS?: AnalyticsEngineDataset;
  SPORTSDATAIO_API_KEY?: string;
}

// ============================================================================
// Global Circuit Breaker Manager
// ============================================================================

// Note: In production, this would be stored in Durable Objects or KV
// For now, we use in-memory (resets on worker restart)
let circuitBreakerManager: CircuitBreakerManager | null = null;

function getCircuitBreakerManager(
  logger: StructuredLogger,
  metrics: MetricsRecorder
): CircuitBreakerManager {
  if (!circuitBreakerManager) {
    circuitBreakerManager = new CircuitBreakerManager(logger, metrics);
  }
  return circuitBreakerManager;
}

// ============================================================================
// API Handler with Full Observability
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params: { sport: string; endpoint: string } }
) {
  // Extract environment bindings (Cloudflare Workers specific)
  const env = (request as any).env as Env | undefined;

  // Create request context with observability tools
  const requestContext = new RequestContext(request, env?.ANALYTICS);
  const { logger, tracer, metrics } = requestContext;

  // Extract route parameters
  const { sport, endpoint } = context.params;
  const searchParams = request.nextUrl.searchParams;

  // Set context for logging
  logger.setContext({
    service: 'bsi-api',
    sport,
    endpoint,
  });

  // Start root span
  const rootSpanId = tracer.startSpan('api.request', {
    'http.method': 'GET',
    'http.route': `/api/sports/${sport}/${endpoint}`,
    'sport': sport,
    'endpoint': endpoint,
  });

  logger.info('API request started', {
    sport,
    endpoint,
    queryParams: Object.fromEntries(searchParams.entries()),
  });

  try {
    // Map URL sport to Sport type
    const sportMap: Record<string, Sport> = {
      'mlb': 'MLB',
      'nfl': 'NFL',
      'nba': 'NBA',
      'ncaa_football': 'NCAA_FOOTBALL',
      'college_baseball': 'COLLEGE_BASEBALL',
    };

    const sportType = sportMap[sport];

    if (!sportType) {
      logger.warn('Unsupported sport requested', { sport });
      metrics.counter('api.errors.invalid_sport', 1, { sport });

      tracer.addSpanAttributes(rootSpanId, {
        'error': true,
        'error.type': 'invalid_sport',
      });
      tracer.endSpan(rootSpanId);

      const errorResponse = NextResponse.json(
        {
          error: `Unsupported sport: ${sport}`,
          requestId: requestContext.requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );

      requestContext.finalize(errorResponse);
      return errorResponse;
    }

    // Initialize circuit breaker manager
    const cbManager = getCircuitBreakerManager(logger, metrics);

    // Create sports data service with circuit breaker
    const sportsService = new SportsDataService();

    // Handle different endpoints
    let result: any;
    let cacheControl: string;

    switch (endpoint) {
      case 'games': {
        const spanId = tracer.startSpan('get_games', { sport: sportType }, rootSpanId);

        const date = searchParams.get('date') || undefined;
        const week = searchParams.get('week')
          ? parseInt(searchParams.get('week')!)
          : undefined;
        const season = searchParams.get('season')
          ? parseInt(searchParams.get('season')!)
          : undefined;

        logger.info('Fetching games', { sport: sportType, date, week, season });

        // Get circuit breaker for provider
        const provider = getProviderForSport(sportType);
        const breaker = cbManager.getBreaker({
          name: provider,
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 300000, // 5 minutes
        });

        // Execute with circuit breaker
        result = await breaker.execute(async () => {
          return measureAsync(
            () => sportsService.getGames(sportType, { date, week, season }),
            metrics,
            'external_api.duration',
            { sport: sportType, endpoint: 'games', provider }
          );
        });

        cacheControl = 'public, s-maxage=30, stale-while-revalidate=60';
        tracer.endSpan(spanId, { games_count: result.games?.length || 0 });
        break;
      }

      case 'standings': {
        const spanId = tracer.startSpan('get_standings', { sport: sportType }, rootSpanId);

        const divisionId = searchParams.get('divisionId') || undefined;
        const conference = searchParams.get('conference') || undefined;
        const season = searchParams.get('season')
          ? parseInt(searchParams.get('season')!)
          : undefined;

        logger.info('Fetching standings', {
          sport: sportType,
          divisionId,
          conference,
          season,
        });

        const provider = getProviderForSport(sportType);
        const breaker = cbManager.getBreaker({
          name: provider,
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 300000,
        });

        result = await breaker.execute(async () => {
          return measureAsync(
            () => sportsService.getStandings(sportType, {
              divisionId,
              conference,
              season,
            }),
            metrics,
            'external_api.duration',
            { sport: sportType, endpoint: 'standings', provider }
          );
        });

        cacheControl = 'public, s-maxage=300, stale-while-revalidate=600';
        tracer.endSpan(spanId, { standings_count: result.standings?.length || 0 });
        break;
      }

      case 'teams': {
        const spanId = tracer.startSpan('get_teams', { sport: sportType }, rootSpanId);

        logger.info('Fetching teams', { sport: sportType });

        const provider = getProviderForSport(sportType);
        const breaker = cbManager.getBreaker({
          name: provider,
          failureThreshold: 5,
          successThreshold: 3,
          timeout: 300000,
        });

        result = await breaker.execute(async () => {
          return measureAsync(
            () => sportsService.getTeams(sportType),
            metrics,
            'external_api.duration',
            { sport: sportType, endpoint: 'teams', provider }
          );
        });

        cacheControl = 'public, s-maxage=3600, stale-while-revalidate=7200';
        tracer.endSpan(spanId, { teams_count: result.teams?.length || 0 });
        break;
      }

      default: {
        logger.warn('Unsupported endpoint requested', { endpoint });
        metrics.counter('api.errors.invalid_endpoint', 1, {
          sport: sportType,
          endpoint,
        });

        tracer.addSpanAttributes(rootSpanId, {
          'error': true,
          'error.type': 'invalid_endpoint',
        });
        tracer.endSpan(rootSpanId);

        const errorResponse = NextResponse.json(
          {
            error: `Unsupported endpoint: ${endpoint}`,
            requestId: requestContext.requestId,
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );

        requestContext.finalize(errorResponse);
        return errorResponse;
      }
    }

    // Add observability metadata to response
    const enrichedResult = {
      ...result,
      meta: {
        ...result.meta,
        requestId: requestContext.requestId,
        traceId: tracer.getTraceId(),
        timezone: 'America/Chicago',
      },
    };

    logger.info('API request completed successfully', {
      sport: sportType,
      endpoint,
      resultSize: JSON.stringify(enrichedResult).length,
    });

    // Record success metrics
    metrics.counter('api.requests.success', 1, {
      sport: sportType,
      endpoint,
    });

    tracer.addSpanAttributes(rootSpanId, {
      'http.status_code': 200,
      'response.size': JSON.stringify(enrichedResult).length,
    });
    tracer.endSpan(rootSpanId);

    const response = NextResponse.json(enrichedResult, {
      headers: {
        'Cache-Control': cacheControl,
        'X-Request-Id': requestContext.requestId,
        'X-Trace-Id': tracer.getTraceId(),
      },
    });

    requestContext.finalize(response);
    return response;

  } catch (error) {
    // Determine error type
    const isCircuitBreakerError = error instanceof Error &&
      error.message.includes('Circuit breaker is OPEN');

    logger.error(
      isCircuitBreakerError ? 'Circuit breaker rejected request' : 'API request failed',
      error,
      {
        sport,
        endpoint,
        errorType: error instanceof Error ? error.name : 'unknown',
      }
    );

    // Record error metrics
    metrics.counter('api.requests.error', 1, {
      sport: sport || 'unknown',
      endpoint: endpoint || 'unknown',
      error_type: error instanceof Error ? error.name : 'unknown',
    });

    // Add error attributes to span
    tracer.addSpanAttributes(rootSpanId, {
      'error': true,
      'error.type': error instanceof Error ? error.name : 'unknown',
      'error.message': error instanceof Error ? error.message : String(error),
    });
    tracer.endSpan(rootSpanId);

    // Return appropriate error response
    const statusCode = isCircuitBreakerError ? 503 : 500;
    const errorMessage = isCircuitBreakerError
      ? 'Service temporarily unavailable. Please try again in a few minutes.'
      : error instanceof Error
      ? error.message
      : 'Internal server error';

    const errorResponse = NextResponse.json(
      {
        error: errorMessage,
        requestId: requestContext.requestId,
        traceId: tracer.getTraceId(),
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
      { status: statusCode }
    );

    requestContext.finalize(errorResponse);
    return errorResponse;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get external API provider name for sport
 */
function getProviderForSport(sport: Sport): string {
  const providerMap: Record<Sport, string> = {
    'MLB': 'mlb_stats_api',
    'NFL': 'sportsdata_io',
    'NBA': 'sportsdata_io',
    'NCAA_FOOTBALL': 'espn_api',
    'COLLEGE_BASEBALL': 'espn_api',
  };

  return providerMap[sport] || 'unknown';
}
