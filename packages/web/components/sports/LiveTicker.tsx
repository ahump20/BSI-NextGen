'use client';

import { useEffect, useMemo, useState } from 'react';
import { typography } from '@/components/design-system/theme';

export interface LiveTickerItem {
  id: string;
  label: string;
  status: string;
  detail?: string;
}

interface LiveTickerProps {
  items: LiveTickerItem[];
  refreshMs?: number;
  onRefresh?: () => void;
}

export function LiveTicker({ items, refreshMs = 30000, onRefresh }: LiveTickerProps) {
  const [remaining, setRemaining] = useState(Math.floor(refreshMs / 1000));

  useEffect(() => {
    if (!onRefresh) return;
    const refreshInterval = setInterval(() => {
      onRefresh();
      setRemaining(Math.floor(refreshMs / 1000));
    }, refreshMs);

    const countdown = setInterval(() => {
      setRemaining((prev) => (prev <= 1 ? Math.floor(refreshMs / 1000) : prev - 1));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdown);
    };
  }, [onRefresh, refreshMs]);

  const marquee = useMemo(() => items.slice(0, 6), [items]);

  return (
    <section
      aria-live="polite"
      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white" role="status">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-200">Live ticker</p>
          <p className="text-sm font-semibold">Realtime game pulses</p>
        </div>
        {onRefresh && (
          <div className="text-xs text-slate-200" aria-live="off">
            Auto-refresh in {remaining}s
          </div>
        )}
      </div>
      <div className="divide-y divide-slate-100" role="list">
        {marquee.length === 0 ? (
          <div className="px-4 py-3 text-sm text-slate-500">No live updates available.</div>
        ) : (
          marquee.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-2"
            >
              <div>
                <p className={`${typography.heading} text-base`}>{item.label}</p>
                {item.detail && <p className={`${typography.caption}`}>{item.detail}</p>}
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
