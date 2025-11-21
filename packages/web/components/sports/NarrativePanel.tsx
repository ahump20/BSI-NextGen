import { typography } from '@/components/design-system/theme';

interface NarrativePanelProps {
  title: string;
  summary: string;
  bullets: string[];
}

export function NarrativePanel({ title, summary, bullets }: NarrativePanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-3" aria-label={title}>
      <div>
        <h2 className={`${typography.heading} text-xl`}>{title}</h2>
        <p className={`${typography.body}`}>{summary}</p>
      </div>
      <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
