'use client';

import { useEffect, useState } from 'react';
import type { Game, Standing } from '@bsi/shared';
import { GameCard } from '../components/GameCard';
import { StandingsTable } from '../components/StandingsTable';
import { SportTabs } from '../components/SportTabs';

export default function HomePage() {
  const [selectedSport, setSelectedSport] = useState<'MLB' | 'NFL' | 'NBA' | 'NCAA_FOOTBALL' | 'COLLEGE_BASEBALL'>('COLLEGE_BASEBALL');
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch games
        const gamesRes = await fetch(`/api/sports/${selectedSport.toLowerCase()}/games`);
        if (!gamesRes.ok) throw new Error('Failed to fetch games');
        const gamesData = await gamesRes.json();
        setGames(gamesData.data || []);

        // Fetch standings
        const standingsRes = await fetch(`/api/sports/${selectedSport.toLowerCase()}/standings`);
        if (!standingsRes.ok) throw new Error('Failed to fetch standings');
        const standingsData = await standingsRes.json();
        setStandings(standingsData.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh every 30 seconds for live games
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, [selectedSport]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-3xl font-bold mb-2">
          Real-Time Sports Intelligence
        </h2>
        <p className="text-gray-400 mb-4">
          Mobile-first. Real data from official APIs. No placeholders.
        </p>
        <p className="text-sm text-orange-500 mb-6">
          <strong>PRIORITY:</strong> College Baseball - Complete box scores that ESPN refuses to show
        </p>
      </section>

      <SportTabs
        selectedSport={selectedSport}
        onSelectSport={setSelectedSport}
      />

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading real data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400">Error: {error}</p>
          <p className="text-sm text-gray-400 mt-2">
            Check that API keys are configured and services are available.
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="sport-card">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="live-indicator"></span>
              Live & Recent Games
            </h3>
            {games.length === 0 ? (
              <p className="text-gray-400">No games available for this sport today.</p>
            ) : (
              <div className="space-y-3">
                {games.slice(0, 10).map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </section>

          <section className="sport-card">
            <h3 className="text-xl font-bold mb-4">Standings</h3>
            {standings.length === 0 ? (
              <p className="text-gray-400">No standings available for this sport.</p>
            ) : (
              <StandingsTable standings={standings} sport={selectedSport} />
            )}
          </section>

          {selectedSport === 'COLLEGE_BASEBALL' && games.length > 0 && (
            <section className="sport-card">
              <h3 className="text-xl font-bold mb-4 text-orange-500">
                🔥 ESPN Gap Filled: Full Box Scores
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                ESPN only shows the score and inning. We show batting lines, pitching lines,
                and complete game statistics - everything ESPN refuses to provide.
              </p>
              <div className="text-sm text-green-400">
                ✓ Complete batting statistics for all players
                <br />
                ✓ Full pitching lines with IP, H, R, ER, BB, K
                <br />
                ✓ Game recaps and previews
                <br />
                ✓ Conference standings with complete records
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
