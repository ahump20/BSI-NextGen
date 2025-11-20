'use client';

import React from 'react';
import Link from 'next/link';
import {
  Trophy,
  TrendingUp,
  ChevronRight,
  Target,
  Users,
  Lock,
  PlayCircle,
} from 'lucide-react';
import {
  StarField,
  LiveWire,
  PerformanceCard,
  GamifiedNavbar,
} from '@/components/homepage';

/**
 * Blaze Sports Intel Homepage (V2)
 *
 * Enhanced homepage with:
 * - Interactive particle background
 * - Gamified navigation
 * - Real-time alerts feed
 * - Performance metrics
 * - Bento grid layout
 * - Full back-end integration
 */

export default function HomePageV2() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-600 selection:text-white overflow-x-hidden relative flex flex-col">
      {/* --- ANIMATED BACKGROUND LAYER --- */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-zinc-950 via-black to-zinc-950">
        <StarField />
        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        {/* --- GAMIFIED NAVBAR --- */}
        <GamifiedNavbar />

        {/* --- HERO SECTION --- */}
        <header className="w-full max-w-7xl mx-auto px-4 py-12 md:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 relative z-10">
              {/* Status Indicator */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-orange-500/20 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                <span className="text-xs font-bold tracking-widest text-orange-500 uppercase font-mono">
                  System Online // TX
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.95]">
                FIND THE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                  INVISIBLE EDGE
                </span>
              </h1>

              <p className="text-lg text-gray-400 max-w-xl leading-relaxed border-l-2 border-orange-600 pl-6">
                The Deep South's premier analytics hub. We prioritize the markets Vegas
                ignores—starting with
                <span className="text-white font-bold mx-1 border-b border-orange-500/50">
                  College Baseball
                </span>
                and ending with your ROI.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/sports/college-baseball"
                  className="group relative px-8 py-4 bg-orange-600 rounded-xl font-bold text-white overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(234,88,12,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  <span className="relative flex items-center gap-2">
                    Launch Dashboard
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                <Link
                  href="/trends"
                  className="group px-8 py-4 bg-zinc-900/30 backdrop-blur-md border border-white/10 rounded-xl font-bold text-sky-400 hover:text-sky-300 hover:bg-zinc-900/50 transition-all hover:border-sky-400/30 flex items-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  View Trends
                </Link>
              </div>
            </div>

            {/* Hero Stats Card (Desktop Only) */}
            <div className="relative hidden lg:block perspective-1000">
              <PerformanceCard className="transform rotate-y-[-10deg] hover:rotate-y-0" />
            </div>
          </div>
        </header>

        {/* --- BENTO GRID LAYOUT --- */}
        <section className="w-full max-w-7xl mx-auto px-4 py-12 flex-1">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
              INTELLIGENCE GRID
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 grid-rows-auto gap-5">
            {/* 1. DIAMOND INTEL (Primary Feature - Takes 2x2 space) */}
            <div className="md:col-span-2 md:row-span-2 relative group rounded-3xl border border-white/10 bg-zinc-900/40 overflow-hidden hover:border-orange-500/50 transition-all duration-500 shadow-2xl">
              {/* Background Image */}
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587280501635-6850370e306d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

              <div className="absolute top-6 right-6 z-20">
                <div className="w-12 h-12 rounded-2xl bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-500 transition-colors duration-300 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-10">
                <div className="mb-auto inline-flex">
                  <span className="px-3 py-1 rounded-full bg-orange-600/20 border border-orange-500/40 text-orange-400 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                    Primary Access
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter drop-shadow-lg">
                  DIAMOND
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                    INTEL
                  </span>
                </h2>
                <p className="text-gray-300 mb-8 max-w-md text-sm md:text-base font-medium leading-relaxed text-shadow">
                  The only comprehensive College Baseball data suite in the market. Pitch
                  tunneling, umpire scorecards, and predictive Omaha models.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/sports/college-baseball"
                    className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    Enter Portal
                  </Link>
                  <Link
                    href="/pitch-tunnel-simulator"
                    className="px-6 py-3 bg-black/60 border border-white/20 text-white font-bold rounded-lg hover:bg-black/80 backdrop-blur transition-colors flex items-center justify-center gap-2 group/btn"
                  >
                    <Target className="w-4 h-4 text-sky-400" />
                    3D Simulator
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. LIVE WIRE (Vertical Feed) */}
            <LiveWire className="md:col-span-1 md:row-span-2" />

            {/* 3. RECRUITING INTEL (Small Card) */}
            <div className="md:col-span-1 md:row-span-1 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 relative group hover:border-sky-500/30 transition-all cursor-pointer overflow-hidden min-h-[200px]">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 transform duration-500">
                <Users className="w-24 h-24 text-sky-500" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 text-sky-400">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
                  Recruiting
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  Next-gen metrics on the SEC & Big 12 classes.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* 4. PRO LOCK (Small Card - Gamified) */}
            <div className="md:col-span-1 md:row-span-1 rounded-3xl border border-white/5 bg-black/60 p-6 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer min-h-[200px]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0)_0,rgba(0,0,0,0)_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)] opacity-50" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xl">
                  <Lock className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Pro Tier
                </span>
                <p className="text-[10px] text-gray-600 px-2">
                  Level up to "All-American" to unlock.
                </p>
              </div>
            </div>

            {/* 5. PODCAST / MEDIA (Wide Horizontal) */}
            <div className="md:col-span-2 lg:col-span-3 rounded-3xl border border-white/10 bg-zinc-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:bg-zinc-900/60 transition-colors relative overflow-hidden">
              <div className="absolute left-[-50px] top-[-50px] w-64 h-64 bg-orange-600/5 rounded-full blur-[60px]" />

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 relative overflow-hidden border border-white/10 shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?q=80&w=200&auto=format&fit=crop"
                    alt="Podcast"
                    className="w-full h-full object-cover opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <PlayCircle className="w-8 h-8 text-white opacity-80" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-1">
                    Latest Intelligence
                  </h4>
                  <h3 className="text-lg font-bold text-white">
                    The Weekend Rotation: SEC Preview
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Austin Humphrey breaks down the Texas pitching staff.
                  </p>
                </div>
              </div>

              <button className="relative z-10 px-6 py-2 rounded-full border border-white/20 hover:bg-white hover:text-black text-xs font-bold transition-colors uppercase tracking-wider shrink-0">
                Listen Now
              </button>
            </div>
          </div>
        </section>

        {/* --- FOOTER --- */}
        <footer className="border-t border-white/5 bg-zinc-950 pt-12 pb-8 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <Link
                href="/"
                className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all"
              >
                <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-black">B</span>
                </div>
                <span className="font-black text-lg text-white">BLAZE</span>
              </Link>
              <div className="flex gap-8">
                {['Terms', 'Privacy', 'API', 'Contact'].map((item) => (
                  <Link
                    key={item}
                    href={`/${item.toLowerCase()}`}
                    className="text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors uppercase tracking-wider"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div className="text-center border-t border-white/5 pt-8">
              <p className="text-[10px] text-gray-600 font-mono">
                © 2025 BLAZE INTELLIGENCE. BOERNE, TX. DATA PROVIDED BY SPORTSDATA.IO &
                PROPRIETARY SCRAPERS.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
