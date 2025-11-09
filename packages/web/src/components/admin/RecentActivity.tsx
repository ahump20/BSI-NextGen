'use client';

import { useState, useEffect } from 'react';

interface Activity {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  details?: string;
}

export function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'success',
      message: 'College Baseball API data refreshed successfully',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      details: '47 games updated',
    },
    {
      id: '2',
      type: 'info',
      message: 'User accessed MLB scoreboard',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      type: 'success',
      message: 'Cache cleared for /api/sports/college-baseball/games',
      timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      type: 'warning',
      message: 'Slow response time detected on ESPN API',
      timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      details: 'Response time: 2.3s (threshold: 2.0s)',
    },
    {
      id: '5',
      type: 'success',
      message: 'Database backup completed',
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      details: 'Size: 234 MB',
    },
    {
      id: '6',
      type: 'info',
      message: 'New command palette search performed',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      details: 'Query: "college baseball rankings"',
    },
  ]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>📜</span>
          <span>Recent Activity</span>
        </h2>
        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{getActivityIcon(activity.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${getActivityColor(activity.type)}`}>
                  {activity.message}
                </p>
                {activity.details && (
                  <p className="text-sm text-gray-400 mt-1">{activity.details}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
