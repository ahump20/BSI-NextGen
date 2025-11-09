'use client';

import { useState, useEffect } from 'react';
import type { ConferenceStandings } from '@bsi/shared';

export default function CollegeBaseballStandingsPage() {
  const [standings, setStandings] = useState<ConferenceStandings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState<string>('all');

  useEffect(() => {
    fetchStandings();
  }, [selectedConference]);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      setError(null);

      const url =
        selectedConference === 'all'
          ? '/api/sports/college-baseball/standings'
          : `/api/sports/college-baseball/standings?conference=${encodeURIComponent(
              selectedConference
            )}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch standings');
      }

      const data = await response.json();
      setStandings(data.standings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const conferences = [
    'All Conferences',
    'ACC',
    'SEC',
    'Big 12',
    'Big Ten',
    'Pac-12',
    'American',
    'Conference USA',
    'Big West',
    'Atlantic 10',
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          College Baseball Conference Standings
        </h1>
        <p className="text-gray-600">
          Complete conference standings from D1Baseball.com
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="conference-select" className="block text-sm font-medium mb-2">
          Select Conference
        </label>
        <select
          id="conference-select"
          value={selectedConference}
          onChange={(e) => setSelectedConference(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Conferences</option>
          {conferences.slice(1).map((conf) => (
            <option key={conf} value={conf}>
              {conf}
            </option>
          ))}
        </select>
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

      {!loading && !error && standings.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
          <p className="text-gray-600">No standings available</p>
        </div>
      )}

      {!loading && !error && standings.length > 0 && (
        <div className="space-y-8">
          {standings.map((conf) => (
            <div key={conf.conference} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-3">
                <h2 className="text-xl font-bold">{conf.conference}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4">Team</th>
                      <th className="text-center py-3 px-4">Conf</th>
                      <th className="text-center py-3 px-4">Overall</th>
                      <th className="text-center py-3 px-4 hidden md:table-cell">W%</th>
                      <th className="text-center py-3 px-4 hidden md:table-cell">Home</th>
                      <th className="text-center py-3 px-4 hidden md:table-cell">Away</th>
                      <th className="text-center py-3 px-4 hidden lg:table-cell">RS</th>
                      <th className="text-center py-3 px-4 hidden lg:table-cell">RA</th>
                      <th className="text-center py-3 px-4 hidden lg:table-cell">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conf.teams.map((team, idx) => (
                      <tr key={team.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-500 font-mono text-xs w-6">{idx + 1}</span>
                            {team.logo && (
                              <img
                                src={team.logo}
                                alt={team.school}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <span className="font-semibold">{team.school}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4">
                          {team.record.conferenceWins}-{team.record.conferenceLosses}
                        </td>
                        <td className="text-center py-3 px-4">
                          {team.record.wins}-{team.record.losses}
                        </td>
                        <td className="text-center py-3 px-4 hidden md:table-cell">
                          {team.record.winPercentage.toFixed(3)}
                        </td>
                        <td className="text-center py-3 px-4 hidden md:table-cell text-gray-600">
                          {team.stats.homeRecord}
                        </td>
                        <td className="text-center py-3 px-4 hidden md:table-cell text-gray-600">
                          {team.stats.awayRecord}
                        </td>
                        <td className="text-center py-3 px-4 hidden lg:table-cell">
                          {team.stats.runsScored}
                        </td>
                        <td className="text-center py-3 px-4 hidden lg:table-cell">
                          {team.stats.runsAllowed}
                        </td>
                        <td className="text-center py-3 px-4 hidden lg:table-cell">
                          <span
                            className={
                              team.stats.streak.startsWith('W')
                                ? 'text-green-600 font-semibold'
                                : team.stats.streak.startsWith('L')
                                ? 'text-red-600 font-semibold'
                                : ''
                            }
                          >
                            {team.stats.streak}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Data from D1Baseball.com · Updated daily · America/Chicago timezone
        </p>
      </div>
    </div>
  );
}
