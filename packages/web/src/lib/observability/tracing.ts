export type TraceSource = 'edge' | 'web';

export interface TraceRecord {
  traceId: string;
  route: string;
  source: TraceSource;
  sampled: boolean;
  status?: number;
  durationMs?: number;
  userAgent?: string;
  region?: string;
  cacheStatus?: string;
  userImpact?: 'normal' | 'degraded' | 'blocked';
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

const DEFAULT_SAMPLE_RATE = 0.35;

const getSampleRate = () => {
  const envRate = process.env.NEXT_PUBLIC_TRACE_SAMPLE_RATE;
  if (!envRate) return DEFAULT_SAMPLE_RATE;
  const parsed = Number(envRate);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 0), 1) : DEFAULT_SAMPLE_RATE;
};

export const shouldSample = (rate = getSampleRate()): boolean => Math.random() < rate;

export const buildTraceId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `trace_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const emitTrace = (record: TraceRecord) => {
  if (!record.sampled) return;
  const payload = {
    ...record,
    environment: process.env.NODE_ENV || 'development',
    platform: typeof window === 'undefined' ? 'edge' : 'browser',
  };
  // Logging to console keeps us compatible with Cloudflare/Pages workers and GitHub Actions
  // while still enabling collection through log drains.
  // eslint-disable-next-line no-console
  console.info('[bsi-trace]', JSON.stringify(payload));
};

export interface UserImpactSignal {
  route: string;
  durationMs: number;
  status?: number;
  renderTimeMs?: number;
  errorMessage?: string;
}

export const scoreUserImpact = (signal: UserImpactSignal): TraceRecord['userImpact'] => {
  if (signal.status && signal.status >= 500) return 'blocked';
  if (signal.durationMs > 2500 || (signal.renderTimeMs && signal.renderTimeMs > 1200)) return 'degraded';
  return 'normal';
};

export const trackEdgeRequest = (
  route: string,
  init?: Partial<Pick<TraceRecord, 'region' | 'cacheStatus' | 'status'>>,
) => {
  const sampled = shouldSample();
  const trace: TraceRecord = {
    traceId: buildTraceId(),
    route,
    source: 'edge',
    sampled,
    timestamp: new Date().toISOString(),
    region: init?.region,
    cacheStatus: init?.cacheStatus,
    status: init?.status,
  };
  emitTrace(trace);
  return trace;
};

export const trackWebEvent = (signal: UserImpactSignal, metadata?: TraceRecord['metadata']) => {
  const sampled = shouldSample();
  const trace: TraceRecord = {
    traceId: buildTraceId(),
    route: signal.route,
    source: 'web',
    sampled,
    durationMs: signal.durationMs,
    status: signal.status,
    userImpact: scoreUserImpact(signal),
    timestamp: new Date().toISOString(),
    metadata,
  };
  emitTrace(trace);
  return trace;
};

export const observePerfEntries = (
  route: string,
  onEntry: (entry: PerformanceEntry) => void,
): (() => void) | undefined => {
  if (typeof PerformanceObserver === 'undefined') return undefined;

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach(onEntry);
  });

  observer.observe({
    entryTypes: ['navigation', 'resource'],
  });

  return () => observer.disconnect();
};
