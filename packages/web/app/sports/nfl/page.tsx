'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import type { Game, Standing } from '@bsi/shared';

interface ApiResponse<T> {
  data: T;
  source: {
    provider: string;
    timestamp: string;
    confidence: number;
  };
}

export default function NFLPage() {
  const { authenticated, user, loading: authLoading } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  useEffect(() => {
    async function fetchNFLData() {
      try {
        setLoading(true);
        setError(null);

        const currentYear = new Date().getFullYear();
        const [gamesRes, standingsRes] = await Promise.all([
          fetch(`/api/sports/nfl/games?season=${currentYear}&week=${selectedWeek}`),
          fetch(`/api/sports/nfl/standings?season=${currentYear}`),
        ]);

        if (!gamesRes.ok || !standingsRes.ok) {
          throw new Error('Failed to fetch NFL data');
        }

        const gamesData: ApiResponse<Game[]> = await gamesRes.json();
        const standingsData: ApiResponse<Standing[]> = await standingsRes.json();

        setGames(gamesData.data);
        setStandings(standingsData.data);
      } catch (err) {
        console.error('Error fetching NFL data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load NFL data');
      } finally {
        setLoading(false);
      }
    }

    fetchNFLData();

    // Refresh every 30 seconds for live games
    const interval = setInterval(fetchNFLData, 30000);
    return () => clearInterval(interval);
  }, [selectedWeek]);

  const conferences = {
    all: 'All Conferences',
    AFC: 'AFC',
    NFC: 'NFC',
  };

  const filteredStandings = selectedConference === 'all'
    ? standings
    : standings.filter(s => s.team.conference === selectedConference);

  const groupedStandings = filteredStandings.reduce((acc, standing) => {
    const division = standing.team.division || 'Unknown';
    if (!acc[division]) {
      acc[division] = [];
    }
    acc[division].push(standing);
    return acc;
  }, {} as Record<string, Standing[]>);

  // Sort divisions by conference
  const sortedDivisions = Object.keys(groupedStandings).sort((a, b) => {
    const order = ['AFC East', 'AFC North', 'AFC South', 'AFC West', 'NFC East', 'NFC North', 'NFC South', 'NFC West'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent hover:from-red-700 hover:to-blue-700 transition-all"
              >
                Blaze Sports Intel
              </Link>
              <span className="text-gray-400">•</span>
              <h1 className="text-xl font-semibold text-gray-800">NFL</h1>
            </div>

            {!authLoading && (
              <>
                {authenticated && user ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-lg hover:from-red-700 hover:to-blue-700 transition-all"
                  >
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-white text-red-600 flex items-center justify-center text-sm font-bold">
                        {(user.name || user.email)[0]}
                      </div>
                    )}
                    <span className="hidden sm:inline">{user.name || user.email}</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-blue-600 text-white rounded-lg hover:from-red-700 hover:to-blue-700 transition-all font-medium"
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            Live Data from SportsDataIO
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading NFL Data</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Week Selector and Games */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Games</h2>

                {/* Week Selector */}
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {Array.from({ length: 18 }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>

              {games.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <p className="text-gray-600">No games scheduled for Week {selectedWeek}</p>
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
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Standings */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Standings</h2>

                {/* Conference Filter */}
                <select
                  value={selectedConference}
                  onChange={(e) => setSelectedConference(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {Object.entries(conferences).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-8">
                {sortedDivisions.map(division => (
                  <div key={division} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className={`px-6 py-3 ${
                      division.startsWith('AFC')
                        ? 'bg-gradient-to-r from-red-600 to-red-700'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700'
                    }`}>
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
                              STRK
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {groupedStandings[division]?.map(standing => (
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
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-800">
                                {standing.streak || '-'}
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
              Data from <span className="font-semibold">SportsDataIO</span>
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
