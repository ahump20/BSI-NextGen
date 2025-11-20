'use client';

import type { Game, PitcherInfo } from '@bsi/shared';

interface MLBScoreCardProps {
  game: Game;
}

const statusStyles: Record<Game['status'], string> = {
  live: 'bg-red-500/20 text-red-300 border border-red-500/30',
  final: 'bg-green-500/20 text-green-300 border border-green-500/30',
  scheduled: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  postponed: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  cancelled: 'bg-gray-600/30 text-gray-300 border border-gray-600/40',
};

const statusLabels: Record<Game['status'], string> = {
  live: 'Live',
  final: 'Final',
  scheduled: 'Scheduled',
  postponed: 'Postponed',
  cancelled: 'Cancelled',
};

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

const ordinal = (value: number) => {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }
  const suffix = suffixes[value % 10] ?? 'th';
  return `${value}${suffix}`;
};

const formatPitcher = (label: string, pitcher?: PitcherInfo) => {
  if (!pitcher) {
    return (
      <div className="flex flex-col text-xs sm:text-sm text-gray-500">
        <span className="font-medium text-gray-400">{label}</span>
        <span className="text-gray-500">TBD</span>
      </div>
    );
  }

  const pieces: string[] = [pitcher.name];
  if (pitcher.throws) {
    pieces.push(`(${pitcher.throws})`);
  }

  const recordParts: string[] = [];
  if (typeof pitcher.wins === 'number' && typeof pitcher.losses === 'number') {
    recordParts.push(`${pitcher.wins}-${pitcher.losses}`);
  }
  if (typeof pitcher.era === 'number') {
    recordParts.push(`${pitcher.era.toFixed(2)} ERA`);
  }

  const subtitle = recordParts.join(' · ');

  return (
    <div className="flex flex-col text-xs sm:text-sm">
      <span className="font-medium text-gray-200">{label}</span>
      <span className="text-gray-300">{pieces.join(' ')}</span>
      {subtitle && <span className="text-gray-400">{subtitle}</span>}
    </div>
  );
};

export function MLBScoreCard({ game }: MLBScoreCardProps) {
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';

  const inningLabel = (() => {
    if (game.linescore?.currentInning) {
      const base = ordinal(game.linescore.currentInning);
      if (game.linescore.inningState) {
        return `${game.linescore.inningState} ${base}`;
      }
      return base;
    }
    if (game.period) {
      return game.period;
    }
    return undefined;
  })();

  return (
    <article className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 shadow-xl backdrop-blur-sm">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${statusStyles[game.status]}`}>
            {statusLabels[game.status]}
          </span>
          {inningLabel && isLive && (
            <span className="text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-full">
              {inningLabel}
            </span>
          )}
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>{formatTime(game.date)}</p>
          {!isLive && game.broadcasters?.length && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              {game.broadcasters.join(', ')}
            </p>
          )}
        </div>
      </header>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              {game.awayTeam.abbreviation || game.awayTeam.name}
            </span>
            <span className="text-xs text-gray-500">{game.awayTeam.city}</span>
          </div>
          <span className={`text-3xl font-bold ${isFinal && game.awayScore > game.homeScore ? 'text-green-400' : 'text-gray-100'}`}>
            {game.awayScore}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
              {game.homeTeam.abbreviation || game.homeTeam.name}
            </span>
            <span className="text-xs text-gray-500">{game.homeTeam.city}</span>
          </div>
          <span className={`text-3xl font-bold ${isFinal && game.homeScore > game.awayScore ? 'text-green-400' : 'text-gray-100'}`}>
            {game.homeScore}
          </span>
        </div>
      </div>

      {game.linescore?.innings?.length ? (
        <div className="mt-5">
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="min-w-full text-xs">
              <thead className="uppercase text-[11px] tracking-wide text-gray-400">
                <tr>
                  <th className="text-left py-1">Team</th>
                  {game.linescore.innings.map(inning => (
                    <th key={inning.number} className="text-center px-1">
                      {inning.number}
                    </th>
                  ))}
                  <th className="text-center px-2">R</th>
                  <th className="text-center px-2">H</th>
                  <th className="text-center px-2">E</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-gray-800/60">
                  <td className="py-2 text-sm font-medium text-gray-200">
                    {game.awayTeam.abbreviation || game.awayTeam.name}
                  </td>
                  {game.linescore.innings.map(inning => (
                    <td key={`away-${inning.number}`} className="text-center text-sm text-gray-300">
                      {inning.away ?? '—'}
                    </td>
                  ))}
                  <td className="text-center font-semibold text-gray-100">
                    {game.linescore.totals.away.runs}
                  </td>
                  <td className="text-center text-gray-300">
                    {game.linescore.totals.away.hits}
                  </td>
                  <td className="text-center text-gray-300">
                    {game.linescore.totals.away.errors}
                  </td>
                </tr>
                <tr className="border-t border-gray-800/60">
                  <td className="py-2 text-sm font-medium text-gray-200">
                    {game.homeTeam.abbreviation || game.homeTeam.name}
                  </td>
                  {game.linescore.innings.map(inning => (
                    <td key={`home-${inning.number}`} className="text-center text-sm text-gray-300">
                      {inning.home ?? '—'}
                    </td>
                  ))}
                  <td className="text-center font-semibold text-gray-100">
                    {game.linescore.totals.home.runs}
                  </td>
                  <td className="text-center text-gray-300">
                    {game.linescore.totals.home.hits}
                  </td>
                  <td className="text-center text-gray-300">
                    {game.linescore.totals.home.errors}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {isScheduled && game.probablePitchers && (game.probablePitchers.home || game.probablePitchers.away) ? (
        <div className="mt-5 bg-gray-900/60 border border-gray-800 rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">
            Probable Pitchers
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formatPitcher('Away', game.probablePitchers.away)}
            {formatPitcher('Home', game.probablePitchers.home)}
          </div>
        </div>
      ) : null}

      {game.broadcasters?.length ? (
        <div className="mt-4 text-xs text-gray-400 flex items-center gap-2">
          <span className="uppercase tracking-wide text-gray-500">Broadcast</span>
          <span className="text-gray-300">{game.broadcasters.join(', ')}</span>
        </div>
      ) : null}

      {game.venue && (
        <div className="mt-2 text-xs text-gray-500">
          {game.venue}
        </div>
      )}
    </article>
  );
}
