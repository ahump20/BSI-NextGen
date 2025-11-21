import { recordMetric } from './telemetry';

export interface DashboardAccumulator {
  cacheHits: number;
  cacheMisses: number;
  durations: number[];
  errors: number;
  errorBudgetBreaches: number;
  upstreamErrors: number;
  authFailures: number;
  webVitals: Record<string, number[]>;
}

export interface DashboardSnapshot {
  cache: {
    hitRate: number;
    hits: number;
    misses: number;
  };
  latency: {
    p50: number;
    p95: number;
    samples: number;
  };
  errorBudget: {
    breaches: number;
    upstreamErrors: number;
    authFailures: number;
  };
  coreWebVitals: Record<string, number>;
}

const clampBuffer = (values: number[], max: number = 200): number[] =>
  values.length > max ? values.slice(values.length - max) : values;

const percentile = (values: number[], pct: number): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length));
  return sorted[index];
};

export const createDashboardAccumulator = (): DashboardAccumulator => ({
  cacheHits: 0,
  cacheMisses: 0,
  durations: [],
  errors: 0,
  errorBudgetBreaches: 0,
  upstreamErrors: 0,
  authFailures: 0,
  webVitals: {},
});

export const summarizeDashboard = (state: DashboardAccumulator): DashboardSnapshot => {
  const samples = state.durations.length;
  const hitRate = state.cacheHits + state.cacheMisses === 0
    ? 0
    : state.cacheHits / (state.cacheHits + state.cacheMisses);

  const coreWebVitals: Record<string, number> = {};
  Object.entries(state.webVitals).forEach(([metric, values]) => {
    if (values.length) {
      coreWebVitals[metric] = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
    }
  });

  return {
    cache: {
      hitRate: Number(hitRate.toFixed(3)),
      hits: state.cacheHits,
      misses: state.cacheMisses,
    },
    latency: {
      p50: percentile(state.durations, 50),
      p95: percentile(state.durations, 95),
      samples,
    },
    errorBudget: {
      breaches: state.errorBudgetBreaches,
      upstreamErrors: state.upstreamErrors,
      authFailures: state.authFailures,
    },
    coreWebVitals,
  };
};

export const pushRequestSample = (
  state: DashboardAccumulator,
  durationMs: number,
  statusCode: number,
  cacheHit: boolean,
  alertContext?: { upstreamError?: boolean; authFailure?: boolean }
) => {
  state.durations = clampBuffer([...state.durations, durationMs]);
  cacheHit ? state.cacheHits++ : state.cacheMisses++;

  if (statusCode >= 500 || durationMs > 1000) {
    state.errorBudgetBreaches++;
    recordMetric('error_budget.breach', 1, 'count', { statusCode, durationMs });
  }

  if (alertContext?.upstreamError) {
    state.upstreamErrors++;
  }

  if (alertContext?.authFailure) {
    state.authFailures++;
  }
};

export const pushWebVital = (
  state: DashboardAccumulator,
  metric: string,
  value: number
) => {
  const buffer = state.webVitals[metric] || [];
  state.webVitals[metric] = clampBuffer([...buffer, value]);
};
