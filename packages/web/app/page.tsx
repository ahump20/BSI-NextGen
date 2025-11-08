import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { SiteHeader } from '@/components/site-header';
import { LiveGameCard } from '@/components/live-game-card';
import { TeamMetricCard } from '@/components/team-metric-card';
import { NarrativeFeed } from '@/components/narrative-feed';
import { PlayerSpotlightGrid } from '@/components/player-spotlight';
import { fetchDashboardData } from '@/lib/api';

export default async function HomePage() {
  const data = await fetchDashboardData();
  const [primaryGame, secondaryGame] = data.games;

  return (
    <div className="space-y-12">
      <SiteHeader />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-primary-500/15 via-slate-950 to-slate-900 p-8 shadow-card">
          <p className="text-xs uppercase tracking-[0.3em] text-primary-200">Cloudflare-Powered Intelligence</p>
          <h1 className="mt-4 max-w-2xl font-display text-5xl text-white sm:text-6xl">
            Court-side decisions driven by live analytics & edge caching.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70">
            BlazeSportsIntel fuses D1 analytics, KV-cached narratives, and R2-hosted media into a single pane of glass. Every
            possession becomes actionable, every storyline captured in real time.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-primary-400"
            >
              Launch Live Dashboard
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/teams/atl"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/80 hover:border-primary-400 hover:text-primary-100"
            >
              Explore Team Intel
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          {primaryGame && <LiveGameCard game={primaryGame} />}
          {secondaryGame && <LiveGameCard game={secondaryGame} />}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {data.teams.map((team) => (
            <TeamMetricCard key={team.id} team={team} />
          ))}
        </div>
        <NarrativeFeed items={data.narratives} />
      </section>

      <PlayerSpotlightGrid players={data.spotlights} />
    </div>
  );
}
