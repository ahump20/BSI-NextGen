'use client';

import React, { useEffect, useState } from 'react';
import type { WeeklyAlpha, WeeklyAlphaResponse } from '@bsi/shared';

/**
 * PerformanceCard Component
 *
 * Displays weekly performance metrics for betting/analytics models
 * Features:
 * - Total units won/lost
 * - Sport-by-sport breakdown
 * - Animated progress bars
 * - Real-time updates
 */

interface PerformanceCardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const PerformanceCard: React.FC<PerformanceCardProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 300000, // 5 minutes
}) => {
  const [alpha, setAlpha] = useState<WeeklyAlpha | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlpha = async () => {
    try {
      const response = await fetch('/api/homepage/weekly-alpha');

      if (!response.ok) {
        throw new Error(`Failed to fetch weekly alpha: ${response.statusText}`);
      }

      const data: WeeklyAlphaResponse = await response.json();
      setAlpha(data.alpha);
      setError(null);
    } catch (err) {
      console.error('[PerformanceCard] Error fetching alpha:', err);
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAlpha();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchAlpha, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  if (loading) {
    return (
      <div className={`relative bg-zinc-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !alpha) {
    return (
      <div className={`relative bg-zinc-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[300px]">
          <p className="text-sm text-gray-400 text-center">
            {error || 'No performance data available'}
          </p>
        </div>
      </div>
    );
  }

  const lastUpdated = new Date(alpha.lastUpdated);
  const minutesAgo = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);

  return (
    <div className={`relative bg-zinc-900/40 border border-white/10 backdrop-blur-xl rounded-3xl p-8 transform hover:rotate-y-0 transition-transform duration-700 ease-out shadow-2xl ${className}`}>
      {/* Decorative Blur */}
      <div className="absolute inset-0 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide italic">
              Weekly Alpha
            </h3>
            <p className="text-xs text-gray-400 font-mono">MODEL PERFORMANCE</p>
          </div>
          <div
            className={`px-3 py-1 rounded-lg ${
              alpha.totalUnits >= 0
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            } text-sm font-black font-mono`}
          >
            {alpha.totalUnits >= 0 ? '+' : ''}
            {alpha.totalUnits.toFixed(1)}u
          </div>
        </div>

        {/* Sport Performance Breakdown */}
        <div className="space-y-4 mb-8">
          {alpha.sports.map((sport, i) => (
            <div key={sport.name} className="group/item">
              <div className="flex justify-between text-xs font-bold text-gray-300 mb-2">
                <span className="flex items-center gap-2">
                  {sport.name}
                  <span className="text-[10px] text-gray-500 font-normal">
                    ({sport.wins}-{sport.losses})
                  </span>
                </span>
                <span className="text-white">{sport.roi}% ROI</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${sport.color} relative transition-all duration-1000 ease-out`}
                  style={{ width: `${sport.roi}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 w-full translate-x-[-100%] group-hover/item:translate-x-[100%] transition-transform duration-1000" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-white/5 flex justify-between items-center text-xs">
          <span className="text-gray-500">
            Last Update: {minutesAgo < 1 ? 'Just now' : `${minutesAgo}m ago`}
          </span>
          <button
            onClick={fetchAlpha}
            className="text-sky-400 font-bold cursor-pointer hover:underline hover:text-sky-300 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};
