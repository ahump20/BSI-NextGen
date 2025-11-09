'use client';

import { useState } from 'react';

interface Endpoint {
  path: string;
  method: string;
  description: string;
  status: 'active' | 'slow' | 'error';
  avgResponseTime: number;
  requestCount24h: number;
  lastError?: string;
}

export function ApiEndpointStatus() {
  const [endpoints] = useState<Endpoint[]>([
    {
      path: '/api/sports/college-baseball/games',
      method: 'GET',
      description: 'College baseball games schedule',
      status: 'active',
      avgResponseTime: 127,
      requestCount24h: 3842,
    },
    {
      path: '/api/sports/college-baseball/games/[gameId]',
      method: 'GET',
      description: 'College baseball box score detail',
      status: 'active',
      avgResponseTime: 189,
      requestCount24h: 1247,
    },
    {
      path: '/api/sports/college-baseball/rankings',
      method: 'GET',
      description: 'D1Baseball Top 25 rankings',
      status: 'active',
      avgResponseTime: 156,
      requestCount24h: 892,
    },
    {
      path: '/api/sports/college-baseball/standings',
      method: 'GET',
      description: 'Conference standings',
      status: 'active',
      avgResponseTime: 143,
      requestCount24h: 1053,
    },
    {
      path: '/api/sports/mlb/games',
      method: 'GET',
      description: 'MLB games schedule',
      status: 'active',
      avgResponseTime: 98,
      requestCount24h: 5621,
    },
    {
      path: '/api/sports/mlb/standings',
      method: 'GET',
      description: 'MLB division standings',
      status: 'active',
      avgResponseTime: 112,
      requestCount24h: 2314,
    },
    {
      path: '/api/sports/nfl/games',
      method: 'GET',
      description: 'NFL games schedule',
      status: 'slow',
      avgResponseTime: 234,
      requestCount24h: 1876,
      lastError: 'Timeout warning (>200ms)',
    },
    {
      path: '/api/sports/nba/games',
      method: 'GET',
      description: 'NBA games schedule',
      status: 'active',
      avgResponseTime: 145,
      requestCount24h: 2109,
    },
  ]);

  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);

  const getStatusBadge = (status: Endpoint['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-900 text-green-300 rounded">
            Active
          </span>
        );
      case 'slow':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-900 text-yellow-300 rounded">
            Slow
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-900 text-red-300 rounded">
            Error
          </span>
        );
    }
  };

  const getMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-blue-900 text-blue-300',
      POST: 'bg-green-900 text-green-300',
      PUT: 'bg-yellow-900 text-yellow-300',
      DELETE: 'bg-red-900 text-red-300',
    };

    return (
      <span className={`px-2 py-1 text-xs font-mono font-medium rounded ${colors[method]}`}>
        {method}
      </span>
    );
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 150) return 'text-green-400';
    if (responseTime < 250) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🔌</span>
          <span>API Endpoint Status</span>
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Slow</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Error</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Endpoint</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Method</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Avg Response</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Requests (24h)</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((endpoint, index) => (
              <tr
                key={index}
                onClick={() => setSelectedEndpoint(endpoint)}
                className="border-b border-gray-800 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="font-mono text-sm text-white">{endpoint.path}</div>
                  <div className="text-xs text-gray-400 mt-1">{endpoint.description}</div>
                  {endpoint.lastError && (
                    <div className="text-xs text-red-400 mt-1">{endpoint.lastError}</div>
                  )}
                </td>
                <td className="py-3 px-4">{getMethodBadge(endpoint.method)}</td>
                <td className="py-3 px-4">{getStatusBadge(endpoint.status)}</td>
                <td className={`py-3 px-4 text-right font-mono text-sm ${getResponseTimeColor(endpoint.avgResponseTime)}`}>
                  {endpoint.avgResponseTime}ms
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-gray-300">
                  {endpoint.requestCount24h.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEndpoint && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-white">Endpoint Details</h3>
            <button
              onClick={() => setSelectedEndpoint(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Path:</span>
              <span className="ml-2 font-mono text-white">{selectedEndpoint.path}</span>
            </div>
            <div>
              <span className="text-gray-400">Method:</span>
              <span className="ml-2 text-white">{selectedEndpoint.method}</span>
            </div>
            <div>
              <span className="text-gray-400">Avg Response Time:</span>
              <span className={`ml-2 font-mono ${getResponseTimeColor(selectedEndpoint.avgResponseTime)}`}>
                {selectedEndpoint.avgResponseTime}ms
              </span>
            </div>
            <div>
              <span className="text-gray-400">24h Requests:</span>
              <span className="ml-2 font-mono text-white">
                {selectedEndpoint.requestCount24h.toLocaleString()}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Description:</span>
              <span className="ml-2 text-white">{selectedEndpoint.description}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
