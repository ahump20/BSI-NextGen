'use client';

import { useState, useEffect } from 'react';

interface Team {
  id: string;
  name: string;
  abbreviation: string;
  city: string;
  logo?: string;
}

interface Game {
  id: string;
  sport: string;
  date: string;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  venue?: string;
}

interface Standing {
  team: Team;
  wins: number;
  losses: number;
  winPercentage: number;
  gamesBack?: number;
  streak?: string;
}

interface SearchResult {
  sport: string;
  type: string;
  id: string;
  name: string;
  relevanceScore: number;
  metadata: {
    abbreviation?: string;
    city?: string;
    logo?: string;
  };
}

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState<'games' | 'live' | 'standings' | 'search'>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [liveGames, setLiveGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'games') {
      fetchGames();
    } else if (activeTab === 'live') {
      fetchLiveGames();
    } else if (activeTab === 'standings') {
      fetchStandings();
    }
  }, [activeTab]);

  const fetchGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/unified/games');
      const data = await response.json();
      setGames(data.games || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveGames = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/unified/live');
      const data = await response.json();
      setLiveGames(data.games || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch live games');
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/unified/standings');
      const data = await response.json();
      setStandings(data.standings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/unified/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-500 text-white';
      case 'final':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Blaze Sports Intel
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Multi-League Sports Dashboard
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('games')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'games'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              All Games
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'live'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Live Games
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'standings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Standings
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Search
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search teams across all leagues..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((result) => (
                  <div
                    key={`${result.sport}-${result.id}`}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {result.sport}
                      </span>
                      <span className="text-xs text-gray-400">
                        {Math.round(result.relevanceScore * 100)}% match
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    {result.metadata.city && (
                      <p className="text-sm text-gray-600 mt-1">
                        {result.metadata.city}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No results found</p>
              </div>
            ) : null}
          </div>
        )}

        {/* All Games Tab */}
        {activeTab === 'games' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading games...</p>
              </div>
            ) : games.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {game.sport}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${getStatusColor(
                          game.status
                        )}`}
                      >
                        {game.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {game.awayTeam.name}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 ml-2">
                          {game.awayScore}
                        </p>
                      </div>

                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {game.homeTeam.name}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900 ml-2">
                          {game.homeScore}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {formatDate(game.date)}
                      </p>
                      {game.venue && (
                        <p className="text-xs text-gray-500 mt-1">{game.venue}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No games found</p>
              </div>
            )}
          </div>
        )}

        {/* Live Games Tab */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading live games...</p>
              </div>
            ) : liveGames.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {liveGames.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 border-l-4 border-red-500"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase">
                        {game.sport}
                      </span>
                      <span className="flex items-center text-xs text-red-600 font-semibold">
                        <span className="w-2 h-2 bg-red-600 rounded-full mr-1 animate-pulse"></span>
                        LIVE
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {game.awayTeam.name}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {game.awayScore}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {game.homeTeam.name}
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          {game.homeScore}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-600">No live games at the moment</p>
              </div>
            )}
          </div>
        )}

        {/* Standings Tab */}
        {activeTab === 'standings' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading standings...</p>
              </div>
            ) : standings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        W
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        L
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PCT
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GB
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        STRK
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {standings.map((standing, index) => (
                      <tr
                        key={`${standing.team.id}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {standing.team.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                          {standing.wins}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                          {standing.losses}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-900">
                          {standing.winPercentage.toFixed(3)}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-500">
                          {standing.gamesBack || '-'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-sm text-gray-500">
                          {standing.streak || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No standings available</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Data from MLB Stats API, ESPN API, and SportsDataIO
          </p>
          <p className="text-center text-xs text-gray-400 mt-1">
            Timezone: America/Chicago
          </p>
        </div>
      </footer>
    </div>
  );
}
