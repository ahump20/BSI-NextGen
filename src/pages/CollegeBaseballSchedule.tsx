/**
 * College Baseball Schedule Page
 * Lists games with scores, provides links to full box scores
 *
 * Fills ESPN's gap by providing complete college baseball schedules
 * with real-time scores and direct links to full box scores.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LiveScoreCard from '../components/sports/LiveScoreCard';
import LoadingState from '../components/common/LoadingState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Card, { CardHeader, CardTitle, CardContent } from '../components/primitives/Card';

interface NCAAGame {
  id: string;
  homeTeam: {
    id: string;
    name: string;
    school: string;
    conference: string;
    logo?: string;
  };
  awayTeam: {
    id: string;
    name: string;
    school: string;
    conference: string;
    logo?: string;
  };
  gameDate: string;
  venue: string;
  status: string;
  inning?: number;
  homeScore: number;
  awayScore: number;
}

interface GamesResponse {
  games: NCAAGame[];
  meta: {
    cached: boolean;
    count: number;
    date: string;
    filters: any;
    lastUpdated: string;
    timezone: string;
    dataSource: string;
  };
}

const CollegeBaseballSchedule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<NCAAGame[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayInChicago());
  const [selectedConference, setSelectedConference] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch games from API
  const fetchGames = async () => {
    try {
      const params = new URLSearchParams({ date: selectedDate });
      if (selectedConference !== 'all') {
        params.append('conference', selectedConference);
      }

      const response = await fetch(
        `https://blazesportsintel.com/api/college-baseball/games?${params}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch games: ${response.status}`);
      }

      const data: GamesResponse = await response.json();
      setGames(data.games);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchGames();
  }, [selectedDate, selectedConference]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchGames();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, selectedDate, selectedConference]);

  // Get list of unique conferences
  const conferences = ['all', ...new Set(games.flatMap(g => [g.homeTeam.conference, g.awayTeam.conference]))];

  // Group games by status
  const liveGames = games.filter(g => g.status === 'in_progress');
  const finalGames = games.filter(g => g.status === 'final');
  const upcomingGames = games.filter(g => g.status === 'scheduled');

  // Format time in Central timezone
  const formatTime = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold">College Baseball</h1>
            <p className="text-blue-100 mt-2">
              Complete schedules and box scores - the coverage ESPN won't provide
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 flex-wrap items-center">
                <div>
                  <label htmlFor="date" className="text-sm font-medium text-gray-700 mr-2">
                    Date:
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="conference" className="text-sm font-medium text-gray-700 mr-2">
                    Conference:
                  </label>
                  <select
                    id="conference"
                    value={selectedConference}
                    onChange={(e) => setSelectedConference(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {conferences.map(conf => (
                      <option key={conf} value={conf}>
                        {conf === 'all' ? 'All Conferences' : conf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="autoRefresh" className="text-sm text-gray-600">
                  <input
                    id="autoRefresh"
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="mr-2"
                  />
                  Auto-refresh
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Games List */}
        <div className="container mx-auto px-4 py-8">
          {loading ? (
            <LoadingState message="Loading games..." />
          ) : error ? (
            <Card>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-red-600 mb-4">{error}</p>
                  <button
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      fetchGames();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : games.length === 0 ? (
            <Card>
              <CardContent>
                <p className="text-center text-gray-600 py-12">
                  No games scheduled for {selectedDate}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Live Games */}
              {liveGames.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                    Live Games ({liveGames.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {liveGames.map(game => (
                      <Link
                        key={game.id}
                        to={`/college-baseball/games/${game.id}`}
                        className="block hover:scale-105 transition-transform"
                      >
                        <LiveScoreCard
                          homeTeam={{
                            name: game.homeTeam.name,
                            logo: game.homeTeam.logo,
                            score: game.homeScore,
                          }}
                          awayTeam={{
                            name: game.awayTeam.name,
                            logo: game.awayTeam.logo,
                            score: game.awayScore,
                          }}
                          status={game.inning ? `${game.inning}th` : 'Live'}
                          isLive={true}
                          venue={game.venue}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Games */}
              {finalGames.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Final Games ({finalGames.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {finalGames.map(game => (
                      <Link
                        key={game.id}
                        to={`/college-baseball/games/${game.id}`}
                        className="block hover:scale-105 transition-transform"
                      >
                        <LiveScoreCard
                          homeTeam={{
                            name: game.homeTeam.name,
                            logo: game.homeTeam.logo,
                            score: game.homeScore,
                          }}
                          awayTeam={{
                            name: game.awayTeam.name,
                            logo: game.awayTeam.logo,
                            score: game.awayScore,
                          }}
                          status="Final"
                          isLive={false}
                          venue={game.venue}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Games */}
              {upcomingGames.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Upcoming Games ({upcomingGames.length})
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingGames.map(game => (
                      <Link
                        key={game.id}
                        to={`/college-baseball/games/${game.id}`}
                        className="block hover:scale-105 transition-transform"
                      >
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-center mb-3">
                              <p className="text-sm text-gray-600">
                                {formatTime(game.gameDate)} CT
                              </p>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {game.awayTeam.logo && (
                                  <img src={game.awayTeam.logo} alt="" className="w-8 h-8" />
                                )}
                                <span className="font-medium">{game.awayTeam.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {game.homeTeam.logo && (
                                  <img src={game.homeTeam.logo} alt="" className="w-8 h-8" />
                                )}
                                <span className="font-medium">{game.homeTeam.name}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-3 text-center">
                              {game.venue}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

/**
 * Get today's date in America/Chicago timezone (YYYY-MM-DD format)
 */
function getTodayInChicago(): string {
  const now = new Date();
  const chicagoTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Chicago' })
  );

  const year = chicagoTime.getFullYear();
  const month = String(chicagoTime.getMonth() + 1).padStart(2, '0');
  const day = String(chicagoTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default CollegeBaseballSchedule;
