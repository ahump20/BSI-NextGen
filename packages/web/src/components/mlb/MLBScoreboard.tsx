'use client';

import { useMemo } from 'react';
import type { Game } from '@bsi/shared';
import { MLBScoreCard } from './MLBScoreCard';

interface MLBScoreboardProps {
  games: Game[];
  lastUpdated?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const statusPriority: Record<Game['status'], number> = {
  live: 0,
  scheduled: 1,
  final: 2,
  postponed: 3,
  cancelled: 4,
};

export function MLBScoreboard({ games, lastUpdated, onRefresh, refreshing }: MLBScoreboardProps) {
  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => {
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [games]);

  const summary = useMemo(() => {
    const live = games.filter(game => game.status === 'live').length;
    const finals = games.filter(game => game.status === 'final').length;
    const scheduled = games.filter(game => game.status === 'scheduled').length;

    return { live, finals, scheduled };
  }, [games]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(lastUpdated));
  }, [lastUpdated]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold">MLB Real-Time Scoreboard</h2>
          <p className="text-sm text-gray-400">
            Powered by the official MLB Stats API with automatic refresh every 30 seconds.
          </p>
          {formattedLastUpdated && (
            <p className="text-xs text-gray-500">Last updated {formattedLastUpdated} CT</p>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="self-start sm:self-auto inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold transition-colors"
          >
            {refreshing && (
              <span className="inline-block w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
            )}
            {refreshing ? 'Refreshing…' : 'Refresh now'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-400">Live</p>
          <p className="mt-1 text-2xl font-bold text-red-300">{summary.live}</p>
          <p className="text-[11px] text-gray-500">Games currently in progress</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-400">Scheduled</p>
          <p className="mt-1 text-2xl font-bold text-blue-300">{summary.scheduled}</p>
          <p className="text-[11px] text-gray-500">Upcoming first pitch times</p>
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-900/80 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-gray-400">Final</p>
          <p className="mt-1 text-2xl font-bold text-green-300">{summary.finals}</p>
          <p className="text-[11px] text-gray-500">Completed matchups today</p>
        </div>
      </div>

      <div className="grid gap-4">
        {sortedGames.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 text-center text-sm text-gray-400">
            No MLB games scheduled today. Check back tomorrow for fresh data.
          </div>
        ) : (
          sortedGames.map(game => <MLBScoreCard key={game.id} game={game} />)
        )}
      </div>
    </section>
  );
}
