interface Narrative {
  title: string;
  body: string;
  tone?: 'positive' | 'neutral' | 'warning';
}

interface NarrativePanelProps {
  narratives: Narrative[];
}

const toneStyles: Record<NonNullable<Narrative['tone']>, string> = {
  positive: 'bg-data-green/10 text-data-green',
  neutral: 'bg-surface-strong text-data-primary',
  warning: 'bg-data-orange/10 text-data-orange',
};

export function NarrativePanel({ narratives }: NarrativePanelProps) {
  if (!narratives.length) {
    return null;
  }

  return (
    <section aria-labelledby="narratives-heading" className="rounded-2xl border border-border/80 bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
        <div>
          <h2 id="narratives-heading" className="text-base font-semibold text-data-primary">Storylines</h2>
          <p className="text-sm text-muted-foreground">Narrative panels tuned for broadcast-ready context.</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-data-purple/10 px-2.5 py-1 text-xs font-semibold text-data-purple">
          Narrative mode
        </span>
      </div>

      <div className="grid gap-3 px-4 py-4 lg:grid-cols-2" role="list">
        {narratives.map((note, index) => (
          <article
            key={`${note.title}-${index}`}
            className="rounded-xl border border-border/70 bg-surface-strong px-4 py-3 shadow-sm"
            role="listitem"
          >
            <div className="flex items-center gap-2">
              {note.tone && <span className={`inline-flex h-2 w-2 rounded-full ${toneStyles[note.tone]}`} aria-hidden />}
              <h3 className="text-sm font-semibold text-data-primary">{note.title}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export type { Narrative };
