import { useState, useEffect } from 'react';
import './ChampionshipDashboard.css';

interface TeamStats {
  teamId: string;
  teamName: string;
  sport: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  recentForm?: number[];
  strengthOfSchedule?: number;
  injuryImpact?: number;
}

interface SimulationResult {
  teamId: string;
  teamName: string;
  sport: string;
  simulations: number;
  projectedWins: number;
  projectedLosses: number;
  playoffProbability: number;
  divisionWinProbability: number;
  championshipProbability: number;
  confidenceInterval: {
    lower: number;
    median: number;
    upper: number;
  };
  metadata: {
    timestamp: string;
    pythagoreanExpectation: number;
  };
}

interface CardinalsStanding {
  team: {
    id: number;
    name: string;
  };
  wins: number;
  losses: number;
  winningPercentage: number;
  divisionRank: number;
  runsScored: number;
  runsAllowed: number;
  runDifferential: number;
  streak?: {
    streakCode: string;
  };
}

export function ChampionshipDashboard() {
  const [standings, setStandings] = useState<CardinalsStanding | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'https://d6cc014d.sandlot-sluggers.pages.dev/api';

  useEffect(() => {
    loadChampionshipData();
  }, []);

  async function loadChampionshipData() {
    setLoading(true);
    setError(null);

    try {
      // Fetch Cardinals standings
      const standingsResponse = await fetch(`${API_BASE_URL}/mlb/cardinals?type=standings`);
      if (!standingsResponse.ok) {
        throw new Error('Failed to fetch Cardinals standings');
      }
      const standingsData = await standingsResponse.json();
      setStandings(standingsData.standings);

      // Build team stats for Monte Carlo simulation
      const teamStats: TeamStats = {
        teamId: '138',
        teamName: 'St. Louis Cardinals',
        sport: 'MLB',
        wins: standingsData.standings.wins || 78,
        losses: standingsData.standings.losses || 84,
        pointsFor: standingsData.standings.runsScored || 689,
        pointsAgainst: standingsData.standings.runsAllowed || 754,
        recentForm: [0, 0, 0, 0, 1], // Recent games (0=loss, 1=win)
        strengthOfSchedule: 0.50,
        injuryImpact: 1.0,
      };

      // Fetch Monte Carlo simulation
      const simulationResponse = await fetch(`${API_BASE_URL}/simulations/monte-carlo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamStats,
          schedule: [],
          simulations: 10000,
        }),
      });

      if (!simulationResponse.ok) {
        throw new Error('Failed to run Monte Carlo simulation');
      }

      const simulationData = await simulationResponse.json();
      setSimulation(simulationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load championship data');
    } finally {
      setLoading(false);
    }
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  function getStreakDisplay(streak?: { streakCode: string }): string {
    if (!streak?.streakCode) return '-';
    return streak.streakCode;
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>⚾ Cardinals Championship Dashboard</h2>
        <button onClick={loadChampionshipData} className="refresh-button" disabled={loading}>
          {loading ? 'Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Cardinals championship probabilities...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={loadChampionshipData} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && standings && simulation && (
        <div className="championship-content">
          {/* Current Standings Card */}
          <div className="stats-card">
            <h3>Current Season</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Record</span>
                <span className="stat-value">
                  {standings.wins}-{standings.losses}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Win %</span>
                <span className="stat-value">{standings.winningPercentage.toFixed(3)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Division Rank</span>
                <span className="stat-value">{standings.divisionRank}th in NL Central</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Run Differential</span>
                <span className="stat-value">{standings.runDifferential > 0 ? '+' : ''}
                  {standings.runDifferential}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Streak</span>
                <span className="stat-value">{getStreakDisplay(standings.streak)}</span>
              </div>
            </div>
          </div>

          {/* Projections Card */}
          <div className="stats-card">
            <h3>Monte Carlo Projections</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Projected Final Record</span>
                <span className="stat-value">
                  {simulation.projectedWins.toFixed(1)}-{simulation.projectedLosses.toFixed(1)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pythagorean Expectation</span>
                <span className="stat-value">
                  {formatPercentage(simulation.metadata.pythagoreanExpectation)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Confidence Interval</span>
                <span className="stat-value">
                  {simulation.confidenceInterval.lower.toFixed(0)}-
                  {simulation.confidenceInterval.upper.toFixed(0)} wins
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Simulations Run</span>
                <span className="stat-value">{simulation.simulations.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Championship Probabilities */}
          <div className="probabilities-card">
            <h3>Championship Probabilities</h3>

            <div className="probability-item">
              <div className="probability-header">
                <span className="probability-label">Playoff Probability</span>
                <span className="probability-value">
                  {formatPercentage(simulation.playoffProbability)}
                </span>
              </div>
              <div className="probability-bar-container">
                <div
                  className="probability-bar playoff"
                  style={{ width: `${simulation.playoffProbability}%` }}
                />
              </div>
            </div>

            <div className="probability-item">
              <div className="probability-header">
                <span className="probability-label">Division Win Probability</span>
                <span className="probability-value">
                  {formatPercentage(simulation.divisionWinProbability)}
                </span>
              </div>
              <div className="probability-bar-container">
                <div
                  className="probability-bar division"
                  style={{ width: `${simulation.divisionWinProbability}%` }}
                />
              </div>
            </div>

            <div className="probability-item">
              <div className="probability-header">
                <span className="probability-label">World Series Championship</span>
                <span className="probability-value">
                  {formatPercentage(simulation.championshipProbability)}
                </span>
              </div>
              <div className="probability-bar-container">
                <div
                  className="probability-bar championship"
                  style={{ width: `${simulation.championshipProbability}%` }}
                />
              </div>
            </div>
          </div>

          {/* Data Sources */}
          <div className="metadata-footer">
            <p className="data-source">
              Data Source: MLB Stats API • Simulations: Monte Carlo (10,000 iterations)
            </p>
            <p className="last-updated">
              Last Updated: {new Date(simulation.metadata.timestamp).toLocaleString('en-US', {
                timeZone: 'America/Chicago',
                dateStyle: 'medium',
                timeStyle: 'short',
              })} CST
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
