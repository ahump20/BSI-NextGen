/**
 * College Baseball Rankings Page
 * Displays D1Baseball Top 25 rankings with rank movement
 *
 * Shows complete rankings that ESPN often neglects to display prominently
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Table, { Column } from '../components/primitives/Table';
import Card, { CardHeader, CardTitle, CardContent } from '../components/primitives/Card';
import LoadingState from '../components/common/LoadingState';
import ErrorBoundary from '../components/common/ErrorBoundary';

interface Ranking {
  rank: number;
  previousRank?: number;
  team: {
    id: string;
    name: string;
    school: string;
    conference: string;
    logo?: string;
  };
  record: string;
  conferenceRecord?: string;
  points?: number;
  firstPlaceVotes?: number;
  lastWeekResult?: string;
}

interface RankingsResponse {
  rankings: Ranking[];
  meta: {
    cached: boolean;
    count: number;
    week: string;
    lastUpdated: string;
    timezone: string;
    dataSource: string;
  };
}

const CollegeBaseballRankings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [meta, setMeta] = useState<RankingsResponse['meta'] | null>(null);

  // Fetch rankings from API
  const fetchRankings = async () => {
    try {
      const response = await fetch(
        'https://blazesportsintel.com/api/college-baseball/rankings'
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch rankings: ${response.status}`);
      }

      const data: RankingsResponse = await response.json();
      setRankings(data.rankings);
      setMeta(data.meta);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  // Get rank movement indicator
  const getRankMovement = (current: number, previous?: number): React.ReactNode => {
    if (!previous) {
      return <span className="text-gray-400 text-sm">New</span>;
    }

    const change = previous - current;

    if (change > 0) {
      return (
        <span className="text-green-600 font-semibold flex items-center gap-1">
          <span className="text-xs">▲</span> {change}
        </span>
      );
    }

    if (change < 0) {
      return (
        <span className="text-red-600 font-semibold flex items-center gap-1">
          <span className="text-xs">▼</span> {Math.abs(change)}
        </span>
      );
    }

    return <span className="text-gray-500 text-sm">–</span>;
  };

  // Table columns
  const columns: Column<Ranking>[] = [
    {
      key: 'rank',
      header: 'Rank',
      align: 'center',
      className: 'w-16 font-bold text-lg',
      render: (value) => <span className="text-blue-600">#{value}</span>,
    },
    {
      key: 'movement',
      header: 'Δ',
      align: 'center',
      className: 'w-16',
      render: (_, row) => getRankMovement(row.rank, row.previousRank),
    },
    {
      key: 'team',
      header: 'Team',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          {row.team.logo && (
            <img src={row.team.logo} alt="" className="w-8 h-8 object-contain" />
          )}
          <div>
            <div className="font-semibold">{row.team.name}</div>
            <div className="text-xs text-gray-600">{row.team.conference}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'record',
      header: 'Record',
      align: 'center',
      sortable: true,
      className: 'font-mono',
    },
    {
      key: 'conferenceRecord',
      header: 'Conf',
      align: 'center',
      className: 'font-mono text-sm',
      render: (value) => value || '–',
    },
    {
      key: 'lastWeekResult',
      header: 'Last Week',
      align: 'center',
      className: 'text-sm',
      render: (value) => value || '–',
    },
    {
      key: 'points',
      header: 'Points',
      align: 'center',
      sortable: true,
      render: (value) => value || '–',
    },
    {
      key: 'firstPlaceVotes',
      header: '1st',
      align: 'center',
      className: 'text-sm',
      render: (value) => (value || 0) > 0 ? value : '–',
    },
  ];

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
        <LoadingState message="Loading rankings..." />
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
                  fetchRankings();
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
            <h1 className="text-3xl md:text-4xl font-bold">D1Baseball Top 25 Rankings</h1>
            <p className="text-blue-100 mt-2">
              Complete college baseball rankings updated weekly
            </p>
          </div>
        </div>

        {/* Rankings Table */}
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle>Top 25 Rankings</CardTitle>
                {meta && (
                  <div className="text-sm text-gray-600">
                    Updated: {formatLastUpdated()} CT
                    {meta.cached && ' (Cached)'}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {rankings.length > 0 ? (
                <Table
                  data={rankings}
                  columns={columns}
                  striped
                  className="text-sm"
                  mobileResponsive
                />
              ) : (
                <p className="text-center text-gray-600 py-12">
                  No rankings available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          {meta && (
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-3xl font-bold text-blue-600">{meta.count}</div>
                  <div className="text-gray-600 mt-2">Teams Ranked</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {rankings.filter(r => r.previousRank && r.rank < r.previousRank).length}
                  </div>
                  <div className="text-gray-600 mt-2">Teams Moving Up</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center py-6">
                  <div className="text-3xl font-bold text-blue-600">
                    {rankings.filter(r => r.previousRank && r.rank > r.previousRank).length}
                  </div>
                  <div className="text-gray-600 mt-2">Teams Moving Down</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Data Attribution */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Data Source: {meta?.dataSource} |{' '}
              Rankings updated weekly on Mondays
            </p>
            <p className="mt-2">
              <Link to="/college-baseball" className="text-blue-600 hover:underline">
                ← Back to College Baseball
              </Link>
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CollegeBaseballRankings;
