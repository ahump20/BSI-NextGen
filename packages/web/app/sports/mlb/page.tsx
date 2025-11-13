'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import type { Game, Standing } from '@bsi/shared';
import { Avatar } from '@/components/Avatar';

interface ApiResponse<T> {
  data: T;
  source: {
    provider: string;
    timestamp: string;
    confidence: number;
  };
}

export default function MLBPage() {
  const { authenticated, user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  useEffect(() => {
    async function fetchMLBData() {
      try {
        setLoading(true);
        setError(null);

        const [gamesRes, standingsRes] = await Promise.all([
          fetch('/api/sports/mlb/games'),
          fetch('/api/sports/mlb/standings'),
        ]);

        if (!gamesRes.ok || !standingsRes.ok) {
          throw new Error('Failed to fetch MLB data');
        }

        const gamesData: ApiResponse<Game[]> = await gamesRes.json();
        const standingsData: ApiResponse<Standing[]> = await standingsRes.json();

        setGames(gamesData.data);
        setStandings(standingsData.data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching MLB data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load MLB data');
      } finally {
        setLoading(false);
      }
    }

    fetchMLBData();

    // Refresh every 30 seconds for live games
    const interval = setInterval(fetchMLBData, 30000);
    return () => clearInterval(interval);
  }, []);

  const divisions = {
    all: 'All Divisions',
    'AL East': 'AL East',
    'AL Central': 'AL Central',
    'AL West': 'AL West',
    'NL East': 'NL East',
    'NL Central': 'NL Central',
    'NL West': 'NL West',
  };

  const filteredStandings = selectedDivision === 'all'
    ? standings
    : standings.filter(s => s.team.division === selectedDivision);

  const groupedStandings = filteredStandings.reduce((acc, standing) => {
    const division = standing.team.division || 'Unknown';
    if (!acc[division]) {
      acc[division] = [];
    }
    acc[division].push(standing);
    return acc;
  }, {} as Record<string, Standing[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                Blaze Sports Intel
              </Link>
              <span className="text-gray-400">•</span>
              <h1 className="text-xl font-semibold text-gray-800">MLB</h1>
            </div>

            {!authLoading && (
              <>
                {authenticated && user ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                  >
                    <Avatar
                      src={user.picture}
                      name={user.name || user.email}
                      size="sm"
                    />
                    <span className="hidden sm:inline">{user.name || user.email}</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Badge */}
        <div className="mb-6 flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Live Data from MLB Stats API
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading MLB Data</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Today's Games */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Today&apos;s Games
              </h2>

              {games.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">No games scheduled today</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {games.map(game => (
                    <div
                      key={game.id}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                    >
                      {/* Game Status */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            game.status === 'live'
                              ? 'bg-red-100 text-red-800'
                              : game.status === 'final'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {game.status === 'live' ? 'LIVE' : game.status === 'final' ? 'FINAL' : 'SCHEDULED'}
                        </span>
                        {game.period && (
                          <span className="text-sm text-gray-600">{game.period}</span>
                        )}
                      </div>

                      {/* Teams and Scores */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {game.awayTeam.abbreviation}
                            </span>
                          </div>
                          <span className="text-xl font-bold text-gray-800">
                            {game.awayScore}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {game.homeTeam.abbreviation}
                            </span>
                          </div>
                          <span className="text-xl font-bold text-gray-800">
                            {game.homeScore}
                          </span>
                        </div>
                      </div>

                      {/* Venue */}
                      {game.venue && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-gray-500">{game.venue}</p>
                        </div>
                      )}

                      {/* Broadcasters */}
                      {game.broadcasters && game.broadcasters.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            {game.broadcasters.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Standings */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Standings</h2>

                {/* Division Filter */}
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(divisions).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-8">
                {Object.entries(groupedStandings).map(([division, divisionStandings]) => (
                  <div key={division} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3">
                      <h3 className="text-white font-semibold">{division}</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Team
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              W
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              L
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              PCT
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              GB
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              STRK
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              L10
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {divisionStandings.map(standing => (
                            <tr key={standing.team.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800">
                                    {standing.team.abbreviation}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {standing.team.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800">
                                {standing.wins}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800">
                                {standing.losses}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800">
                                {standing.winPercentage.toFixed(3)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                {standing.gamesBack === 0 ? '-' : standing.gamesBack?.toFixed(1) || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800">
                                {standing.streak || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800">
                                {standing.lastTen || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Data from <span className="font-semibold">MLB Stats API</span>
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © 2025 Blaze Sports Intel • America/Chicago Timezone
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
