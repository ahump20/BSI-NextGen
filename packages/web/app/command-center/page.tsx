'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Command Center - Multi-Sport Live Dashboard
 *
 * 24/7 unified scoreboard aggregating all 7 sports:
 * - MLB, NFL, NBA
 * - NCAA Football, NCAA Basketball, College Baseball
 * - Youth Sports (Texas HS + Perfect Game)
 *
 * Auto-refreshes every 30 seconds for live games
 */

interface GameSummary {
  id: string;
  sport: string;
  homeTeam: {
    name: string;
    abbreviation?: string;
    score: number | null;
    logo?: string;
  };
  awayTeam: {
    name: string;
    abbreviation?: string;
    score: number | null;
    logo?: string;
  };
  status: {
    state: 'pre' | 'live' | 'final' | 'postponed';
    detail: string;
    period?: string;
    clock?: string;
  };
  startTime: string;
  venue?: string;
  broadcast?: string;
}

interface SportData {
  games: GameSummary[];
  lastUpdated: string;
  dataSource: string;
}

interface CommandCenterData {
  sports: {
    [key: string]: SportData;
  };
  meta: {
    date: string;
    timezone: string;
    totalGames: number;
    liveGames: number;
    requestedSports: string[];
    lastUpdated: string;
  };
}

const SPORT_LABELS: { [key: string]: { name: string; color: string; icon: string } } = {
  mlb: { name: 'MLB', color: 'red', icon: '⚾' },
  nfl: { name: 'NFL', color: 'green', icon: '🏈' },
  nba: { name: 'NBA', color: 'orange', icon: '🏀' },
  ncaa_football: { name: 'NCAA Football', color: 'orange', icon: '🏈' },
  ncaa_basketball: { name: 'NCAA Basketball', color: 'blue', icon: '🏀' },
  college_baseball: { name: 'College Baseball', color: 'blue', icon: '⚾' },
  youth_sports: { name: 'Youth Sports', color: 'amber', icon: '🎯' },
};

export default function CommandCenter() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSports, setSelectedSports] = useState<string[]>([
    'mlb',
    'nfl',
    'nba',
    'ncaa_football',
    'ncaa_basketball',
    'college_baseball',
  ]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch data from Command Center API
  const fetchData = async () => {
    try {
      const sportsParam = selectedSports.join(',');
      const response = await fetch(`/api/sports/command-center?sports=${sportsParam}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('[CommandCenter] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [selectedSports]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedSports]);

  // Toggle sport filter
  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  };

  // Get status badge color
  const getStatusColor = (state: string) => {
    switch (state) {
      case 'live':
        return 'bg-red-500 text-white';
      case 'final':
        return 'bg-gray-500 text-white';
      case 'postponed':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-blue-600">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Command Center
                  </h1>
                  <p className="text-sm text-gray-600">
                    Live Multi-Sport Dashboard
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Live indicator */}
              {data && data.meta.liveGames > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 rounded-lg">
                  <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-red-800">
                    {data.meta.liveGames} LIVE
                  </span>
                </div>
              )}

              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  autoRefresh
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {autoRefresh ? '🔄 Auto' : '⏸️ Paused'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sport Filters */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(SPORT_LABELS).map(([sport, config]) => (
              <button
                key={sport}
                onClick={() => toggleSport(sport)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  selectedSports.includes(sport)
                    ? `bg-${config.color}-500 text-white shadow-lg`
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {config.icon} {config.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-800 font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">Loading live scores...</p>
            </div>
          </div>
        )}

        {/* Data Display */}
        {data && (
          <div className="space-y-8">
            {/* Metadata */}
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Games</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {data.meta.totalGames}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Live Now</p>
                  <p className="text-2xl font-bold text-red-600">
                    {data.meta.liveGames}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(data.meta.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatTime(data.meta.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>

            {/* Sports Sections */}
            {Object.entries(data.sports).map(([sport, sportData]) => {
              const config = SPORT_LABELS[sport];
              if (!config) return null;

              return (
                <div key={sport} className="space-y-4">
                  {/* Sport Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {config.icon} {config.name}
                    </h2>
                    <span className="text-sm text-gray-600">
                      {sportData.games.length} games
                    </span>
                  </div>

                  {/* Games Grid */}
                  {sportData.games.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {sportData.games.map((game) => (
                        <div
                          key={game.id}
                          className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-all p-6 ${
                            game.status.state === 'live'
                              ? 'border-l-4 border-red-500'
                              : ''
                          }`}
                        >
                          {/* Status Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${getStatusColor(
                                game.status.state
                              )}`}
                            >
                              {game.status.state === 'live' && (
                                <span className="inline-block w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
                              )}
                              {game.status.detail}
                            </span>
                            {game.status.period && (
                              <span className="text-xs font-semibold text-gray-600">
                                {game.status.period}
                              </span>
                            )}
                          </div>

                          {/* Teams */}
                          <div className="space-y-3">
                            {/* Away Team */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                {game.awayTeam.logo && (
                                  <img
                                    src={game.awayTeam.logo}
                                    alt={game.awayTeam.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {game.awayTeam.abbreviation || game.awayTeam.name}
                                  </p>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 ml-3">
                                {game.awayTeam.score ?? '-'}
                              </p>
                            </div>

                            {/* Home Team */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1">
                                {game.homeTeam.logo && (
                                  <img
                                    src={game.homeTeam.logo}
                                    alt={game.homeTeam.name}
                                    className="w-8 h-8 object-contain"
                                  />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">
                                    {game.homeTeam.abbreviation || game.homeTeam.name}
                                  </p>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 ml-3">
                                {game.homeTeam.score ?? '-'}
                              </p>
                            </div>
                          </div>

                          {/* Game Info */}
                          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                            {game.status.state === 'pre' && (
                              <p className="text-xs text-gray-600">
                                🕒 {formatTime(game.startTime)}
                              </p>
                            )}
                            {game.venue && (
                              <p className="text-xs text-gray-600">📍 {game.venue}</p>
                            )}
                            {game.broadcast && (
                              <p className="text-xs text-gray-600">
                                📺 {game.broadcast}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow p-8 text-center">
                      <p className="text-gray-600">No games scheduled</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            Data from ESPN, MLB Stats API, and official league sources
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Timezone: {data?.meta.timezone || 'America/Chicago'} • Auto-refresh:{' '}
            {autoRefresh ? '30s' : 'Paused'}
          </p>
        </div>
      </footer>
    </div>
  );
}
