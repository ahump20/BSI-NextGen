import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { getMockDashboard, type TeamMetric } from '@/lib/api';

const TEAMS: Record<string, TeamMetric> = getMockDashboard().teams.reduce(
  (acc, team) => {
    acc[team.id] = team;
    return acc;
  },
  {} as Record<string, TeamMetric>
);

export const revalidate = 30;

export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  const team = TEAMS[params.teamId];

  if (!team) {
    notFound();
  }

  const metrics = [
    { label: 'Offensive Rating', value: team.offensiveRating },
    { label: 'Defensive Rating', value: team.defensiveRating },
    { label: 'Net Rating', value: team.netRating }
  ];

  return (
    <div className="space-y-12">
      <SiteHeader />
      <section className="rounded-3xl border border-white/5 bg-white/5/10 p-10 shadow-card">
        <p className="text-xs uppercase tracking-[0.3em] text-primary-200">Program dossier</p>
        <h1 className="mt-4 font-display text-4xl text-white">{team.name}</h1>
        <p className="mt-2 text-sm text-white/60">Record: {team.record} • Current streak: {team.streak}</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/5 bg-white/5 p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">{metric.label}</p>
              <p className="mt-3 font-display text-3xl text-primary-100">{metric.value.toFixed(1)}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-2xl border border-white/5 bg-gradient-to-br from-primary-500/10 via-slate-950 to-slate-900 p-6">
            <h2 className="font-display text-2xl text-white">Game Model</h2>
            <p className="mt-2 text-sm text-white/70">
              BlazeSportsIntel simulations project {team.name} to maintain a {team.netRating.toFixed(1)} net rating with pace
              stabilized at 99.8. KV cached adjustments surface opponent coverage gaps instantly, letting coaches call
              precision sets straight from the sideline.
            </p>
          </article>
          <article className="rounded-2xl border border-white/5 bg-white/5 p-6">
            <h2 className="font-display text-2xl text-white">Scouting Signals</h2>
            <ul className="mt-3 space-y-3 text-sm text-white/70">
              <li>Edge cached film packages refresh every 90 seconds via Cloudflare R2 CDN nodes.</li>
              <li>Dynamic player load tracking surfaces fatigue warnings at 32 minutes of high-intensity movement.</li>
              <li>D1 trend detection flags lineup combos exceeding +18 net rating across last 5 games.</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
