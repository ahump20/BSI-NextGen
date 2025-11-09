'use client';

import { useState, useEffect } from 'react';

interface Stat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: string;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stat[]>([
    {
      label: 'Total Page Views',
      value: '0',
      change: '+12.5%',
      trend: 'up',
      icon: '📊',
    },
    {
      label: 'Active Users',
      value: '0',
      change: '+8.2%',
      trend: 'up',
      icon: '👥',
    },
    {
      label: 'API Requests (24h)',
      value: '0',
      change: '-3.1%',
      trend: 'down',
      icon: '🔌',
    },
    {
      label: 'Avg Response Time',
      value: '0ms',
      trend: 'neutral',
      icon: '⚡',
    },
  ]);

  useEffect(() => {
    // Simulate fetching real stats
    const fetchStats = async () => {
      // In production, these would come from actual analytics
      const mockStats: Stat[] = [
        {
          label: 'Total Page Views',
          value: '47,392',
          change: '+12.5%',
          trend: 'up',
          icon: '📊',
        },
        {
          label: 'Active Users',
          value: '1,284',
          change: '+8.2%',
          trend: 'up',
          icon: '👥',
        },
        {
          label: 'API Requests (24h)',
          value: '23,847',
          change: '-3.1%',
          trend: 'down',
          icon: '🔌',
        },
        {
          label: 'Avg Response Time',
          value: '124ms',
          trend: 'neutral',
          icon: '⚡',
        },
      ];

      setStats(mockStats);
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, []);

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              {stat.change && (
                <p className={`text-sm mt-2 flex items-center gap-1 ${getTrendColor(stat.trend)}`}>
                  <span>{getTrendIcon(stat.trend)}</span>
                  <span>{stat.change}</span>
                </p>
              )}
            </div>
            <span className="text-3xl">{stat.icon}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
