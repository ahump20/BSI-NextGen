import { NextRequest, NextResponse } from 'next/server';

/**
 * Analytics API Endpoint
 * Receives analytics events from the frontend and writes to Cloudflare Analytics Engine
 *
 * POST /api/analytics
 * Body: {
 *   session: UserSession,
 *   events: AnalyticsEvent[],
 *   performance: PerformanceMetric[],
 *   errors: ErrorEvent[],
 *   timestamp: number
 * }
 */

interface AnalyticsPayload {
  session: {
    sessionId: string;
    userId?: string;
    startTime: number;
    lastActivity: number;
    pageViews: number;
    events: number;
  };
  events?: Array<{
    name: string;
    properties?: Record<string, string | number | boolean>;
    timestamp?: number;
  }>;
  performance?: Array<{
    metric: string;
    value: number;
    unit: string;
    timestamp: number;
  }>;
  errors?: Array<{
    type: 'error' | 'warning' | 'fatal';
    message: string;
    stack?: string;
    context?: Record<string, any>;
    timestamp: number;
  }>;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const payload: AnalyticsPayload = await request.json();

    // Validate payload
    if (!payload.session || !payload.timestamp) {
      return NextResponse.json(
        { error: 'Invalid payload: missing required fields' },
        { status: 400 }
      );
    }

    // In production, this would write to Cloudflare Analytics Engine
    // For now, we'll log the data and return success

    // Example of how to write to Analytics Engine when configured:
    // const analyticsEngine = (request as any).analytics;
    // if (analyticsEngine) {
    //   // Write events
    //   for (const event of payload.events || []) {
    //     await analyticsEngine.writeDataPoint({
    //       blobs: [event.name, payload.session.sessionId],
    //       doubles: [event.timestamp || Date.now()],
    //       indexes: [event.name]
    //     });
    //   }
    //
    //   // Write performance metrics
    //   for (const perf of payload.performance || []) {
    //     await analyticsEngine.writeDataPoint({
    //       blobs: [perf.metric, payload.session.sessionId],
    //       doubles: [perf.value, perf.timestamp],
    //       indexes: [perf.metric]
    //     });
    //   }
    //
    //   // Write errors
    //   for (const error of payload.errors || []) {
    //     await analyticsEngine.writeDataPoint({
    //       blobs: [error.type, error.message, payload.session.sessionId],
    //       doubles: [error.timestamp],
    //       indexes: [error.type]
    //     });
    //   }
    // }

    // Log analytics data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics API] Received payload:', {
        sessionId: payload.session.sessionId,
        eventCount: payload.events?.length || 0,
        perfCount: payload.performance?.length || 0,
        errorCount: payload.errors?.length || 0,
      });
    }

    return NextResponse.json(
      {
        success: true,
        received: {
          events: payload.events?.length || 0,
          performance: payload.performance?.length || 0,
          errors: payload.errors?.length || 0,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Analytics API] Error processing request:', error);

    return NextResponse.json(
      {
        error: 'Failed to process analytics data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
