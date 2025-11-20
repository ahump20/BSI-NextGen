'use client';

import { useEffect, useState } from 'react';

interface DatabaseMetric {
  id: number;
  database_name: string;
  total_tables: number;
  total_rows: number;
  database_size_kb: number;
  growth_rate_mb_per_day: number;
  avg_query_time_ms: number;
  error_count: number;
  timestamp: string;
}

interface Alert {
  id: number;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  database_name: string;
  value: number;
  threshold: number;
  timestamp: string;
}

export default function MonitorPage() {
  const [metrics, setMetrics] = useState<DatabaseMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const MONITOR_URL = process.env.NEXT_PUBLIC_MONITOR_URL || 'http://localhost:8787';

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metricsRes, alertsRes] = await Promise.all([
        fetch(`${MONITOR_URL}/metrics?limit=5`),
        fetch(`${MONITOR_URL}/alerts?limit=10`)
      ]);

      if (!metricsRes.ok || !alertsRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const metricsData = await metricsRes.json();
      const alertsData = await alertsRes.json();

      setMetrics(metricsData);
      setAlerts(alertsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (kb: number): string => {
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(2)} MB`;
    return `${(kb / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && metrics.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading monitoring data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Database Monitoring</h1>
              <p className="text-gray-600 mt-1">Real-time database performance metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Active Alerts</h2>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'critical'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-600">{alert.type}</span>
                      </div>
                      <p className="mt-2 font-medium text-gray-900">{alert.message}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Database: {alert.database_name}</p>
                        <p>
                          Value: {alert.value.toFixed(2)} (Threshold: {alert.threshold})
                        </p>
                        <p>{formatDate(alert.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Database Metrics */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Metrics</h2>

          {metrics.length === 0 ? (
            <p className="text-gray-600">No metrics available</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {metric.database_name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatDate(metric.timestamp)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Size</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {formatSize(metric.database_size_kb)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Growth Rate</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {metric.growth_rate_mb_per_day.toFixed(2)} MB/day
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Avg Query Time</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {metric.avg_query_time_ms.toFixed(2)} ms
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-600">Errors</p>
                      <p
                        className={`text-2xl font-semibold ${
                          metric.error_count > 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {metric.error_count}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-6 text-sm text-gray-600">
                      <span>Tables: {metric.total_tables}</span>
                      <span>Rows: {metric.total_rows.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            About Database Monitoring
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              • Metrics are collected every 5 minutes automatically
            </p>
            <p>
              • Alerts are triggered when thresholds are exceeded
            </p>
            <p>
              • Historical data is retained for 30 days
            </p>
            <p>
              • Auto-refresh updates data every 30 seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
