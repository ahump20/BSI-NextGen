interface LeaderHighlight {
  name: string;
  role: string;
  metric: string;
  badge?: string;
}

interface LeadersPanelProps {
  leaders: LeaderHighlight[];
}

export function LeadersPanel({ leaders }: LeadersPanelProps) {
  if (!leaders.length) {
    return null;
  }

  return (
    <section aria-labelledby="leaders-heading" className="rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <h2 id="leaders-heading" className="text-base font-semibold text-data-primary">Leaders to Watch</h2>
          <p className="text-sm text-muted-foreground">Key performers surfaced from live games and trends.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-surface-strong px-2.5 py-1 text-xs font-semibold text-data-primary">
          Player focus
        </span>
      </div>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-2" role="list">
        {leaders.map(leader => (
          <article
            key={`${leader.name}-${leader.role}`}
            className="flex flex-col gap-2 rounded-xl border border-border/70 bg-surface-strong px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-data-blue"
            role="listitem"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-data-primary">{leader.name}</h3>
                <p className="text-xs text-muted-foreground">{leader.role}</p>
              </div>
              {leader.badge && (
                <span className="inline-flex items-center rounded-full bg-data-blue/10 px-2.5 py-1 text-xs font-semibold text-data-blue">
                  {leader.badge}
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-data-primary">{leader.metric}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export type { LeaderHighlight };
