import Image from 'next/image';
import { PlayerSpotlight } from '@/lib/api';

const fallbackImage = '/images/player-placeholder.svg';

export function PlayerSpotlightGrid({ players }: { players: PlayerSpotlight[] }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/5/10 p-6 shadow-card">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Player Lens</p>
        <h3 className="font-display text-xl text-white">Spotlight performers</h3>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {players.map((player) => (
          <article key={player.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-primary-500/40">
              <Image
                src={
                  process.env.NEXT_PUBLIC_ASSETS_BASE_URL
                    ? `${process.env.NEXT_PUBLIC_ASSETS_BASE_URL}/${player.id}.png`
                    : fallbackImage
                }
                alt={`${player.name} headshot`}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized={!process.env.NEXT_PUBLIC_ASSETS_BASE_URL}
              />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.3em] text-primary-200">{player.team}</p>
              <h4 className="font-display text-lg text-white">{player.name}</h4>
              <p className="text-xs text-white/60">{player.position}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px] text-white/70">
                <div>
                  <dt className="uppercase tracking-[0.2em] text-white/40">EFF</dt>
                  <dd className="text-sm font-semibold text-primary-100">{player.efficiency.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em] text-white/40">USG%</dt>
                  <dd className="text-sm font-semibold text-primary-100">{player.usage.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="uppercase tracking-[0.2em] text-white/40">TS%</dt>
                  <dd className="text-sm font-semibold text-primary-100">{player.trueShooting.toFixed(1)}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
