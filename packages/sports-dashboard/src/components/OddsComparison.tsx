import { useState, useEffect } from 'react';
import { fetchOddsData } from '../services/oddsService';
import type { OddsData } from '../types';

export function OddsComparison() {
  const [odds, setOdds] = useState<OddsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState('americanfootball_nfl');

  useEffect(() => {
    loadOdds();
  }, [selectedSport]);

  async function loadOdds() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOddsData(selectedSport);
      setOdds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load odds');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Betting Odds Comparison</h2>
        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          className="sport-selector"
        >
          <option value="americanfootball_nfl">NFL</option>
          <option value="basketball_nba">NBA</option>
          <option value="baseball_mlb">MLB</option>
          <option value="icehockey_nhl">NHL</option>
        </select>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading odds data...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={loadOdds} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && odds.length === 0 && (
        <div className="empty-state">
          <p>No odds available at this time</p>
        </div>
      )}

      {!loading && !error && odds.length > 0 && (
        <div className="odds-list">
          {odds.map((game) => (
            <div key={game.id} className="odds-card">
              <div className="odds-header">
                <h3>{game.homeTeam} vs {game.awayTeam}</h3>
                <span className="game-time">{game.commenceTime}</span>
              </div>
              <div className="bookmakers">
                {game.bookmakers.map((bookmaker, idx) => (
                  <div key={idx} className="bookmaker">
                    <div className="bookmaker-name">{bookmaker.name}</div>
                    <div className="odds-row">
                      <div className="odd">
                        <span className="team-label">Home</span>
                        <span className="odd-value">{bookmaker.homeOdds}</span>
                      </div>
                      <div className="odd">
                        <span className="team-label">Away</span>
                        <span className="odd-value">{bookmaker.awayOdds}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
