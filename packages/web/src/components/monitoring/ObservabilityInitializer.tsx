'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from '@bsi/shared';
import { observePerfEntries, trackWebEvent } from '@/lib/observability/tracing';

export function ObservabilityInitializer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const route = useMemo(() => {
    const query = searchParams?.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!route) return;

    analytics.track('page_view', { path: route });

    const start = performance.now();
    const stopObserver = observePerfEntries(route, (entry) => {
      if (entry.entryType === 'resource' && entry.name.includes('/api/sports/')) {
        trackWebEvent(
          {
            route,
            durationMs: entry.duration,
            status: (entry as PerformanceResourceTiming).responseStatus,
          },
          {
            resource: entry.name,
            initiatorType: (entry as PerformanceResourceTiming).initiatorType,
          },
        );
      }
    });

    const handleLoad = () => {
      const durationMs = performance.now() - start;
      trackWebEvent(
        {
          route,
          durationMs,
          renderTimeMs: durationMs,
        },
        {
          navigation: 'complete',
        },
      );
    };

    const handleError = (event: ErrorEvent) => {
      trackWebEvent(
        {
          route,
          durationMs: performance.now() - start,
          status: 500,
          errorMessage: event.message,
        },
        { type: 'client-error' },
      );
    };

    window.addEventListener('load', handleLoad);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('error', handleError);
      stopObserver?.();
    };
  }, [route]);

  return null;
}
