import type { Standing } from '@bsi/shared';

interface StandingsPanelProps {
  standings: Standing[];
  accent: string;
}

export function StandingsPanel({ standings, accent }: StandingsPanelProps) {
  const ordered = [...standings].sort((a, b) => b.winPercentage - a.winPercentage).slice(0, 8);

  return (
    <section aria-labelledby="standings-heading" className="rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <h2 id="standings-heading" className="text-base font-semibold text-data-primary">Standings Pulse</h2>
          <p className="text-sm text-muted-foreground">Top clubs by win percentage and streak.</p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${accent}`}>
          Auto-refresh
        </span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-border/80" role="grid">
          <thead className="bg-surface-strong/60 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">Team</th>
              <th scope="col" className="px-4 py-3 text-right">W</th>
              <th scope="col" className="px-4 py-3 text-right">L</th>
              <th scope="col" className="px-4 py-3 text-right">Win %</th>
              <th scope="col" className="px-4 py-3 text-right">Streak</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-sm">
            {ordered.map((row, index) => (
              <tr key={row.team.id} className="hover:bg-surface-strong/60 focus-within:bg-surface-strong/60">
                <th scope="row" className="px-4 py-3 text-left font-semibold text-data-primary">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{index + 1}.</span>
                    <span className="truncate" title={row.team.name}>
                      {row.team.name}
                    </span>
                  </div>
                </th>
                <td className="px-4 py-3 text-right tabular-nums">{row.wins}</td>
                <td className="px-4 py-3 text-right tabular-nums">{row.losses}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">{row.winPercentage.toFixed(3)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{row.streak || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
