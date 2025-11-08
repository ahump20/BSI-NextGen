import { GameSummary } from '@/lib/api';
import { format, parseISO } from 'date-fns';

function formatStatus(game: GameSummary) {
  if (game.status === 'live') return 'LIVE';
  if (game.status === 'final') return 'FINAL';
  return format(parseISO(game.startTime), 'h:mm a zzz');
}

export function LiveGameCard({ game }: { game: GameSummary }) {
  return (
    <article className="flex flex-col rounded-2xl border border-white/5 bg-white/5/10 bg-gradient-to-br from-white/5 to-white/10 p-6 shadow-card">
      <header className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60">
        <span>{game.league}</span>
        <span className="rounded-full bg-primary-500/10 px-3 py-1 font-semibold text-primary-200">{formatStatus(game)}</span>
      </header>
      <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-left">
          <p className="text-xs uppercase text-white/60">Away</p>
          <p className="font-display text-2xl text-white">{game.awayTeam}</p>
        </div>
        <div className="text-center font-display text-5xl text-primary-200">
          {game.score.home} : {game.score.away}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase text-white/60">Home</p>
          <p className="font-display text-2xl text-white">{game.homeTeam}</p>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-xs text-white/70">
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="uppercase tracking-wider text-white/50">Venue</dt>
          <dd className="mt-1 font-medium text-white/80">{game.venue}</dd>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="uppercase tracking-wider text-white/50">Projected Pace</dt>
          <dd className="mt-1 font-medium text-white/80">{game.pace.toFixed(1)}</dd>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="uppercase tracking-wider text-white/50">Win Prob</dt>
          <dd className="mt-1 font-medium text-white/80">{(game.winProbability * 100).toFixed(0)}%</dd>
        </div>
      </dl>
    </article>
  );
}
