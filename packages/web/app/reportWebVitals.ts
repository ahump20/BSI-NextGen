'use client';

import type { NextWebVitalsMetric } from 'next/app';
import { analytics } from '@bsi/shared/analytics';

const metricUnits: Record<string, string> = {
  CLS: 'score',
  FID: 'ms',
  INP: 'ms',
  LCP: 'ms',
  TTFB: 'ms',
  FCP: 'ms',
};

const sendToObservabilityApi = (payload: Record<string, any>) => {
  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/observability/vitals', new Blob([body], { type: 'application/json' }));
    return;
  }

  fetch('/api/observability/vitals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Best effort only; do not block UX
  });
};

export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (typeof window === 'undefined') return;

  const unit = metricUnits[metric.name] || 'ms';

  analytics.trackPerformance(metric.name, metric.value, unit);
  analytics.track('core_web_vital', {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    path: window.location.pathname,
    traceId: metric.id,
  });

  sendToObservabilityApi({
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    path: typeof window !== 'undefined' ? window.location.pathname : 'n/a',
    timestamp: Date.now(),
  });
}
