'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Game, Standing } from '@bsi/shared';
import { MLBScoreboard } from '../../components/mlb/MLBScoreboard';
import { StandingsTable } from '../../components/StandingsTable';

export default function MLBPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [gamesRes, standingsRes] = await Promise.all([
        fetch('/api/sports/mlb/games'),
        fetch('/api/sports/mlb/standings'),
      ]);

      if (!gamesRes.ok) {
        throw new Error('Failed to load MLB games');
      }
      if (!standingsRes.ok) {
        throw new Error('Failed to load MLB standings');
      }

      const gamesData = await gamesRes.json();
      const standingsData = await standingsRes.json();

      setGames(Array.isArray(gamesData.data) ? gamesData.data : []);
      setStandings(Array.isArray(standingsData.data) ? standingsData.data : []);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const standingsPreview = useMemo(() => standings.slice(0, 12), [standings]);

  return (
    <div className="space-y-6">
      <section className="sport-card">
        <h1 className="text-3xl sm:text-4xl font-bold">Major League Baseball Command Center</h1>
        <p className="mt-2 text-gray-300 text-sm sm:text-base">
          Track every MLB game in real time with inning-by-inning scoring, probable pitchers,
          and authenticated data direct from the MLB Stats API.
        </p>
        <p className="mt-3 text-xs uppercase tracking-wide text-orange-400">
          Fast, mobile-first scoreboard with 30-second live refreshes.
        </p>
      </section>

      {loading ? (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-10 text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Pulling live MLB schedule and standings…</p>
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-500/60 rounded-xl p-5 text-sm text-red-200">
          <p className="font-semibold">We hit a snag.</p>
          <p className="mt-1 text-red-100">{error}</p>
          <p className="mt-3 text-xs text-red-200/80">
            Confirm MLB Stats API availability and Blaze Sports Intel service credentials.
          </p>
        </div>
      ) : (
        <>
          <MLBScoreboard
            games={games}
            lastUpdated={lastUpdated}
            onRefresh={() => fetchData(true)}
            refreshing={refreshing}
          />

          <section className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">League Standings Snapshot</h2>
                <p className="text-sm text-gray-400">
                  Updated straight from the MLB Stats API. We surface the latest win-loss records and streaks.
                </p>
              </div>
              <span className="text-xs text-gray-500">Showing {standingsPreview.length} of {standings.length} teams</span>
            </div>
            <StandingsTable standings={standingsPreview} sport="MLB" />
          </section>
        </>
      )}
    </div>
  );
}
