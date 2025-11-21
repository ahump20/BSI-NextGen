import { NextRequest, NextResponse } from 'next/server';
import {
  AlertContext,
  DashboardAccumulator,
  createDashboardAccumulator,
  createTraceId,
  evaluateAlerts,
  pushRequestSample,
  pushWebVital,
  recordMetric,
  summarizeDashboard,
  createLogger,
} from '@bsi/shared';

export type CacheStatus = 'hit' | 'miss' | 'bypass';

export interface ApiObservabilityContext {
  traceId: string;
  logger: ReturnType<typeof createLogger>;
}

export interface ObservedResponse {
  response: NextResponse;
  cacheStatus?: CacheStatus;
  alertContext?: Partial<AlertContext>;
}

export type ApiHandler = (
  request: NextRequest,
  context: ApiObservabilityContext
) => Promise<NextResponse | ObservedResponse>;

export interface ApiObservabilityOptions {
  feature: string;
  cacheStatus?: CacheStatus;
  alertContext?: Partial<AlertContext>;
}

const getDashboardState = (): DashboardAccumulator => {
  const globalScope = globalThis as any;
  if (!globalScope.__bsiDashboard) {
    globalScope.__bsiDashboard = createDashboardAccumulator();
  }
  return globalScope.__bsiDashboard as DashboardAccumulator;
};

export const getDashboardSnapshot = () => summarizeDashboard(getDashboardState());

export const recordWebVitalMetric = (metric: string, value: number) => {
  pushWebVital(getDashboardState(), metric, value);
};

export const withApiObservability = (
  handler: ApiHandler,
  options: ApiObservabilityOptions
) => {
  return async (request: NextRequest) => {
    const traceId = createTraceId(`api-${options.feature}`);
    const logger = createLogger(`api:${options.feature}`, {
      traceId,
      route: request.nextUrl.pathname,
    });

    const startedAt = Date.now();
    let response: NextResponse;
    let cacheStatus: CacheStatus | undefined = options.cacheStatus;
    let alertContext: Partial<AlertContext> | undefined = options.alertContext;
    let handlerError: Error | null = null;

    try {
      const result = await handler(request, { traceId, logger });
      if ('response' in (result as ObservedResponse)) {
        const observed = result as ObservedResponse;
        response = observed.response;
        cacheStatus = observed.cacheStatus ?? cacheStatus;
        alertContext = observed.alertContext ?? alertContext;
      } else {
        response = result as NextResponse;
      }
    } catch (error) {
      handlerError = error as Error;
      logger.error('handler.error', {
        error: handlerError?.message,
      });
      response = NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const duration = Date.now() - startedAt;
    const state = getDashboardState();
    const normalizedCache = cacheStatus ?? 'bypass';
    const upstreamError = alertContext?.upstreamErrorRate ?? (handlerError ? 1 : 0);
    const authFailures = alertContext?.authFailures ?? (response.status === 401 || response.status === 403 ? 1 : 0);
    const mergedAlertContext: AlertContext = {
      dataFreshnessSeconds: alertContext?.dataFreshnessSeconds,
      authFailures,
      upstreamErrorRate: typeof upstreamError === 'number' ? upstreamError : 0,
    };

    pushRequestSample(state, duration, response.status, normalizedCache === 'hit', {
      upstreamError: mergedAlertContext.upstreamErrorRate > 0,
      authFailure: mergedAlertContext.authFailures > 0,
    });

    recordMetric('api.request.duration', duration, 'ms', {
      feature: options.feature,
      status: response.status,
      cacheStatus: normalizedCache,
      route: request.nextUrl.pathname,
      traceId,
    });

    response.headers.set('x-trace-id', traceId);
    response.headers.set('x-response-time', `${duration}ms`);
    response.headers.set('x-cache-status', normalizedCache);

    const alerts = evaluateAlerts(mergedAlertContext);
    alerts.forEach((alert) =>
      logger.warn(`alert.${alert.id}`, {
        severity: alert.severity,
        description: alert.description,
        remediation: alert.remediation,
      })
    );

    return response;
  };
};
