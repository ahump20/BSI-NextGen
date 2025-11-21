'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LiveDataSkeleton } from '@/components/monitoring/LiveDataSkeleton';
import { formatDateTime, formatNumber, formatPercent } from '@/lib/formatting';

interface ImpactMetric {
  route: string;
  p95Ms: number;
  errorRate: number;
  sampleSize: number;
  lastChecked: string;
  label: string;
}

export default function UserImpactDashboard() {
  const [metrics, setMetrics] = useState<ImpactMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setError(null);
        const res = await fetch('/api/observability/user-impact');
        if (!res.ok) {
          throw new Error('Failed to load user impact metrics');
        }
        const data = await res.json();
        setMetrics(data.routes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load metrics');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8" aria-live="polite">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-gray-500">Reliability Command</p>
            <h1 className="text-3xl font-semibold text-gray-900">User Impact Dashboard</h1>
            <p className="text-gray-600">Edge + web telemetry with sampling, user-impact scoring, and SLA overlays.</p>
          </div>
          <Link
            href="/sports"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Back to Sports
          </Link>
        </header>

        {loading && <LiveDataSkeleton />}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
            <p className="font-medium text-red-800">{error}</p>
            <p className="text-sm text-red-600">Tracer data is unavailable right now. Synthetic checks will continue to retry.</p>
          </div>
        )}

        {!loading && !error && (
          <section aria-label="Critical user impact metrics" className="grid gap-4 md:grid-cols-2">
            {metrics.map((metric) => (
              <div key={metric.route} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">{metric.label}</p>
                    <h2 className="text-lg font-semibold text-gray-900" aria-label={`Route ${metric.route}`}>
                      {metric.route}
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">SLA: &lt; 2.5s</span>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-4" aria-label="Latency and reliability metrics">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs font-medium text-gray-500">p95 latency</dt>
                    <dd className="text-xl font-semibold text-gray-900">{formatNumber(metric.p95Ms)} ms</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs font-medium text-gray-500">Error rate</dt>
                    <dd className="text-xl font-semibold text-gray-900">{formatPercent(metric.errorRate)}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs font-medium text-gray-500">Sample size</dt>
                    <dd className="text-xl font-semibold text-gray-900">{formatNumber(metric.sampleSize)}</dd>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dt className="text-xs font-medium text-gray-500">Last checked</dt>
                    <dd className="text-sm font-semibold text-gray-900">{formatDateTime(metric.lastChecked)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
