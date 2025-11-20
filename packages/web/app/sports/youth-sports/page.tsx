'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Team = {
  rank: number;
  team: string;
  school: string;
  city: string;
  record: { overall: string; district: string };
  stats: { pointsFor: number; pointsAgainst: number; streak: string };
  playoffStatus: string;
};

type Game = {
  id: string;
  status: string;
  homeTeam: { name: string; score: number };
  awayTeam: { name: string; score: number };
  quarter: string;
  venue: string;
  date: string;
};

type Tournament = {
  id: string;
  name: string;
  ageGroup: string;
  type: string;
  status: string;
  dates: { start: string; end: string };
  venue: string;
  location: string;
  teams: { total: number; registered: number };
  topProspects: any[];
  champions: any;
};

export default function YouthSportsPage() {
  const [activeTab, setActiveTab] = useState<'txhsfb' | 'perfectgame'>('txhsfb');
  const [loading, setLoading] = useState(true);
  const [hsFootballStandings, setHsFootballStandings] = useState<any>(null);
  const [hsFootballScores, setHsFootballScores] = useState<any>(null);
  const [perfectGameData, setPerfectGameData] = useState<any>(null);
  const [selectedClassification, setSelectedClassification] = useState('6A');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('14U');

  useEffect(() => {
    fetchYouthSportsData();
    const interval = setInterval(fetchYouthSportsData, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [activeTab, selectedClassification, selectedAgeGroup]);

  const fetchYouthSportsData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'txhsfb') {
        // Fetch Texas HS Football data
        const [standingsRes, scoresRes] = await Promise.all([
          fetch(`/api/sports/youth-sports/texas-hs-football/standings?classification=${selectedClassification}`),
          fetch(`/api/sports/youth-sports/texas-hs-football/scores?classification=${selectedClassification}`)
        ]);

        const standings = await standingsRes.json();
        const scores = await scoresRes.json();

        setHsFootballStandings(standings);
        setHsFootballScores(scores);
      } else {
        // Fetch Perfect Game data
        const response = await fetch(
          `/api/sports/youth-sports/perfect-game/tournaments?ageGroup=${selectedAgeGroup}&state=TX`
        );
        const data = await response.json();
        setPerfectGameData(data);
      }
    } catch (error) {
      console.error('[Youth Sports] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block transition-colors"
        >
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Youth Sports Intelligence
        </h1>
        <p className="text-gray-600">
          Texas HS Football • Perfect Game Baseball • Deep South Coverage
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('txhsfb')}
            className={`pb-4 px-4 font-semibold transition-colors border-b-2 ${
              activeTab === 'txhsfb'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🏈 Texas HS Football
          </button>
          <button
            onClick={() => setActiveTab('perfectgame')}
            className={`pb-4 px-4 font-semibold transition-colors border-b-2 ${
              activeTab === 'perfectgame'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚾ Perfect Game Baseball
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      )}

      {/* Texas HS Football Tab */}
      {!loading && activeTab === 'txhsfb' && (
        <div>
          {/* Classification Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Classification</label>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="6A">6A (Largest Schools)</option>
              <option value="5A">5A</option>
              <option value="4A">4A</option>
              <option value="3A">3A</option>
              <option value="2A">2A</option>
              <option value="1A">1A (Smallest Schools)</option>
            </select>
          </div>

          {/* Recent Scores */}
          {hsFootballScores?.data?.games && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">Recent Games</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hsFootballScores.data.games.slice(0, 6).map((game: Game) => (
                  <div key={game.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{game.awayTeam.name}</span>
                        <span className="text-2xl font-bold">{game.awayTeam.score}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{game.homeTeam.name}</span>
                        <span className="text-2xl font-bold">{game.homeTeam.score}</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{game.quarter}</span>
                        <span>{game.venue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* District Standings */}
          {hsFootballStandings?.data?.teams && (
            <div className="mb-8">
              <h3 className="text-2xl font-bold mb-4">
                District {hsFootballStandings.data.district} Standings
              </h3>
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Overall</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">District</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PF</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">PA</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Streak</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hsFootballStandings.data.teams.map((team: Team) => (
                      <tr
                        key={team.rank}
                        className={
                          team.playoffStatus === 'Playoff Qualifier'
                            ? 'bg-green-50'
                            : ''
                        }
                      >
                        <td className="px-4 py-3 text-sm">{team.rank}</td>
                        <td className="px-4 py-3 text-sm">
                          <div>
                            <div className="font-semibold">{team.team}</div>
                            <div className="text-gray-600 text-xs">{team.school}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{team.record.overall}</td>
                        <td className="px-4 py-3 text-sm">{team.record.district}</td>
                        <td className="px-4 py-3 text-sm">{team.stats.pointsFor}</td>
                        <td className="px-4 py-3 text-sm">{team.stats.pointsAgainst}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              team.stats.streak.startsWith('W')
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {team.stats.streak}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              team.playoffStatus === 'Playoff Qualifier'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {team.playoffStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border border-blue-200">
                ℹ️ {hsFootballStandings.data.playoffs?.format}
              </div>
            </div>
          )}

          {/* Demo Notice */}
          {hsFootballStandings?.meta?.disclaimer && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">⚠️</div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{hsFootballStandings.meta.disclaimer}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Perfect Game Tab */}
      {!loading && activeTab === 'perfectgame' && (
        <div>
          {/* Age Group Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Age Group</label>
            <select
              value={selectedAgeGroup}
              onChange={(e) => setSelectedAgeGroup(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="18U">18U</option>
              <option value="17U">17U</option>
              <option value="16U">16U</option>
              <option value="15U">15U</option>
              <option value="14U">14U</option>
              <option value="13U">13U</option>
              <option value="12U">12U</option>
            </select>
          </div>

          {/* Tournaments */}
          {perfectGameData?.data?.tournaments && (
            <div>
              <h3 className="text-2xl font-bold mb-4">Upcoming Tournaments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {perfectGameData.data.tournaments
                  .filter((t: Tournament) => t.status !== 'completed')
                  .map((tournament: Tournament) => (
                    <div key={tournament.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                      <div className="mb-4">
                        <h4 className="text-xl font-bold mb-2">{tournament.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              tournament.status === 'live'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {tournament.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Venue:</span>
                          <span className="font-medium">{tournament.venue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium">{tournament.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dates:</span>
                          <span className="font-medium">
                            {new Date(tournament.dates.start).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })} - {new Date(tournament.dates.end).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Teams:</span>
                          <span className="font-medium">{tournament.teams.registered}/{tournament.teams.total}</span>
                        </div>
                      </div>

                      {tournament.topProspects && tournament.topProspects.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="font-semibold mb-2 text-sm">Top Prospects to Watch</h5>
                          <div className="space-y-1">
                            {tournament.topProspects.slice(0, 3).map((prospect: any, idx: number) => (
                              <div key={idx} className="text-xs text-gray-700">
                                <span className="font-medium">{prospect.name}</span> - {prospect.position}{' '}
                                {prospect.commitment && <span className="text-gray-500">({prospect.commitment})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Demo Notice */}
          {perfectGameData?.meta?.disclaimer && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">⚠️</div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">{perfectGameData.meta.disclaimer}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
