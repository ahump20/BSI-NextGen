'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Game, Standing } from '@bsi/shared';
import { SportPageShell } from '@/components/sports/SportPageShell';
import { LiveTicker } from '@/components/sports/LiveTicker';
import { StandingsPanel } from '@/components/sports/StandingsPanel';
import { NarrativePanel } from '@/components/sports/NarrativePanel';

interface ApiResponse<T> {
  data: T;
  source: {
    provider: string;
    timestamp: string;
    confidence: number;
  };
}

export default function MLBPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');

  useEffect(() => {
    async function fetchMLBData() {
      try {
        setLoading(true);
        setError(null);

        const [gamesRes, standingsRes] = await Promise.all([
          fetch('/api/sports/mlb/games'),
          fetch('/api/sports/mlb/standings'),
        ]);

        if (!gamesRes.ok || !standingsRes.ok) {
          throw new Error('Failed to fetch MLB data');
        }

        const gamesData: ApiResponse<Game[]> = await gamesRes.json();
        const standingsData: ApiResponse<Standing[]> = await standingsRes.json();

        setGames(gamesData.data);
        setStandings(standingsData.data);
      } catch (err) {
        console.error('Error fetching MLB data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load MLB data');
      } finally {
        setLoading(false);
      }
    }

    fetchMLBData();

    const interval = setInterval(fetchMLBData, 30000);
    return () => clearInterval(interval);
  }, []);

  const divisions = {
    all: 'All Divisions',
    'AL East': 'AL East',
    'AL Central': 'AL Central',
    'AL West': 'AL West',
    'NL East': 'NL East',
    'NL Central': 'NL Central',
    'NL West': 'NL West',
  };

  const filteredStandings = selectedDivision === 'all'
    ? standings
    : standings.filter((s) => s.team.division === selectedDivision);

  const groupedStandings = filteredStandings.reduce((acc, standing) => {
    const division = standing.team.division || 'Unknown';
    if (!acc[division]) {
      acc[division] = [];
    }
    acc[division].push(standing);
    return acc;
  }, {} as Record<string, Standing[]>);

  const tickerItems = useMemo(() =>
    games.slice(0, 12).map((game) => ({
      id: game.id,
      label: `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`,
      status: game.status === 'live' ? game.period ?? 'LIVE' : game.status.toUpperCase(),
      detail: `${game.awayScore} - ${game.homeScore}`,
    })),
  [games]);

  const winLeaders = useMemo(() => standings
    .slice()
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 3)
    .map((row) => `${row.team.name} (${row.wins}-${row.losses})`), [standings]);

  return (
    <SportPageShell sport="MLB" tagline="Clubhouse dashboards • live tickers • box scores" accent="blue">
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4" role="presentation">
        <div className="lg:col-span-2">
          <LiveTicker items={tickerItems} onRefresh={() => setGames([...games])} />
        </div>
        <NarrativePanel
          title="Story of the night"
          summary="A data-first digest spotlighting which clubs control the win-probability narrative across the league."
          bullets={winLeaders.length ? winLeaders : ['No contenders available yet.']}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading MLB Data</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="mb-12 space-y-4" aria-label="Today&apos;s games">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-2xl font-bold text-gray-800">
                Today&apos;s Games
              </h2>
              <p className="text-sm text-slate-600">Auto-refreshing every 30s</p>
            </div>

            {games.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No games scheduled today</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          game.status === 'live'
                            ? 'bg-red-100 text-red-800'
                            : game.status === 'final'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {game.status === 'live' ? 'LIVE' : game.status === 'final' ? 'FINAL' : 'SCHEDULED'}
                      </span>
                      {game.period && (
                        <span className="text-sm text-gray-600">{game.period}</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {game.awayTeam.abbreviation}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">
                          {game.awayScore}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {game.homeTeam.abbreviation}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-gray-800">
                          {game.homeScore}
                        </span>
                      </div>
                    </div>

                    {game.linescore && (
                      <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                        <p className="font-semibold text-gray-800">Box score</p>
                        <p>
                          Runs: {game.linescore.totals.away.runs} - {game.linescore.totals.home.runs} · Hits: {game.linescore.totals.away.hits} - {game.linescore.totals.home.hits}
                        </p>
                      </div>
                    )}

                    {game.venue && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-1">
                        <p className="text-sm text-gray-600">
                          Venue: {game.venue}
                        </p>
                        {game.broadcasters && game.broadcasters.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Watch: {game.broadcasters.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Standings</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="division-select" className="text-sm text-gray-600">
                  Filter
                </label>
                <select
                  id="division-select"
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(divisions).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {Object.keys(groupedStandings).length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">No standings data available.</p>
              </div>
            ) : (
              <StandingsPanel
                title="League table"
                caption="Sorted by division to mirror postseason race"
                groups={groupedStandings}
              />
            )}
          </section>
        </>
      )}
    </SportPageShell>
  );
}
