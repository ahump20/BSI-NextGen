/**
 * OpenTelemetry and Observability Helpers for Cloudflare Edge Functions
 *
 * Provides structured logging, metrics recording, and trace correlation
 * for BSI-NextGen production deployment.
 */

import { randomUUID } from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface LogContext {
  requestId: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sport?: string;
  endpoint?: string;
  method?: string;
  [key: string]: any;
}

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  attributes: Record<string, any>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// ============================================================================
// Logger Implementation
// ============================================================================

export class StructuredLogger {
  private context: LogContext;

  constructor(context: Partial<LogContext> = {}) {
    this.context = {
      requestId: context.requestId || randomUUID(),
      traceId: context.traceId,
      spanId: context.spanId,
      userId: context.userId,
      sport: context.sport,
      endpoint: context.endpoint,
      method: context.method,
      ...context,
    };
  }

  /**
   * Set additional context fields
   */
  setContext(updates: Partial<LogContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Create a child logger with inherited context
   */
  child(childContext: Partial<LogContext>): StructuredLogger {
    return new StructuredLogger({ ...this.context, ...childContext });
  }

  /**
   * Log at debug level
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }

  /**
   * Log at info level
   */
  info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  /**
   * Log at warn level
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
    const errorMeta = error instanceof Error
      ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        }
      : { error: String(error) };

    this.log('error', message, { ...errorMeta, ...meta });
  }

  /**
   * Log at fatal level
   */
  fatal(message: string, error?: Error | unknown, meta?: Record<string, any>): void {
    const errorMeta = error instanceof Error
      ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        }
      : { error: String(error) };

    this.log('fatal', message, { ...errorMeta, ...meta });
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, meta?: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
      // Add Chicago timezone for consistency
      timezone: 'America/Chicago',
    };

    // Use appropriate console method
    const consoleMethod = level === 'error' || level === 'fatal' ? console.error : console.log;
    consoleMethod(JSON.stringify(logEntry));
  }
}

// ============================================================================
// Metrics Recording
// ============================================================================

export class MetricsRecorder {
  private analyticsEngine?: AnalyticsEngineDataset;

  constructor(analyticsEngine?: AnalyticsEngineDataset) {
    this.analyticsEngine = analyticsEngine;
  }

  /**
   * Record a counter metric (increments)
   */
  counter(name: string, value: number = 1, dimensions?: Record<string, string>): void {
    this.recordMetric({ name, value, unit: 'count', dimensions });
  }

  /**
   * Record a histogram metric (for latency/duration)
   */
  histogram(name: string, value: number, dimensions?: Record<string, string>): void {
    this.recordMetric({ name, value, unit: 'milliseconds', dimensions });
  }

  /**
   * Record a gauge metric (absolute value)
   */
  gauge(name: string, value: number, dimensions?: Record<string, string>): void {
    this.recordMetric({ name, value, unit: 'value', dimensions });
  }

  /**
   * Internal method to write metrics to Analytics Engine
   */
  private recordMetric(metric: MetricData): void {
    if (!this.analyticsEngine) {
      // Fallback to console if Analytics Engine not available
      console.log(JSON.stringify({
        type: 'metric',
        ...metric,
        timestamp: (metric.timestamp || new Date()).toISOString(),
      }));
      return;
    }

    try {
      // Write to Cloudflare Analytics Engine
      this.analyticsEngine.writeDataPoint({
        blobs: [metric.name, metric.unit || 'count'],
        doubles: [metric.value],
        indexes: Object.entries(metric.dimensions || {}).map(([k, v]) => `${k}:${v}`),
      });
    } catch (error) {
      console.error('Failed to write metric to Analytics Engine:', error);
    }
  }
}

// ============================================================================
// Distributed Tracing
// ============================================================================

export class Tracer {
  private traceId: string;
  private spans: Map<string, SpanContext> = new Map();
  private logger: StructuredLogger;
  private metrics: MetricsRecorder;

  constructor(traceId?: string, logger?: StructuredLogger, metrics?: MetricsRecorder) {
    this.traceId = traceId || randomUUID();
    this.logger = logger || new StructuredLogger({ traceId: this.traceId });
    this.metrics = metrics || new MetricsRecorder();
  }

  /**
   * Start a new span
   */
  startSpan(name: string, attributes?: Record<string, any>, parentSpanId?: string): string {
    const spanId = randomUUID();
    const span: SpanContext = {
      traceId: this.traceId,
      spanId,
      parentSpanId,
      name,
      startTime: Date.now(),
      attributes: attributes || {},
    };

    this.spans.set(spanId, span);

    this.logger.debug(`Span started: ${name}`, {
      spanId,
      parentSpanId,
      attributes,
    });

    return spanId;
  }

  /**
   * End a span and record its duration
   */
  endSpan(spanId: string, attributes?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) {
      this.logger.warn(`Attempted to end unknown span: ${spanId}`);
      return;
    }

    const duration = Date.now() - span.startTime;

    // Update span attributes
    if (attributes) {
      span.attributes = { ...span.attributes, ...attributes };
    }

    this.logger.debug(`Span ended: ${span.name}`, {
      spanId,
      duration,
      attributes: span.attributes,
    });

    // Record span duration as histogram
    this.metrics.histogram('span.duration', duration, {
      span_name: span.name,
      trace_id: this.traceId,
    });

    // Remove span from active spans
    this.spans.delete(spanId);
  }

  /**
   * Add attributes to an existing span
   */
  addSpanAttributes(spanId: string, attributes: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) {
      this.logger.warn(`Attempted to add attributes to unknown span: ${spanId}`);
      return;
    }

    span.attributes = { ...span.attributes, ...attributes };
  }

  /**
   * Get the current trace ID
   */
  getTraceId(): string {
    return this.traceId;
  }

  /**
   * Create a child tracer with the same trace ID
   */
  child(): Tracer {
    return new Tracer(this.traceId, this.logger, this.metrics);
  }
}

// ============================================================================
// Request Context
// ============================================================================

export class RequestContext {
  public readonly requestId: string;
  public readonly logger: StructuredLogger;
  public readonly tracer: Tracer;
  public readonly metrics: MetricsRecorder;
  private startTime: number;

  constructor(
    request: Request,
    analyticsEngine?: AnalyticsEngineDataset
  ) {
    // Extract or generate request ID
    this.requestId = request.headers.get('x-request-id') || randomUUID();

    // Extract trace ID from headers if present
    const traceId = request.headers.get('x-trace-id') || undefined;

    // Initialize observability tools
    this.metrics = new MetricsRecorder(analyticsEngine);
    this.logger = new StructuredLogger({
      requestId: this.requestId,
      traceId,
      method: request.method,
      url: request.url,
    });
    this.tracer = new Tracer(traceId, this.logger, this.metrics);

    this.startTime = Date.now();
  }

  /**
   * Finalize the request and record metrics
   */
  finalize(response: Response): void {
    const duration = Date.now() - this.startTime;
    const status = response.status;

    // Record request metrics
    this.metrics.histogram('http.request.duration', duration, {
      method: this.logger['context'].method || 'unknown',
      status: String(status),
      endpoint: this.logger['context'].endpoint || 'unknown',
    });

    this.metrics.counter('http.request.count', 1, {
      method: this.logger['context'].method || 'unknown',
      status: String(status),
    });

    // Log request completion
    this.logger.info('Request completed', {
      duration,
      status,
    });
  }

  /**
   * Record an error for this request
   */
  recordError(error: Error | unknown, context?: Record<string, any>): void {
    this.logger.error('Request error', error, context);

    this.metrics.counter('http.request.errors', 1, {
      method: this.logger['context'].method || 'unknown',
      endpoint: this.logger['context'].endpoint || 'unknown',
      error_type: error instanceof Error ? error.name : 'unknown',
    });
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a correlation ID from request headers or generate new one
 */
export function getOrCreateCorrelationId(request: Request): string {
  return (
    request.headers.get('x-correlation-id') ||
    request.headers.get('x-request-id') ||
    randomUUID()
  );
}

/**
 * Extract trace context from request headers
 */
export function extractTraceContext(request: Request): {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
} {
  return {
    traceId: request.headers.get('x-trace-id') || undefined,
    spanId: request.headers.get('x-span-id') || undefined,
    parentSpanId: request.headers.get('x-parent-span-id') || undefined,
  };
}

/**
 * Inject trace context into response headers
 */
export function injectTraceContext(
  headers: Headers,
  context: { traceId: string; spanId?: string }
): void {
  headers.set('x-trace-id', context.traceId);
  if (context.spanId) {
    headers.set('x-span-id', context.spanId);
  }
}

/**
 * Create performance timing helper
 */
export function createTimer(): { elapsed: () => number; elapsedMs: () => number } {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
    elapsedMs: () => Date.now() - start,
  };
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  metrics: MetricsRecorder,
  metricName: string,
  dimensions?: Record<string, string>
): Promise<T> {
  const timer = createTimer();
  try {
    const result = await fn();
    metrics.histogram(metricName, timer.elapsed(), dimensions);
    return result;
  } catch (error) {
    metrics.counter(`${metricName}.errors`, 1, dimensions);
    throw error;
  }
}
