import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

const PitchTunnelSimulator = dynamic(() => import('@/components/PitchTunnelSimulator'), { ssr: false });

export const metadata: Metadata = {
  title: 'Blaze Sports Intel | Pitch Tunnel Simulator',
  description:
    'Real-time 3D pitch design and tunneling visualization built for BlazeSportsIntel. Optimize release, spin, and tunneling windows for production deployment.',
};

export default function PitchTunnelSimulatorPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-white text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.4em] text-indigo-600">BlazeSportsIntel.com/pitch-tunnel-simulator</p>
          <h1 className="text-4xl font-bold text-slate-900 mt-2">Real-Time Pitch Tunnel & Physics Lab</h1>
          <p className="text-lg text-slate-600 mt-2 max-w-3xl">
            Production-ready 3D viewport for pitch design, tunneling, and late-break deception. Deployable on Cloudflare Pages with BlazeSportsIntel design language and analytics hooks ready to extend.
          </p>
        </div>
        <PitchTunnelSimulator />
      </div>
    </main>
  );
}
