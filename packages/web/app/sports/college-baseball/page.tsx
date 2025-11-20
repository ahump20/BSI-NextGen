'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { NCAAGame } from '@bsi/shared';
import { NewsFeed } from '@/components/NewsFeed';

export default function CollegeBaseballPage() {
  const [games, setGames] = useState<NCAAGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchGames(selectedDate);
  }, [selectedDate]);

  const fetchGames = async (date: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/sports/college-baseball/games?date=${date}`);

      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }

      const data = await response.json();
      setGames(data.games || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'America/Chicago',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Chicago',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'final':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          College Baseball Schedule
        </h1>
        <p className="text-gray-600">
          Complete box scores and play-by-play - the ESPN gap filler
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="date-picker" className="block text-sm font-medium mb-2">
          Select Date
        </label>
        <input
          id="date-picker"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-md p-4 mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-600">No games scheduled for {formatDate(selectedDate)}</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            {games.length} {games.length === 1 ? 'game' : 'games'} on {formatDate(selectedDate)}
          </p>

          {games.map((game) => (
            <Link
              key={game.id}
              href={`/sports/college-baseball/games/${game.id}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">{game.shortName}</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded border ${getStatusBadgeColor(
                    game.status.type
                  )}`}
                >
                  {game.status.detail}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 items-center">
                {/* Away Team */}
                <div className="flex items-center space-x-3">
                  {game.teams.away.logo && (
                    <img
                      src={game.teams.away.logo}
                      alt={game.teams.away.name}
                      className="w-10 h-10 md:w-12 md:h-12 object-contain"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-sm md:text-base">
                      {game.teams.away.name}
                    </p>
                    <p className="text-xs text-gray-500">{game.teams.away.record}</p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold">
                    {game.teams.away.score} - {game.teams.home.score}
                  </div>
                  {game.status.type === 'live' && (
                    <p className="text-sm text-red-600 font-semibold mt-1">
                      {game.status.inningHalf === 'top' ? 'Top' : 'Bot'}{' '}
                      {game.status.inning}
                    </p>
                  )}
                  {game.status.type === 'scheduled' && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatTime(game.date)}
                    </p>
                  )}
                </div>

                {/* Home Team */}
                <div className="flex items-center justify-end space-x-3">
                  <div className="text-right">
                    <p className="font-semibold text-sm md:text-base">
                      {game.teams.home.name}
                    </p>
                    <p className="text-xs text-gray-500">{game.teams.home.record}</p>
                  </div>
                  {game.teams.home.logo && (
                    <img
                      src={game.teams.home.logo}
                      alt={game.teams.home.name}
                      className="w-10 h-10 md:w-12 md:h-12 object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {game.venue.name}, {game.venue.city}, {game.venue.state}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* College Baseball News Section */}
      <div className="mt-12">
        <NewsFeed
          sport="COLLEGE_BASEBALL"
          limit={12}
          layout="grid"
          columns={3}
          title="College Baseball News"
        />
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Data from ESPN College Baseball API · Updated in America/Chicago timezone
        </p>
      </div>
    </div>
  );
}
