/**
 * Observability Middleware for Next.js API Routes on Cloudflare Workers
 *
 * Wraps API routes with structured logging, metrics, and tracing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RequestContext, injectTraceContext } from './telemetry';

// ============================================================================
// Types
// ============================================================================

export type RouteHandler = (
  request: NextRequest,
  context: {
    params: any;
    requestContext: RequestContext;
  }
) => Promise<NextResponse> | NextResponse;

export interface ObservabilityConfig {
  serviceName: string;
  enableTracing?: boolean;
  enableMetrics?: boolean;
  enableLogging?: boolean;
  analyticsEngine?: AnalyticsEngineDataset;
}

// ============================================================================
// Middleware Implementation
// ============================================================================

/**
 * Wrap a Next.js API route handler with observability
 */
export function withObservability(
  handler: RouteHandler,
  config: ObservabilityConfig
): (request: NextRequest, context: { params: any }) => Promise<NextResponse> {
  return async (request: NextRequest, routeContext: { params: any }) => {
    // Create request context with observability tools
    const requestContext = new RequestContext(request, config.analyticsEngine);

    // Extract route information
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Set additional context
    requestContext.logger.setContext({
      service: config.serviceName,
      endpoint: pathname,
      method,
    });

    // Start root span for request
    const rootSpanId = config.enableTracing
      ? requestContext.tracer.startSpan('http.request', {
          'http.method': method,
          'http.url': pathname,
          'http.user_agent': request.headers.get('user-agent'),
        })
      : undefined;

    requestContext.logger.info('Request started', {
      pathname,
      method,
      userAgent: request.headers.get('user-agent'),
    });

    try {
      // Execute the handler
      const response = await handler(request, {
        params: routeContext.params,
        requestContext,
      });

      // End root span
      if (rootSpanId && config.enableTracing) {
        requestContext.tracer.endSpan(rootSpanId, {
          'http.status_code': response.status,
        });
      }

      // Inject trace context into response headers
      if (config.enableTracing) {
        const responseHeaders = new Headers(response.headers);
        injectTraceContext(responseHeaders, {
          traceId: requestContext.tracer.getTraceId(),
          spanId: rootSpanId,
        });

        // Create new response with updated headers
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      }

      // Finalize request metrics
      requestContext.finalize(response);

      return response;
    } catch (error) {
      // Log and record error
      requestContext.recordError(error, {
        pathname,
        method,
      });

      // End root span with error
      if (rootSpanId && config.enableTracing) {
        requestContext.tracer.addSpanAttributes(rootSpanId, {
          'error': true,
          'error.message': error instanceof Error ? error.message : String(error),
        });
        requestContext.tracer.endSpan(rootSpanId);
      }

      // Return error response
      const errorResponse = NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Internal server error',
          requestId: requestContext.requestId,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );

      requestContext.finalize(errorResponse);

      return errorResponse;
    }
  };
}

/**
 * Create a scoped observability config for a specific service
 */
export function createObservabilityConfig(
  serviceName: string,
  analyticsEngine?: AnalyticsEngineDataset
): ObservabilityConfig {
  return {
    serviceName,
    enableTracing: true,
    enableMetrics: true,
    enableLogging: true,
    analyticsEngine,
  };
}
