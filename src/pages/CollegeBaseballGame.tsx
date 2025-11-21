/**
 * College Baseball Game Page
 * Displays complete box score with batting lines, pitching lines, and line score
 *
 * This fills ESPN's massive gap - they only show final scores for college baseball,
 * with NO box scores, NO player stats, NO recaps. This provides the full experience
 * that serious college baseball fans deserve.
 *
 * Mobile-first, accessible, real-time updates during live games.
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BoxScore, {
  TeamBoxScore,
  PlayerBattingStats,
  PlayerPitchingStats,
} from '../components/sports/BoxScore';
import LoadingState from '../components/common/LoadingState';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Card, { CardHeader, CardTitle, CardContent } from '../components/primitives/Card';

interface NCAABoxScoreResponse {
  game: {
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
  };
  homeInnings: number[];
  awayInnings: number[];
  homeBatting: any[];
  awayBatting: any[];
  homePitching: any[];
  awayPitching: any[];
  homeHits: number;
  awayHits: number;
  homeErrors: number;
  awayErrors: number;
  meta: {
    cached: boolean;
    lastUpdated: string;
    timezone: string;
    dataSource: string;
  };
}

const CollegeBaseballGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boxScore, setBoxScore] = useState<NCAABoxScoreResponse | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch box score from API
  const fetchBoxScore = async () => {
    try {
      const response = await fetch(
        `https://blazesportsintel.com/api/college-baseball/games/${gameId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch game: ${response.status} ${response.statusText}`);
      }

      const data: NCAABoxScoreResponse = await response.json();
      setBoxScore(data);
      setError(null);

      // Stop auto-refresh if game is final
      if (data.game.status === 'final') {
        setAutoRefresh(false);
      }
    } catch (err) {
      console.error('Failed to fetch box score:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (gameId) {
      fetchBoxScore();
    }
  }, [gameId]);

  // Auto-refresh every 30 seconds for live games
  useEffect(() => {
    if (!autoRefresh || !gameId) return;

    const interval = setInterval(() => {
      fetchBoxScore();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, gameId]);

  // Transform API data to BoxScore component format
  const transformToBoxScoreFormat = (): {
    homeTeam: TeamBoxScore;
    awayTeam: TeamBoxScore;
    homeBatting: PlayerBattingStats[];
    awayBatting: PlayerBattingStats[];
    homePitching: PlayerPitchingStats[];
    awayPitching: PlayerPitchingStats[];
  } | null => {
    if (!boxScore) return null;

    const { game, homeInnings, awayInnings, homeBatting, awayBatting, homePitching, awayPitching, homeHits, awayHits, homeErrors, awayErrors } = boxScore;

    return {
      homeTeam: {
        teamName: game.homeTeam.name,
        teamLogo: game.homeTeam.logo,
        innings: homeInnings.map((runs, index) => ({
          inning: index + 1,
          runs,
        })),
        runs: game.homeScore,
        hits: homeHits,
        errors: homeErrors,
      },
      awayTeam: {
        teamName: game.awayTeam.name,
        teamLogo: game.awayTeam.logo,
        innings: awayInnings.map((runs, index) => ({
          inning: index + 1,
          runs,
        })),
        runs: game.awayScore,
        hits: awayHits,
        errors: awayErrors,
      },
      homeBatting: homeBatting.map((b) => ({
        name: b.playerName,
        position: b.position,
        atBats: b.atBats,
        runs: b.runs,
        hits: b.hits,
        rbi: b.rbi,
        walks: b.walks,
        strikeouts: b.strikeouts,
        average: b.average,
      })),
      awayBatting: awayBatting.map((b) => ({
        name: b.playerName,
        position: b.position,
        atBats: b.atBats,
        runs: b.runs,
        hits: b.hits,
        rbi: b.rbi,
        walks: b.walks,
        strikeouts: b.strikeouts,
        average: b.average,
      })),
      homePitching: homePitching.map((p) => ({
        name: p.playerName,
        inningsPitched: p.inningsPitched,
        hits: p.hits,
        runs: p.runs,
        earnedRuns: p.earnedRuns,
        walks: p.walks,
        strikeouts: p.strikeouts,
        era: p.era,
      })),
      awayPitching: awayPitching.map((p) => ({
        name: p.playerName,
        inningsPitched: p.inningsPitched,
        hits: p.hits,
        runs: p.runs,
        earnedRuns: p.earnedRuns,
        walks: p.walks,
        strikeouts: p.strikeouts,
        era: p.era,
      })),
    };
  };

  // Format game date
  const formatGameDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Get status display text
  const getStatusText = (): string => {
    if (!boxScore) return '';

    const { game } = boxScore;

    switch (game.status) {
      case 'in_progress':
        return `${game.inning ? `${game.inning}th Inning` : 'In Progress'} • LIVE`;
      case 'final':
        return 'Final';
      case 'postponed':
        return 'Postponed';
      case 'scheduled':
        return 'Scheduled';
      default:
        return game.status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingState message="Loading box score..." />
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
                  fetchBoxScore();
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

  if (!boxScore) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <p className="text-center text-gray-600 py-12">No game data found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const boxScoreData = transformToBoxScoreFormat();

  if (!boxScoreData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <p className="text-center text-gray-600 py-12">Failed to load box score</p>
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {boxScore.game.awayTeam.school} at {boxScore.game.homeTeam.school}
                </h1>
                <p className="text-blue-100 mt-1">
                  {formatGameDate(boxScore.game.gameDate)} • {boxScore.game.venue}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${
                  boxScore.game.status === 'in_progress'
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-blue-700'
                }`}>
                  {getStatusText()}
                </div>
                {boxScore.game.status === 'in_progress' && (
                  <p className="text-xs text-blue-100 mt-2">
                    Auto-refreshing every 30 seconds
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Box Score */}
        <div className="container mx-auto px-4 py-8">
          <BoxScore
            homeTeam={boxScoreData.homeTeam}
            awayTeam={boxScoreData.awayTeam}
            homeBatting={boxScoreData.homeBatting}
            awayBatting={boxScoreData.awayBatting}
            homePitching={boxScoreData.homePitching}
            awayPitching={boxScoreData.awayPitching}
            gameStatus={getStatusText()}
            venue={boxScore.game.venue}
            date={formatGameDate(boxScore.game.gameDate)}
          />

          {/* Data Attribution */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Data Source: {boxScore.meta.dataSource} |{' '}
              Last Updated: {new Date(boxScore.meta.lastUpdated).toLocaleString('en-US', {
                timeZone: 'America/Chicago',
                hour: 'numeric',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })} CT
              {boxScore.meta.cached && ' (Cached)'}
            </p>
            <p className="mt-2 text-xs">
              <strong>Why We Built This:</strong> ESPN literally shows only final scores for college baseball
              with NO box scores, NO player stats, and NO recaps. This is our answer to that gap.
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default CollegeBaseballGame;
