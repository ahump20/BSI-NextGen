'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type TeamInfo = {
  id: string;
  displayName: string;
  abbreviation: string;
  location: string;
  logos: { href: string }[];
};

type StandingsRow = {
  team: string;
  scope: string;
  summary: string | null;
  wins: number;
  losses: number;
  pct: string | null;
};

type TeamData = {
  sport: string;
  team: TeamInfo;
  standings: StandingsRow[];
  analytics: {
    pythagorean: {
      expectedWins: number | null;
      winPercentage: string | null;
    } | null;
    efficiency: {
      averageFor: number | null;
      averageAgainst: number | null;
      differential: number | null;
    } | null;
    momentum: {
      streak: string | null;
    } | null;
  };
};

export default function NCAAFootballPage() {
  const [teamId, setTeamId] = useState('251'); // Texas by default
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ncaa/football/${teamId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch team data');
      }
      const data = await response.json();
      setTeamData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Popular teams for quick selection
  const popularTeams = [
    { id: '251', name: 'Texas Longhorns' },
    { id: '99', name: 'LSU Tigers' },
    { id: '333', name: 'Alabama Crimson Tide' },
    { id: '2', name: 'Georgia Bulldogs' },
    { id: '194', name: 'Ohio State Buckeyes' },
    { id: '245', name: 'Tennessee Volunteers' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block transition-colors">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">NCAA Football</h1>
        <p className="text-gray-600">Real-time stats and analytics from ESPN API</p>
      </div>

      {/* Team Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Team</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {popularTeams.map((team) => (
            <button
              key={team.id}
              onClick={() => setTeamId(team.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                teamId === team.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          placeholder="Enter ESPN Team ID"
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full md:w-64"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Team Data */}
      {!loading && teamData && (
        <div>
          {/* Team Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <div className="flex items-center space-x-4">
              {teamData.team.logos?.[0] && (
                <img
                  src={teamData.team.logos[0].href}
                  alt={teamData.team.displayName}
                  className="w-16 h-16 object-contain"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{teamData.team.displayName}</h2>
                <p className="text-gray-600">{teamData.team.abbreviation}</p>
              </div>
            </div>
          </div>

          {/* Standings */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Season Record</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Scope</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Record</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Wins</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Losses</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Win %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamData.standings.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-sm font-medium">{row.scope}</td>
                      <td className="px-6 py-4 text-sm">{row.summary}</td>
                      <td className="px-6 py-4 text-sm">{row.wins}</td>
                      <td className="px-6 py-4 text-sm">{row.losses}</td>
                      <td className="px-6 py-4 text-sm">{row.pct || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pythagorean Expectation */}
            {teamData.analytics.pythagorean && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h4 className="text-lg font-bold mb-4">Pythagorean Expectation</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600 text-sm">Expected Wins:</span>
                    <div className="text-2xl font-bold text-orange-600">
                      {teamData.analytics.pythagorean.expectedWins?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Win Percentage:</span>
                    <div className="text-xl font-semibold">
                      {teamData.analytics.pythagorean.winPercentage
                        ? `${(parseFloat(teamData.analytics.pythagorean.winPercentage) * 100).toFixed(1)}%`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Efficiency */}
            {teamData.analytics.efficiency && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h4 className="text-lg font-bold mb-4">Efficiency Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Avg Points For:</span>
                    <span className="font-semibold">{teamData.analytics.efficiency.averageFor?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Avg Points Against:</span>
                    <span className="font-semibold">
                      {teamData.analytics.efficiency.averageAgainst?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Differential:</span>
                    <span
                      className={`font-bold ${
                        (teamData.analytics.efficiency.differential || 0) > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {teamData.analytics.efficiency.differential !== null
                        ? `${teamData.analytics.efficiency.differential > 0 ? '+' : ''}${teamData.analytics.efficiency.differential.toFixed(1)}`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Momentum */}
            {teamData.analytics.momentum && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h4 className="text-lg font-bold mb-4">Momentum</h4>
                <div>
                  <span className="text-gray-600 text-sm">Current Streak:</span>
                  <div className="text-3xl font-bold text-orange-600">
                    {teamData.analytics.momentum.streak || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Source */}
          <div className="mt-8 text-center text-sm text-gray-500">
            Data provided by ESPN College Football API • Updated in real-time
          </div>
        </div>
      )}
    </div>
  );
}
