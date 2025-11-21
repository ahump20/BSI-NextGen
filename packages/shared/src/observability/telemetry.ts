export type TelemetryLevel = 'info' | 'warn' | 'error';

export interface MetricSample {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string | number | boolean>;
  timestamp: number;
}

export interface Span {
  traceId: string;
  name: string;
  startedAt: number;
  end: (status?: 'ok' | 'error', attributes?: Record<string, any>) => MetricSample;
}

const getGlobal = (): any => (typeof globalThis !== 'undefined' ? (globalThis as any) : {});

export const createTraceId = (prefix: string = 'trace'): string => {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? (crypto as any).randomUUID()
      : Math.random().toString(16).substring(2, 10);
  return `${prefix}-${Date.now()}-${random}`;
};

export const createLogger = (component: string, context: Record<string, any> = {}) => {
  const base = { component, ...context };

  const log = (level: TelemetryLevel, message: string, data?: Record<string, any>) => {
    const entry = {
      level,
      message,
      ...base,
      ...data,
      timestamp: new Date().toISOString(),
    };

    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(`[${component}] ${message}`, entry);
  };

  return {
    info: (message: string, data?: Record<string, any>) => log('info', message, data),
    warn: (message: string, data?: Record<string, any>) => log('warn', message, data),
    error: (message: string, data?: Record<string, any>) => log('error', message, data),
  };
};

export const recordMetric = (
  name: string,
  value: number,
  unit?: string,
  tags?: Record<string, string | number | boolean>
): MetricSample => {
  const sample: MetricSample = {
    name,
    value,
    unit,
    tags,
    timestamp: Date.now(),
  };

  const globalScope = getGlobal();
  if (globalScope.__bsiMetricBuffer) {
    globalScope.__bsiMetricBuffer.push(sample);
  }

  console.log('[METRIC]', sample);
  return sample;
};

export const startSpan = (
  name: string,
  context: Record<string, any> = {}
): Span => {
  const traceId = context.traceId || createTraceId(name);
  const startedAt = Date.now();
  const logger = createLogger('trace', { traceId, name, ...context });

  return {
    traceId,
    name,
    startedAt,
    end: (status: 'ok' | 'error' = 'ok', attributes: Record<string, any> = {}) => {
      const durationMs = Date.now() - startedAt;
      logger.info('span.complete', { status, durationMs, ...attributes });
      return recordMetric(`${name}.duration`, durationMs, 'ms', {
        status,
        traceId,
        ...attributes,
      });
    },
  };
};
