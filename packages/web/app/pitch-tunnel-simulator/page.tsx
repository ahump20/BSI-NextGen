import type { Metadata } from 'next';
import PitchTunnelSimulator from '@/components/pitch/PitchTunnelSimulator';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Pitch Tunnel Simulator',
  description:
    'Production-ready real-time 3D pitch design and tunneling visualizer for BlazeSportsIntel.com with live physics and strike zone targeting.',
};

export default function PitchTunnelSimulatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.25em] text-indigo-300 uppercase">Blaze Sports Intel</p>
            <h1 className="text-4xl md:text-5xl font-bold mt-2">Pitch Tunnel Simulator</h1>
            <p className="text-indigo-100 mt-3 max-w-2xl">
              Build MLB-ready pitch shapes, visualize tunneling, and ship instantly to BlazeSportsIntel.com/pitch-tunnel-simulator.
              Controls update in real time so coaches, analysts, and players get actionable flight and tunneling intelligence.
            </p>
          </div>
          <div className="bg-indigo-700/20 border border-indigo-500/30 rounded-2xl px-4 py-3 text-sm text-indigo-100 shadow">
            <p className="font-semibold">Cloudflare-first deployment</p>
            <p className="text-indigo-200/90">Optimized for CDN caching + KV snapshots for preset loadouts.</p>
          </div>
        </header>

        <PitchTunnelSimulator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-indigo-100">
          <div className="bg-slate-900/70 border border-indigo-800/60 rounded-xl p-4">
            <p className="font-semibold text-white">Real-time physics</p>
            <p className="mt-1 text-indigo-100/90">
              Models drag, Magnus lift, seam-shift wake, and extension so shape and tunnel windows react immediately to slider tweaks.
            </p>
          </div>
          <div className="bg-slate-900/70 border border-indigo-800/60 rounded-xl p-4">
            <p className="font-semibold text-white">Tunneling clarity</p>
            <p className="mt-1 text-indigo-100/90">
              Corridor overlays and deviation readouts reveal which designs hold a hitter&apos;s look the longest before breaking off.
            </p>
          </div>
          <div className="bg-slate-900/70 border border-indigo-800/60 rounded-xl p-4">
            <p className="font-semibold text-white">Production-ready</p>
            <p className="mt-1 text-indigo-100/90">
              Built as a drop-in BlazeSportsIntel sub-route with Cloudflare-friendly assets, ensuring instant shipping and scaling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
