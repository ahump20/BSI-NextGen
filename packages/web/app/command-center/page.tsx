'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type LiveScore = {
  sport: string;
  league: string;
  gameId: string;
  homeTeam: {
    name: string;
    abbreviation: string;
    logo?: string;
  };
  awayTeam: {
    name: string;
    abbreviation: string;
    logo?: string;
  };
  homeScore: number;
  awayScore: number;
  status: string;
  period?: string;
  startTime: string;
  venue?: string;
  detailLink: string;
};

type LiveScoresResponse = {
  success: boolean;
  games: LiveScore[];
  timestamp: string;
  sources: {
    [key: string]: {
      success: boolean;
      count: number;
      error?: string;
    };
  };
};

export default function CommandCenterPage() {
  const [data, setData] = useState<LiveScoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchLiveScores();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLiveScores();
    }, 30000);

    return () => clearInterval(interval);
  }, [sportFilter, statusFilter]);

  const fetchLiveScores = async () => {
    try {
      setLoading(true);
      let url = '/api/sports/live-scores';
      const params = new URLSearchParams();

      if (sportFilter !== 'all') {
        params.append('sport', sportFilter);
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch live scores');
      }

      const result = await response.json();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('[Command Center] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('live') || normalizedStatus === 'in') {
      return 'bg-red-500 animate-pulse';
    }
    if (normalizedStatus.includes('final') || normalizedStatus === 'post') {
      return 'bg-gray-500';
    }
    return 'bg-blue-500';
  };

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      MLB: 'from-red-600 to-orange-600',
      NFL: 'from-green-700 to-emerald-600',
      NBA: 'from-orange-600 to-red-600',
      'NCAA Football': 'from-orange-700 to-orange-800',
      'NCAA Basketball': 'from-blue-700 to-blue-800',
      'College Baseball': 'from-blue-600 to-indigo-600',
    };
    return colors[sport] || 'from-gray-600 to-gray-700';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  };

  const totalGames = data?.games.length || 0;
  const liveGames = data?.games.filter(
    (g) => g.status.toLowerCase().includes('live') || g.status === 'in'
  ).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gray-900 bg-opacity-90 shadow-lg border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-gray-400 hover:text-white mb-2 inline-block transition-colors text-sm"
              >
                ← Back to Home
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                Command Center
                {liveGames > 0 && (
                  <span className="ml-3 px-3 py-1 bg-red-600 text-white text-sm font-bold rounded-full animate-pulse">
                    {liveGames} LIVE
                  </span>
                )}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Multi-sport live scoreboard • Updates every 30s
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Last update</div>
              <div className="text-sm text-white font-mono">
                {lastUpdate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  timeZone: 'America/Chicago',
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-gray-800 bg-opacity-50 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Sport Filter */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                Sport
              </label>
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sports</option>
                <option value="mlb">MLB</option>
                <option value="nfl">NFL</option>
                <option value="nba">NBA</option>
                <option value="ncaa-football">NCAA Football</option>
                <option value="ncaa-basketball">NCAA Basketball</option>
                <option value="college-baseball">College Baseball</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Games</option>
                <option value="live">Live Only</option>
                <option value="scheduled">Scheduled</option>
                <option value="final">Final</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase">
                Stats
              </label>
              <div className="flex gap-4 items-center h-10">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{totalGames}</div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{liveGames}</div>
                  <div className="text-xs text-gray-400">Live</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading && !data && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading live scores...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-6 mb-6">
            <h3 className="text-red-400 font-bold mb-2">Error Loading Scores</h3>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchLiveScores}
              className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {data && data.games.length === 0 && (
          <div className="bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h3 className="text-xl font-bold text-white mb-2">No Games Found</h3>
            <p className="text-gray-400">
              There are no games matching your filters. Try adjusting the sport or status filters.
            </p>
          </div>
        )}

        {/* Games Grid */}
        {data && data.games.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.games.map((game) => (
              <Link
                key={`${game.sport}-${game.gameId}`}
                href={game.detailLink}
                className="bg-gray-800 bg-opacity-70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border border-gray-700 hover:border-blue-500"
              >
                {/* Sport Header */}
                <div
                  className={`bg-gradient-to-r ${getSportColor(game.sport)} px-4 py-3 flex items-center justify-between`}
                >
                  <div>
                    <div className="text-white font-bold text-sm">{game.sport}</div>
                    <div className="text-white text-xs opacity-80">{game.league}</div>
                  </div>
                  <span
                    className={`px-3 py-1 ${getStatusBadgeColor(game.status)} text-white text-xs font-bold rounded-full`}
                  >
                    {game.status.toUpperCase()}
                  </span>
                </div>

                {/* Game Info */}
                <div className="p-4">
                  {/* Away Team */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
                    <div className="flex items-center gap-3 flex-1">
                      {game.awayTeam.logo && (
                        <img
                          src={game.awayTeam.logo}
                          alt={game.awayTeam.name}
                          className="w-10 h-10 object-contain"
                        />
                      )}
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {game.awayTeam.name}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {game.awayTeam.abbreviation}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{game.awayScore}</div>
                  </div>

                  {/* Home Team */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {game.homeTeam.logo && (
                        <img
                          src={game.homeTeam.logo}
                          alt={game.homeTeam.name}
                          className="w-10 h-10 object-contain"
                        />
                      )}
                      <div>
                        <div className="text-white font-semibold text-sm">
                          {game.homeTeam.name}
                        </div>
                        <div className="text-gray-400 text-xs">
                          {game.homeTeam.abbreviation}
                        </div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-white">{game.homeScore}</div>
                  </div>

                  {/* Game Details */}
                  <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                    <div>
                      {game.period && <span>{game.period}</span>}
                      {!game.period && <span>{formatTime(game.startTime)}</span>}
                    </div>
                    {game.venue && (
                      <div className="truncate ml-2" title={game.venue}>
                        📍 {game.venue}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Data Sources Footer */}
        {data && (
          <div className="mt-8 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-white font-bold mb-4">Data Sources</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(data.sources).map(([source, info]) => (
                <div
                  key={source}
                  className={`p-3 rounded-lg ${
                    info.success ? 'bg-green-900 bg-opacity-30' : 'bg-red-900 bg-opacity-30'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    {source}
                  </div>
                  <div className="text-lg font-bold text-white">{info.count}</div>
                  <div
                    className={`text-xs ${info.success ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {info.success ? '✓ Active' : '✗ Error'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
