'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import type { NCAABoxScore } from '@bsi/shared';

export default function CollegeBaseballGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const [boxScore, setBoxScore] = useState<NCAABoxScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoxScore();

    // Auto-refresh for live games
    const interval = setInterval(() => {
      if (boxScore?.status.type === 'live') {
        fetchBoxScore();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [gameId, boxScore?.status.type]);

  const fetchBoxScore = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/sports/college-baseball/games/${gameId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch box score');
      }

      const data = await response.json();
      setBoxScore(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !boxScore) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-300 text-red-800 rounded-md p-4">
          <p className="font-semibold">Error</p>
          <p>{error || 'Box score not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Game Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="text-center mb-4">
          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            {boxScore.status.detail}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Away Team */}
          <div className="text-center">
            {boxScore.teams.away.logo && (
              <img
                src={boxScore.teams.away.logo}
                alt={boxScore.teams.away.name}
                className="w-16 h-16 mx-auto mb-2"
              />
            )}
            <p className="font-bold text-lg">{boxScore.teams.away.name}</p>
            <p className="text-sm text-gray-500">{boxScore.teams.away.record}</p>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className="text-4xl font-bold">
              {boxScore.teams.away.score} - {boxScore.teams.home.score}
            </div>
            {boxScore.status.type === 'live' && (
              <p className="text-sm text-red-600 font-semibold mt-2">
                {boxScore.status.inningHalf === 'top' ? 'Top' : 'Bottom'}{' '}
                {boxScore.status.inning}
              </p>
            )}
          </div>

          {/* Home Team */}
          <div className="text-center">
            {boxScore.teams.home.logo && (
              <img
                src={boxScore.teams.home.logo}
                alt={boxScore.teams.home.name}
                className="w-16 h-16 mx-auto mb-2"
              />
            )}
            <p className="font-bold text-lg">{boxScore.teams.home.name}</p>
            <p className="text-sm text-gray-500">{boxScore.teams.home.record}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t text-center text-sm text-gray-600">
          {boxScore.venue.name}, {boxScore.venue.city}, {boxScore.venue.state}
        </div>
      </div>

      {/* Team Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Team Stats</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Team</th>
                <th className="text-center py-2">R</th>
                <th className="text-center py-2">H</th>
                <th className="text-center py-2">E</th>
                <th className="text-center py-2">LOB</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-semibold">{boxScore.teams.away.abbreviation}</td>
                <td className="text-center">{boxScore.teamStats.away.runs}</td>
                <td className="text-center">{boxScore.teamStats.away.hits}</td>
                <td className="text-center">{boxScore.teamStats.away.errors}</td>
                <td className="text-center">{boxScore.teamStats.away.leftOnBase}</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold">{boxScore.teams.home.abbreviation}</td>
                <td className="text-center">{boxScore.teamStats.home.runs}</td>
                <td className="text-center">{boxScore.teamStats.home.hits}</td>
                <td className="text-center">{boxScore.teamStats.home.errors}</td>
                <td className="text-center">{boxScore.teamStats.home.leftOnBase}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Batting Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Batting</h2>

        {/* Away Team Batting */}
        <h3 className="font-semibold mb-2">{boxScore.teams.away.name}</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-2">Player</th>
                <th className="text-center py-2 px-1">POS</th>
                <th className="text-center py-2 px-1">AB</th>
                <th className="text-center py-2 px-1">R</th>
                <th className="text-center py-2 px-1">H</th>
                <th className="text-center py-2 px-1">RBI</th>
                <th className="text-center py-2 px-1">BB</th>
                <th className="text-center py-2 px-1">K</th>
                <th className="text-center py-2 px-1">AVG</th>
              </tr>
            </thead>
            <tbody>
              {boxScore.batting.away.map((player, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{player.name}</td>
                  <td className="text-center px-1">{player.position}</td>
                  <td className="text-center px-1">{player.atBats}</td>
                  <td className="text-center px-1">{player.runs}</td>
                  <td className="text-center px-1">{player.hits}</td>
                  <td className="text-center px-1">{player.rbi}</td>
                  <td className="text-center px-1">{player.walks}</td>
                  <td className="text-center px-1">{player.strikeouts}</td>
                  <td className="text-center px-1">{player.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Home Team Batting */}
        <h3 className="font-semibold mb-2">{boxScore.teams.home.name}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-2">Player</th>
                <th className="text-center py-2 px-1">POS</th>
                <th className="text-center py-2 px-1">AB</th>
                <th className="text-center py-2 px-1">R</th>
                <th className="text-center py-2 px-1">H</th>
                <th className="text-center py-2 px-1">RBI</th>
                <th className="text-center py-2 px-1">BB</th>
                <th className="text-center py-2 px-1">K</th>
                <th className="text-center py-2 px-1">AVG</th>
              </tr>
            </thead>
            <tbody>
              {boxScore.batting.home.map((player, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{player.name}</td>
                  <td className="text-center px-1">{player.position}</td>
                  <td className="text-center px-1">{player.atBats}</td>
                  <td className="text-center px-1">{player.runs}</td>
                  <td className="text-center px-1">{player.hits}</td>
                  <td className="text-center px-1">{player.rbi}</td>
                  <td className="text-center px-1">{player.walks}</td>
                  <td className="text-center px-1">{player.strikeouts}</td>
                  <td className="text-center px-1">{player.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pitching Stats */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Pitching</h2>

        {/* Away Team Pitching */}
        <h3 className="font-semibold mb-2">{boxScore.teams.away.name}</h3>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-2">Pitcher</th>
                <th className="text-center py-2 px-1">DEC</th>
                <th className="text-center py-2 px-1">IP</th>
                <th className="text-center py-2 px-1">H</th>
                <th className="text-center py-2 px-1">R</th>
                <th className="text-center py-2 px-1">ER</th>
                <th className="text-center py-2 px-1">BB</th>
                <th className="text-center py-2 px-1">K</th>
                <th className="text-center py-2 px-1">ERA</th>
              </tr>
            </thead>
            <tbody>
              {boxScore.pitching.away.map((pitcher, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{pitcher.name}</td>
                  <td className="text-center px-1">{pitcher.decision}</td>
                  <td className="text-center px-1">{pitcher.inningsPitched.toFixed(1)}</td>
                  <td className="text-center px-1">{pitcher.hits}</td>
                  <td className="text-center px-1">{pitcher.runs}</td>
                  <td className="text-center px-1">{pitcher.earnedRuns}</td>
                  <td className="text-center px-1">{pitcher.walks}</td>
                  <td className="text-center px-1">{pitcher.strikeouts}</td>
                  <td className="text-center px-1">{pitcher.era}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Home Team Pitching */}
        <h3 className="font-semibold mb-2">{boxScore.teams.home.name}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2 px-2">Pitcher</th>
                <th className="text-center py-2 px-1">DEC</th>
                <th className="text-center py-2 px-1">IP</th>
                <th className="text-center py-2 px-1">H</th>
                <th className="text-center py-2 px-1">R</th>
                <th className="text-center py-2 px-1">ER</th>
                <th className="text-center py-2 px-1">BB</th>
                <th className="text-center py-2 px-1">K</th>
                <th className="text-center py-2 px-1">ERA</th>
              </tr>
            </thead>
            <tbody>
              {boxScore.pitching.home.map((pitcher, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2">{pitcher.name}</td>
                  <td className="text-center px-1">{pitcher.decision}</td>
                  <td className="text-center px-1">{pitcher.inningsPitched.toFixed(1)}</td>
                  <td className="text-center px-1">{pitcher.hits}</td>
                  <td className="text-center px-1">{pitcher.runs}</td>
                  <td className="text-center px-1">{pitcher.earnedRuns}</td>
                  <td className="text-center px-1">{pitcher.walks}</td>
                  <td className="text-center px-1">{pitcher.strikeouts}</td>
                  <td className="text-center px-1">{pitcher.era}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-xs text-gray-500">
        {boxScore.dataSource} · Last updated: {new Date(boxScore.lastUpdated).toLocaleTimeString()} {boxScore.timezone}
      </div>
    </div>
  );
}
