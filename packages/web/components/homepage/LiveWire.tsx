'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import type { LiveAlert, AlertsResponse } from '@bsi/shared';

/**
 * LiveWire Component
 *
 * Displays real-time alerts and notifications
 * Features:
 * - Auto-refreshing feed
 * - Priority-based sorting
 * - Color-coded alert types
 * - Smooth animations
 */

interface LiveWireProps {
  maxAlerts?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  className?: string;
}

export const LiveWire: React.FC<LiveWireProps> = ({
  maxAlerts = 10,
  autoRefresh = true,
  refreshInterval = 60000, // 1 minute
  className = '',
}) => {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(`/api/homepage/alerts?limit=${maxAlerts}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data: AlertsResponse = await response.json();
      setAlerts(data.alerts);
      setError(null);
    } catch (err) {
      console.error('[LiveWire] Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAlerts();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, maxAlerts]);

  if (loading) {
    return (
      <div className={`rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md flex flex-col overflow-hidden min-h-[400px] ${className}`}>
        <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <span className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Live Wire
          </span>
          <span className="text-[9px] bg-zinc-700/50 text-gray-400 px-2 py-0.5 rounded border border-white/10 font-mono">
            LOADING
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md flex flex-col overflow-hidden min-h-[400px] ${className}`}>
        <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
          <span className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
            <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Live Wire
          </span>
          <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-mono">
            ERROR
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-gray-400 text-center">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md flex flex-col overflow-hidden min-h-[400px] ${className}`}>
      <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
        <span className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
          <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" /> Live Wire
        </span>
        <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/20 animate-pulse font-mono">
          LIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500 italic">No alerts available</p>
          </div>
        ) : (
          <>
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
            {/* Scanning Placeholder */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/5 flex items-center justify-center min-h-[60px]">
              <span className="text-[10px] text-gray-600 italic animate-pulse">
                Scanning for signals...
              </span>
            </div>
          </>
        )}
      </div>

      <Link
        href="/trends"
        className="p-3 text-center text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 uppercase tracking-widest"
      >
        View All Trends
      </Link>
    </div>
  );
};

/**
 * Individual Alert Card Component
 */
const AlertCard: React.FC<{ alert: LiveAlert }> = ({ alert }) => {
  const cardClassName = `p-4 rounded-xl bg-zinc-900 border ${
    alert.border || 'border-white/5'
  } hover:border-white/20 transition-colors cursor-pointer group shadow-lg block`;

  const cardContent = (
    <>
      <div className="flex justify-between mb-2">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 ${
            alert.color
          } tracking-wide`}
        >
          {alert.type}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">{alert.time} ago</span>
      </div>
      <p className="text-xs text-gray-300 font-medium leading-relaxed group-hover:text-white transition-colors">
        {alert.msg}
      </p>
    </>
  );

  if (alert.url) {
    return (
      <Link href={alert.url} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClassName}>
      {cardContent}
    </div>
  );
};

// Custom scrollbar styles (add to global CSS if not already present)
const scrollbarStyles = `
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
`;

// Export styles for use in global CSS
export const liveWireStyles = scrollbarStyles;
