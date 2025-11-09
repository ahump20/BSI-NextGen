'use client';

import { useState, useEffect } from 'react';
import type { D1BaseballRanking } from '@bsi/shared';

export default function CollegeBaseballRankingsPage() {
  const [rankings, setRankings] = useState<D1BaseballRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/sports/college-baseball/rankings');

      if (!response.ok) {
        throw new Error('Failed to fetch rankings');
      }

      const data = await response.json();
      setRankings(data.rankings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getRankMovementIcon = (movement: string) => {
    switch (movement) {
      case 'up':
        return <span className="text-green-600">↑</span>;
      case 'down':
        return <span className="text-red-600">↓</span>;
      case 'new':
        return <span className="text-blue-600">NEW</span>;
      default:
        return <span className="text-gray-400">-</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          D1Baseball Top 25 Rankings
        </h1>
        <p className="text-gray-600">
          Weekly rankings from D1Baseball.com - updated every Monday
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-md p-4 mb-6">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {!error && rankings.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-center py-3 px-4">Rank</th>
                  <th className="text-center py-3 px-2">Δ</th>
                  <th className="text-left py-3 px-4">Team</th>
                  <th className="text-center py-3 px-4">Conference</th>
                  <th className="text-center py-3 px-4">Record</th>
                  <th className="text-center py-3 px-4 hidden md:table-cell">Conf</th>
                  <th className="text-center py-3 px-4 hidden md:table-cell">1st</th>
                  <th className="text-center py-3 px-4 hidden lg:table-cell">Points</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((team) => (
                  <tr key={team.rank} className="border-b hover:bg-gray-50">
                    <td className="text-center py-3 px-4 font-bold">{team.rank}</td>
                    <td className="text-center py-3 px-2">
                      {getRankMovementIcon(team.rankMovement)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {team.team.logo && (
                          <img
                            src={team.team.logo}
                            alt={team.team.school}
                            className="w-8 h-8 object-contain"
                          />
                        )}
                        <span className="font-semibold">{team.team.school}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4 text-gray-600">
                      {team.team.conference}
                    </td>
                    <td className="text-center py-3 px-4">
                      {team.record.wins}-{team.record.losses}
                    </td>
                    <td className="text-center py-3 px-4 hidden md:table-cell text-gray-600">
                      {team.record.conference}
                    </td>
                    <td className="text-center py-3 px-4 hidden md:table-cell">
                      {team.firstPlaceVotes > 0 ? team.firstPlaceVotes : '-'}
                    </td>
                    <td className="text-center py-3 px-4 hidden lg:table-cell">
                      {team.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Data from D1Baseball.com · Updated weekly on Mondays · America/Chicago timezone
        </p>
      </div>
    </div>
  );
}
