'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import type { Game, Standing } from '@bsi/shared';
import { LiveDataSkeleton } from '@/components/monitoring/LiveDataSkeleton';
import { formatDateTime, formatNumber } from '@/lib/formatting';

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
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNFLData() {
      try {
        setLoading(true);
        setError(null);

        const [gamesRes, standingsRes] = await Promise.all([
          fetch(`/api/sports/nfl/games?week=${selectedWeek}`),
          fetch('/api/sports/nfl/standings'),
        ]);

        if (!gamesRes.ok || !standingsRes.ok) {
          throw new Error('Failed to fetch NFL data');
        }

        const gamesData: ApiResponse<Game[]> = await gamesRes.json();
        const standingsData: ApiResponse<Standing[]> = await standingsRes.json();

        setGames(gamesData.data);
        setStandings(standingsData.data);
        setLastUpdated(
          gamesData.source?.timestamp ||
            standingsData.source?.timestamp ||
            new Date().toISOString(),
        );
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

  const weeks = Array.from({ length: 18 }, (_, i) => i + 1);

  const conferences = {
    all: 'All Conferences',
    afc: 'AFC',
    nfc: 'NFC',
  };

  const filteredStandings = selectedConference === 'all'
    ? standings
    : standings.filter(s =>
        s.team.conference?.toLowerCase() === selectedConference.toLowerCase()
      );

  // Group by conference and division
  const groupedStandings = filteredStandings.reduce((acc, standing) => {
    const conference = standing.team.conference || 'Unknown';
    const division = standing.team.division || 'Unknown';
    const key = `${conference} ${division}`;

    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(standing);
    return acc;
  }, {} as Record<string, Standing[]>);

  // Sort divisions in order: AFC East, West, North, South, then NFC East, West, North, South
  const divisionOrder = [
    'AFC East',
    'AFC West',
    'AFC North',
    'AFC South',
    'NFC East',
    'NFC West',
    'NFC North',
    'NFC South',
  ];

  const sortedDivisions = Object.keys(groupedStandings).sort((a, b) => {
    const indexA = divisionOrder.indexOf(a);
    const indexB = divisionOrder.indexOf(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hover:from-green-700 hover:to-emerald-700 transition-all"
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
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all"
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
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        aria-busy={loading}
        aria-live="polite"
      >
        {/* Status Badge */}
        <div className="mb-6 flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Data from SportsDataIO
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-600" aria-label={`Last updated ${formatDateTime(lastUpdated)}`}>
              Updated {formatDateTime(lastUpdated)}
            </p>
          )}
        </div>

        {loading && <LiveDataSkeleton />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6" role="alert">
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
                <div className="flex items-center gap-3">
                  <label htmlFor="week-select" className="text-sm font-medium text-gray-700">
                    Week:
                  </label>
                  <select
                    id="week-select"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {weeks.map(week => (
                      <option key={week} value={week}>
                        Week {week}
                      </option>
                    ))}
                  </select>
                </div>
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
                              : 'bg-green-100 text-green-800'
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
                        <div className="flex items-center justify-between" aria-label={`Away team ${game.awayTeam.name} score`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {game.awayTeam.abbreviation}
                            </span>
                          </div>
                          <span className="text-xl font-bold text-gray-800">
                            {formatNumber(game.awayScore, { maximumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between" aria-label={`Home team ${game.homeTeam.name} score`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-800">
                              {game.homeTeam.abbreviation}
                            </span>
                          </div>
                          <span className="text-xl font-bold text-gray-800">
                            {formatNumber(game.homeScore, { maximumFractionDigits: 0 })}
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

                {/* Conference Filter */}
                <select
                  value={selectedConference}
                  onChange={(e) => setSelectedConference(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3">
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
                                {formatNumber(standing.winPercentage, {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                                {standing.gamesBack === 0
                                  ? '-'
                                  : standing.gamesBack
                                      ? formatNumber(standing.gamesBack, { maximumFractionDigits: 1 })
                                      : '-'}
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
