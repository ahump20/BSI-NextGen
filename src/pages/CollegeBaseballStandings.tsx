/**
 * College Baseball Conference Standings Page
 * Displays conference standings with overall and conference records
 *
 * Provides comprehensive standings that ESPN often lacks for college baseball
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Standings from '../components/sports/Standings';
import LoadingState from '../components/common/LoadingState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Card, { CardHeader, CardTitle, CardContent } from '../components/primitives/Card';

interface StandingsTeam {
  rank: number;
  team: {
    id: string;
    name: string;
    school: string;
    logo?: string;
  };
  overallRecord: {
    wins: number;
    losses: number;
    percentage: string;
  };
  conferenceRecord: {
    wins: number;
    losses: number;
    percentage: string;
  };
  homeRecord?: string;
  awayRecord?: string;
  streak?: string;
  runsScored?: number;
  runsAllowed?: number;
  runDifferential?: number;
}

interface StandingsResponse {
  conference: string;
  teams: StandingsTeam[];
  lastUpdated: string;
  meta: {
    cached: boolean;
    count: number;
    conference: string;
    lastUpdated: string;
    timezone: string;
    dataSource: string;
  };
}

const CONFERENCES = [
  'SEC',
  'ACC',
  'Big 12',
  'Big Ten',
  'Pac-12',
  'Big East',
  'American',
  'Conference USA',
  'Mountain West',
  'Sun Belt',
  'WAC',
  'MAAC',
  'Atlantic 10',
  'Big West',
  'Ivy League',
];

const CollegeBaseballStandings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConference, setSelectedConference] = useState('SEC');
  const [standings, setStandings] = useState<StandingsTeam[]>([]);
  const [meta, setMeta] = useState<StandingsResponse['meta'] | null>(null);

  // Fetch standings from API
  const fetchStandings = async (conference: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://blazesportsintel.com/api/college-baseball/standings?conference=${encodeURIComponent(conference)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch standings: ${response.status}`);
      }

      const data: StandingsResponse = await response.json();
      setStandings(data.teams);
      setMeta(data.meta);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch standings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load standings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings(selectedConference);
  }, [selectedConference]);

  // Transform standings to Standings component format
  const transformStandings = () => {
    return standings.map((team) => ({
      rank: team.rank,
      teamName: team.team.name,
      teamLogo: team.team.logo,
      wins: team.overallRecord.wins,
      losses: team.overallRecord.losses,
      winPercentage: team.overallRecord.percentage,
      conferenceRecord: `${team.conferenceRecord.wins}-${team.conferenceRecord.losses}`,
      homeRecord: team.homeRecord,
      awayRecord: team.awayRecord,
      streak: team.streak,
      pointsScored: team.runsScored,
      pointsAllowed: team.runsAllowed,
      differential: team.runDifferential,
    }));
  };

  // Format last updated time
  const formatLastUpdated = (): string => {
    if (!meta) return '';

    const date = new Date(meta.lastUpdated);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Loading standings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  fetchStandings(selectedConference);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold">
              College Baseball Conference Standings
            </h1>
            <p className="text-blue-100 mt-2">
              Complete standings for all NCAA Division I conferences
            </p>
          </div>
        </div>

        {/* Conference Selector */}
        <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label htmlFor="conference" className="text-sm font-medium text-gray-700">
                Conference:
              </label>
              <select
                id="conference"
                value={selectedConference}
                onChange={(e) => setSelectedConference(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONFERENCES.map((conf) => (
                  <option key={conf} value={conf}>
                    {conf}
                  </option>
                ))}
              </select>
              {meta && (
                <span className="text-sm text-gray-600 ml-auto">
                  Updated: {formatLastUpdated()} CT
                  {meta.cached && ' (Cached)'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Standings */}
        <div className="container mx-auto px-4 py-8">
          {standings.length > 0 ? (
            <Standings
              sport="baseball"
              title={`${selectedConference} Standings`}
              teams={transformStandings()}
            />
          ) : (
            <Card>
              <CardContent>
                <p className="text-center text-gray-600 py-12">
                  No standings available for {selectedConference}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Conference Stats Summary */}
          {standings.length > 0 && meta && (
            <div className="mt-8 grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {meta.count}
                  </div>
                  <div className="text-gray-600 mt-2">Teams</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {standings[0]?.team.name.substring(0, 15)}
                    {standings[0]?.team.name.length > 15 ? '...' : ''}
                  </div>
                  <div className="text-gray-600 mt-2">Leader</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {standings[0]?.overallRecord.percentage}
                  </div>
                  <div className="text-gray-600 mt-2">Top Win %</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.max(...standings.map(t => t.runDifferential || 0))}
                  </div>
                  <div className="text-gray-600 mt-2">Best Run Diff</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Links */}
          <div className="mt-8 text-center">
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                to="/college-baseball/rankings"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Top 25 Rankings
              </Link>
              <Link
                to="/college-baseball"
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Schedule
              </Link>
            </div>
          </div>

          {/* Data Attribution */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Data Source: {meta?.dataSource} |{' '}
              Standings updated daily during the season
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CollegeBaseballStandings;
