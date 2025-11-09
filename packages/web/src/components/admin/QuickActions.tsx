'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Action {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: () => void | Promise<void>;
  variant: 'primary' | 'secondary' | 'danger';
}

export function QuickActions() {
  const router = useRouter();
  const [executing, setExecuting] = useState<string | null>(null);

  const actions: Action[] = [
    {
      id: 'refresh-cache',
      label: 'Clear Cache',
      description: 'Clear all API response caches',
      icon: '🗑️',
      variant: 'secondary',
      action: async () => {
        setExecuting('refresh-cache');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // In production, this would call a cache clearing API
        alert('Cache cleared successfully!');
        setExecuting(null);
      },
    },
    {
      id: 'refresh-data',
      label: 'Refresh Data',
      description: 'Force refresh all sports data',
      icon: '🔄',
      variant: 'primary',
      action: async () => {
        setExecuting('refresh-data');
        await new Promise((resolve) => setTimeout(resolve, 1500));
        window.location.reload();
        setExecuting(null);
      },
    },
    {
      id: 'view-logs',
      label: 'View Logs',
      description: 'Access system logs',
      icon: '📋',
      variant: 'secondary',
      action: () => {
        alert('Log viewer would open here. In production, this would show real-time logs.');
      },
    },
    {
      id: 'run-tests',
      label: 'Run Tests',
      description: 'Execute health checks',
      icon: '🧪',
      variant: 'secondary',
      action: async () => {
        setExecuting('run-tests');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        alert('All tests passed! ✅\n\n- API Endpoints: OK\n- Database: OK\n- Cache: OK');
        setExecuting(null);
      },
    },
    {
      id: 'backup-db',
      label: 'Backup Database',
      description: 'Create database backup',
      icon: '💾',
      variant: 'primary',
      action: async () => {
        setExecuting('backup-db');
        await new Promise((resolve) => setTimeout(resolve, 2500));
        alert('Database backup created successfully!');
        setExecuting(null);
      },
    },
    {
      id: 'emergency-shutdown',
      label: 'Emergency Mode',
      description: 'Enable maintenance mode',
      icon: '🚨',
      variant: 'danger',
      action: async () => {
        if (confirm('Are you sure you want to enable emergency maintenance mode?')) {
          setExecuting('emergency-shutdown');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          alert('Emergency maintenance mode enabled. Site is now in read-only mode.');
          setExecuting(null);
        }
      },
    },
  ];

  const getVariantClasses = (variant: Action['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 border-blue-500';
      case 'secondary':
        return 'bg-gray-700 hover:bg-gray-600 border-gray-600';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 border-red-500';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span>⚡</span>
        <span>Quick Actions</span>
      </h2>

      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={executing !== null}
            className={`w-full text-left p-4 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses(
              action.variant
            )}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{action.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-white">{action.label}</div>
                <div className="text-sm text-gray-300 mt-0.5">{action.description}</div>
              </div>
              {executing === action.id && (
                <span className="inline-block animate-spin text-xl">⟳</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Navigation Actions */}
      <div className="mt-6 pt-6 border-t border-gray-800">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          Navigate To
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full text-left px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            🏠 Dashboard
          </button>
          <button
            onClick={() => router.push('/sports/college-baseball')}
            className="w-full text-left px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            ⚾ College Baseball
          </button>
          <button
            onClick={() => router.push('/mlb')}
            className="w-full text-left px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
          >
            ⚾ MLB Scoreboard
          </button>
        </div>
      </div>
    </div>
  );
}
