import { Standing } from '@bsi/shared';
import { typography } from '@/components/design-system/theme';

interface StandingsPanelProps {
  title: string;
  groups: Record<string, Standing[]>;
  caption?: string;
}

export function StandingsPanel({ title, groups, caption }: StandingsPanelProps) {
  const divisions = Object.keys(groups);

  return (
    <section className="space-y-3" aria-label={`${title} standings`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className={`${typography.heading} text-xl`}>{title}</h2>
          {caption && <p className={`${typography.caption}`}>{caption}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {divisions.map((division) => (
          <div key={division} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <p className="text-sm font-semibold">{division}</p>
              <span className="text-xs text-slate-200">Win %</span>
            </div>
            <div className="overflow-x-auto" role="region" aria-label={`${division} standings table`}>
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Team</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-600">W</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-600">L</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Pct</th>
                    <th scope="col" className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {groups[division].map((row) => (
                    <tr key={row.team.id} className="hover:bg-slate-50 focus-within:bg-slate-50">
                      <th scope="row" className="px-4 py-2 text-sm font-semibold text-slate-900">{row.team.name}</th>
                      <td className="px-4 py-2 text-sm text-right text-slate-700">{row.wins}</td>
                      <td className="px-4 py-2 text-sm text-right text-slate-700">{row.losses}</td>
                      <td className="px-4 py-2 text-sm text-right text-slate-700">{row.winPercentage.toFixed(3)}</td>
                      <td className="px-4 py-2 text-sm text-right text-slate-700">{row.streak ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
