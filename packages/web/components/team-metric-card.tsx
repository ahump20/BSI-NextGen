import { TeamMetric } from '@/lib/api';

function buildPath(values: number[]) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const width = 120;
  const height = 40;
  const step = width / (values.length - 1);
  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / (max - min || 1)) * height;
      return `${index === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

export function TeamMetricCard({ team }: { team: TeamMetric }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5/10 p-6 shadow-card">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Team</p>
          <h3 className="font-display text-xl text-white">{team.name}</h3>
          <p className="text-sm text-white/60">{team.record} • {team.streak}</p>
        </div>
        <svg viewBox="0 0 120 40" className="h-16 w-28">
          <path d={buildPath(team.trend)} fill="none" stroke="url(#grad)" strokeWidth={3} strokeLinecap="round" />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3c73ff" />
              <stop offset="100%" stopColor="#ff9f1c" />
            </linearGradient>
          </defs>
        </svg>
      </header>
      <dl className="grid grid-cols-3 gap-3 text-xs text-white/70">
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="uppercase tracking-wider text-white/50">Off Rtg</dt>
          <dd className="mt-1 text-sm font-semibold text-primary-100">{team.offensiveRating.toFixed(1)}</dd>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="uppercase tracking-wider text-white/50">Def Rtg</dt>
          <dd className="mt-1 text-sm font-semibold text-primary-100">{team.defensiveRating.toFixed(1)}</dd>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <dt className="uppercase tracking-wider text-white/50">Net</dt>
          <dd className="mt-1 text-sm font-semibold text-primary-100">{team.netRating.toFixed(1)}</dd>
        </div>
      </dl>
    </article>
  );
}
