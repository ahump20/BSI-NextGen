import { useState, useEffect } from 'react';
import { fetchSportsData } from '../services/sportsDataService';
import type { GameData } from '../types';

export function SportsDataDashboard() {
  const [games, setGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState('NFL');

  useEffect(() => {
    loadGames();
  }, [selectedSport]);

  async function loadGames() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSportsData(selectedSport);
      setGames(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load games');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-section">
      <div className="section-header">
        <h2>Live Sports Data</h2>
        <select
          value={selectedSport}
          onChange={(e) => setSelectedSport(e.target.value)}
          className="sport-selector"
        >
          <option value="NFL">NFL</option>
          <option value="NBA">NBA</option>
          <option value="MLB">MLB</option>
          <option value="NHL">NHL</option>
        </select>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading {selectedSport} games...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={loadGames} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && games.length === 0 && (
        <div className="empty-state">
          <p>No games scheduled at this time</p>
        </div>
      )}

      {!loading && !error && games.length > 0 && (
        <div className="games-grid">
          {games.map((game) => (
            <div key={game.id} className="game-card">
              <div className="game-status">{game.status}</div>
              <div className="game-matchup">
                <div className="team">
                  <span className="team-name">{game.awayTeam}</span>
                  <span className="team-score">{game.awayScore ?? '-'}</span>
                </div>
                <div className="vs">@</div>
                <div className="team">
                  <span className="team-name">{game.homeTeam}</span>
                  <span className="team-score">{game.homeScore ?? '-'}</span>
                </div>
              </div>
              <div className="game-time">{game.gameTime}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
