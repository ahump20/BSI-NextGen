'use client';

import { useState, useEffect } from 'react';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  lastChecked: string;
  uptime: string;
}

export function SiteHealthMonitor() {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([
    {
      service: 'Web Application',
      status: 'healthy',
      responseTime: 45,
      lastChecked: new Date().toISOString(),
      uptime: '99.98%',
    },
    {
      service: 'College Baseball API',
      status: 'healthy',
      responseTime: 120,
      lastChecked: new Date().toISOString(),
      uptime: '99.95%',
    },
    {
      service: 'MLB API',
      status: 'healthy',
      responseTime: 89,
      lastChecked: new Date().toISOString(),
      uptime: '99.92%',
    },
    {
      service: 'ESPN API',
      status: 'healthy',
      responseTime: 156,
      lastChecked: new Date().toISOString(),
      uptime: '99.87%',
    },
  ]);

  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);

    try {
      // Simulate health checks
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newChecks: HealthCheck[] = [
        {
          service: 'Web Application',
          status: 'healthy',
          responseTime: Math.floor(Math.random() * 50) + 30,
          lastChecked: new Date().toISOString(),
          uptime: '99.98%',
        },
        {
          service: 'College Baseball API',
          status: Math.random() > 0.9 ? 'degraded' : 'healthy',
          responseTime: Math.floor(Math.random() * 100) + 80,
          lastChecked: new Date().toISOString(),
          uptime: '99.95%',
        },
        {
          service: 'MLB API',
          status: 'healthy',
          responseTime: Math.floor(Math.random() * 80) + 60,
          lastChecked: new Date().toISOString(),
          uptime: '99.92%',
        },
        {
          service: 'ESPN API',
          status: 'healthy',
          responseTime: Math.floor(Math.random() * 120) + 100,
          lastChecked: new Date().toISOString(),
          uptime: '99.87%',
        },
      ];

      setHealthChecks(newChecks);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Auto-refresh every 60 seconds
    const interval = setInterval(runHealthCheck, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'down':
        return 'bg-red-500';
    }
  };

  const getStatusText = (status: HealthCheck['status']) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'degraded':
        return 'Degraded';
      case 'down':
        return 'Down';
    }
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 100) return 'text-green-400';
    if (responseTime < 200) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🏥</span>
          <span>Site Health Monitor</span>
        </h2>
        <button
          onClick={runHealthCheck}
          disabled={isChecking}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {isChecking ? (
            <>
              <span className="inline-block animate-spin">⟳</span>
              <span>Checking...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Run Check</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4">
        {healthChecks.map((check, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(check.status)} animate-pulse`}></div>
                <div>
                  <h3 className="font-medium text-white">{check.service}</h3>
                  <p className="text-sm text-gray-400">
                    Last checked: {new Date(check.lastChecked).toLocaleTimeString('en-US', {
                      timeZone: 'America/Chicago',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-white">{getStatusText(check.status)}</div>
                <div className={`text-sm ${getResponseTimeColor(check.responseTime)}`}>
                  {check.responseTime}ms
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Uptime: {check.uptime}
                </div>
              </div>
            </div>

            {/* Response Time Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    check.responseTime < 100
                      ? 'bg-green-500'
                      : check.responseTime < 200
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min((check.responseTime / 300) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
