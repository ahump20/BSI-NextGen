import { NarrativeInsight } from '@/lib/api';

const badgeStyles: Record<NarrativeInsight['impact'], string> = {
  high: 'bg-red-500/20 text-red-200',
  medium: 'bg-accent/20 text-accent',
  low: 'bg-primary-500/10 text-primary-200'
};

export function NarrativeFeed({ items }: { items: NarrativeInsight[] }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/5/10 p-6 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Narrative Engine</p>
          <h3 className="font-display text-xl text-white">Real-time storylines</h3>
        </div>
      </header>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">{item.headline}</h4>
              <span className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${badgeStyles[item.impact]}`}>
                {item.impact} impact
              </span>
            </div>
            <p className="text-sm text-white/70">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
