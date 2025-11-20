'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Stars, Float } from '@react-three/drei';
import {
  Trophy,
  TrendingUp,
  Activity,
  ChevronRight,
  Target,
  Zap,
  Users,
  Flame,
  Shield,
  Lock,
  Menu,
  Bell,
  PlayCircle,
} from 'lucide-react';

// ------------------------
// ENVIRONMENT META (BSI-NextGen CI wired)
// ------------------------

const ENV_META = {
  env:
    process.env.NEXT_PUBLIC_BSI_ENV ||
    process.env.NEXT_PUBLIC_ENVIRONMENT ||
    process.env.NEXT_PUBLIC_VERCEL_ENV ||
    'unknown',
  commit:
    process.env.NEXT_PUBLIC_BSI_COMMIT ||
    process.env.NEXT_PUBLIC_COMMIT_SHA ||
    '',
  version:
    process.env.NEXT_PUBLIC_BSI_VERSION ||
    process.env.NEXT_PUBLIC_APP_VERSION ||
    '',
  buildTime: process.env.NEXT_PUBLIC_BSI_BUILD_TIME || '',
  infra:
    process.env.NEXT_PUBLIC_BSI_INFRA ||
    process.env.NEXT_PUBLIC_INFRA_PROVIDER ||
    '',
};

// ------------------------
// 3D BACKGROUND COMPONENTS
// ------------------------

// Manually generate random positions to avoid 'maath' dependency issues
const generateParticles = (count: number, radius: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};

function ParticleField(props: any) {
  const ref = useRef<any>();
  const particles = useMemo(() => generateParticles(4200, 1.9), []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 18;
      ref.current.rotation.y -= delta / 24;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        positions={particles}
        stride={3}
        frustumCulled={false}
        {...props}
      >
        <PointMaterial
          transparent
          color="#BF5700" // Blaze burnt orange
          size={0.003}
          sizeAttenuation
          depthWrite={false}
          opacity={0.85}
        />
      </Points>
    </group>
  );
}

function SportAura({ accentColor }: { accentColor: string }) {
  return (
    <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1}>
      <group>
        <mesh>
          <sphereGeometry args={[0.36, 64, 64]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.12} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.5, 0.65, 96]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

function Scene({ accentColor }: { accentColor: string }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <ParticleField />
          <Stars
            radius={90}
            depth={45}
            count={2600}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <SportAura accentColor={accentColor} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// ------------------------
// MOCK / CONFIG DATA
// ------------------------

type SportKey =
  | 'college-baseball'
  | 'mlb'
  | 'nfl'
  | 'nba'
  | 'ncaa-football'
  | 'ncaa-basketball'
  | 'youth';

const SPORTS: {
  key: SportKey;
  label: string;
  emoji: string;
  short: string;
  status: string;
  href: string;
  levelTag: string;
}[] = [
  {
    key: 'college-baseball',
    label: 'College Baseball',
    emoji: '⚾',
    short: 'NCAA D1',
    status: 'Full Box Scores • Live • Rankings',
    href: '/sports/college-baseball',
    levelTag: 'Flagship',
  },
  {
    key: 'mlb',
    label: 'MLB',
    emoji: '⚾',
    short: 'Cardinals',
    status: 'Advanced Props • Pythagorean Standings',
    href: '/sports/mlb',
    levelTag: 'Pro',
  },
  {
    key: 'nfl',
    label: 'NFL',
    emoji: '🏈',
    short: 'Titans',
    status: 'Drive Charts • Play-by-Play Tempo',
    href: '/sports/nfl',
    levelTag: 'Pro',
  },
  {
    key: 'ncaa-football',
    label: 'NCAA Football',
    emoji: '🏈',
    short: 'SEC',
    status: 'Longhorns • Conference Heatmaps',
    href: '/sports/ncaa-football',
    levelTag: 'Saturday',
  },
  {
    key: 'nba',
    label: 'NBA',
    emoji: '🏀',
    short: 'Grizzlies',
    status: 'Shot Profiles • Pace • Line Movement',
    href: '/sports/nba',
    levelTag: 'Pro',
  },
  {
    key: 'ncaa-basketball',
    label: 'NCAA Basketball',
    emoji: '🏀',
    short: 'March',
    status: 'Bracket Paths • Momentum Index',
    href: '/sports/ncaa-basketball',
    levelTag: 'Tournament',
  },
  {
    key: 'youth',
    label: 'Youth Sports',
    emoji: '⚡',
    short: 'TX/Deep South',
    status: 'Texas HS Football • Perfect Game Baseball',
    href: '/sports/youth-sports',
    levelTag: 'Pipeline',
  },
];

const SPORT_METRICS: Record<
  SportKey,
  {
    winEdge: string;
    roi: string;
    confidence: string;
    focus: string;
  }
> = {
  'college-baseball': {
    winEdge: '+7.2%',
    roi: '+18.4u',
    confidence: 'Elite',
    focus: 'Pitch tunnels, umpires, travel.',
  },
  mlb: {
    winEdge: '+4.1%',
    roi: '+9.7u',
    confidence: 'High',
    focus: 'Bullpens, park factors, weather.',
  },
  nfl: {
    winEdge: '+3.8%',
    roi: '+6.2u',
    confidence: 'Solid',
    focus: 'Early downs, scripted drives.',
  },
  'ncaa-football': {
    winEdge: '+5.6%',
    roi: '+11.1u',
    confidence: 'High',
    focus: 'Explosive plays, red zone swings.',
  },
  nba: {
    winEdge: '+3.2%',
    roi: '+4.9u',
    confidence: 'Developing',
    focus: 'Rotation volatility, back-to-backs.',
  },
  'ncaa-basketball': {
    winEdge: '+6.0%',
    roi: '+12.0u',
    confidence: 'Tournament',
    focus: 'Tempo mismatches, shot quality runs.',
  },
  youth: {
    winEdge: '+8.9%',
    roi: '+5.3u',
    confidence: 'Scouting',
    focus: 'Talent ID, schedule density.',
  },
};

const LIVE_ALERTS = [
  {
    id: 1,
    sport: 'College Baseball',
    msg: 'Texas vs LSU: bullpen usage spike flagged for Game 3.',
    time: '2m',
    tag: 'EDGE',
    color: 'text-orange-400',
  },
  {
    id: 2,
    sport: 'NCAA Football',
    msg: 'Auburn flips 5★ QB from in-conference rival.',
    time: '14m',
    tag: 'RECRUIT',
    color: 'text-sky-400',
  },
  {
    id: 3,
    sport: 'MLB',
    msg: 'Braves Ace scratched (forearm tightness) • prop board frozen.',
    time: '1h',
    tag: 'INJURY',
    color: 'text-red-400',
  },
  {
    id: 4,
    sport: 'Youth',
    msg: 'San Antonio RB prospect posts 4-TD playoff performance.',
    time: '3h',
    tag: 'PROSPECT',
    color: 'text-emerald-400',
  },
];

const USER_STATS = {
  rank: 'Varsity Scout',
  xp: 1250,
  nextLevel: 2000,
  streak: 4,
  seasonRecord: '57–39–3',
};

// ------------------------
// DEV DEPLOY TOGGLE
// ------------------------

function DevDeployToggle() {
  const [open, setOpen] = useState(false);

  const hasAny =
    ENV_META.env !== 'unknown' ||
    !!ENV_META.commit ||
    !!ENV_META.version ||
    !!ENV_META.buildTime ||
    !!ENV_META.infra;

  if (!hasAny) return null;

  const shortCommit = ENV_META.commit
    ? ENV_META.commit.slice(0, 7)
    : undefined;
  const envLabel =
    ENV_META.env === 'unknown'
      ? 'ENV?'
      : ENV_META.env.toUpperCase().substring(0, 10);

  const envColor =
    ENV_META.env === 'production'
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
      : ENV_META.env === 'preview'
      ? 'bg-sky-500/20 text-sky-200 border-sky-400/40'
      : 'bg-orange-500/20 text-orange-200 border-orange-400/40';

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono ${envColor} hover:brightness-110 transition`}
      >
        <span className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(190,242,100,0.8)]" />
        <span>{envLabel}</span>
        {shortCommit && (
          <span className="text-[10px] text-gray-200">#{shortCommit}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-zinc-900/95 border border-white/10 shadow-2xl p-3 text-xs space-y-2 z-50">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-100">
              BSI-NextGen Deploy
            </span>
            <span className="text-[10px] text-gray-500">
              blazesportsintel.com
            </span>
          </div>
          <div className="space-y-1 text-[11px] text-gray-300">
            <div className="flex justify-between">
              <span className="text-gray-500">Environment</span>
              <span>{ENV_META.env}</span>
            </div>
            {ENV_META.version && (
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span>{ENV_META.version}</span>
              </div>
            )}
            {ENV_META.commit && (
              <div className="flex justify-between">
                <span className="text-gray-500">Commit</span>
                <span>{ENV_META.commit}</span>
              </div>
            )}
            {ENV_META.infra && (
              <div className="flex justify-between">
                <span className="text-gray-500">Infra</span>
                <span>{ENV_META.infra}</span>
              </div>
            )}
            {ENV_META.buildTime && (
              <div className="flex justify-between">
                <span className="text-gray-500">Built</span>
                <span>{ENV_META.buildTime}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------
// PAGE COMPONENT
// ------------------------

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [activeSport, setActiveSport] = useState<SportKey>('college-baseball');

  useEffect(() => {
    setMounted(true);
  }, []);

  const sportConfig = SPORTS.find((s) => s.key === activeSport)!;
  const metrics = SPORT_METRICS[activeSport];

  return (
    <main className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-orange-600 selection:text-white overflow-x-hidden relative">
      {/* 3D BACKGROUND LAYER */}
      {mounted && <Scene accentColor="#7dd3fc" />}

      {/* CONTENT LAYER */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* NAVBAR */}
        <nav className="w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(191,87,0,0.5)] group-hover:shadow-[0_0_32px_rgba(191,87,0,0.8)] transition-shadow">
                <Flame className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-black tracking-tighter text-white">
                  BLAZE<span className="text-orange-500">SPORTS</span>
                  <span className="text-sky-400">INTEL</span>
                </span>
                <span className="text-[9px] font-bold text-gray-500 tracking-[0.22em] uppercase">
                  Deep South Sports Intelligence
                </span>
              </div>
            </Link>

            {/* Gamification HUD (Desktop) */}
            <div className="hidden lg:flex items-center gap-6 bg-zinc-900/80 px-5 py-1.5 rounded-full border border-white/10 shadow-inner">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-sky-400" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">
                    Rank
                  </span>
                  <span className="text-xs font-bold text-white">
                    {USER_STATS.rank}
                  </span>
                </div>
              </div>

              <div className="w-px h-6 bg-white/10" />

              <div className="flex flex-col w-32 justify-center">
                <div className="flex justify-between text-[9px] font-bold mb-1">
                  <span className="text-orange-500">XP</span>
                  <span className="text-gray-500">
                    {USER_STATS.xp} / {USER_STATS.nextLevel}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-sky-400 shadow-[0_0_14px_rgba(234,88,12,0.7)]"
                    style={{
                      width: `${(USER_STATS.xp / USER_STATS.nextLevel) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="w-px h-6 bg-white/10" />

              <div className="flex flex-col items-start gap-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20 animate-pulse" />
                    <div className="absolute inset-0 blur-sm bg-orange-500/40" />
                  </div>
                  <span className="text-xs font-bold text-white font-mono">
                    {USER_STATS.streak} Day Streak
                  </span>
                </div>
                <span className="text-[9px] text-gray-500 font-mono">
                  Season: {USER_STATS.seasonRecord}
                </span>
              </div>
            </div>

            {/* User actions */}
            <div className="hidden lg:flex items-center gap-4">
              <DevDeployToggle />
              <div className="relative cursor-pointer group">
                <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-zinc-950" />
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-zinc-900 ring-2 ring-white/10" />
            </div>

            {/* Mobile menu (icon only for now) */}
            <button className="lg:hidden text-white p-2 active:scale-95 transition-transform">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>

        {/* HERO SECTION */}
        <header className="w-full max-w-7xl mx-auto px-4 py-10 md:py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy + CTAs */}
            <div className="space-y-8">
              {/* System status pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/60 border border-orange-500/30 backdrop-blur-sm shadow-[0_0_20px_rgba(191,87,0,0.35)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                </span>
                <span className="text-[11px] font-bold tracking-[0.25em] text-orange-500 uppercase font-mono">
                  All 7 Sports // LIVE
                </span>
              </div>

              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                Practice to Play.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-white to-sky-400">
                  Blaze Data Wins the Day.
                </span>
              </h1>

              <p className="text-base md:text-lg text-gray-300 max-w-xl leading-relaxed border-l-2 border-orange-600 pl-5">
                The Deep South&apos;s multi-sport intelligence hub. From College
                Baseball and MLB to NFL, NBA, NCAA Football, NCAA Basketball,
                and Youth Sports, every snap and pitch gets a scoreboard-grade
                audit.
              </p>

              {/* Hero CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/unified"
                  className="group relative px-8 py-4 bg-orange-600 rounded-xl font-bold text-white overflow-hidden transition-all hover:shadow-[0_0_40px_rgba(234,88,12,0.6)] hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                  <span className="relative flex items-center gap-2">
                    Open Multi-Sport Dashboard
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>

                <Link
                  href="/sports/college-baseball"
                  className="group px-8 py-4 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-xl font-bold text-sky-300 hover:text-sky-200 hover:bg-zinc-900/80 transition-all hover:border-sky-400/40 flex items-center gap-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  College Baseball Hub
                </Link>
              </div>

              {/* Platform line */}
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 font-mono pt-2">
                <span className="inline-flex items-center gap-1">
                  <Activity className="w-3 h-3 text-sky-400" />
                  Platform Status:
                </span>
                <span className="text-white/80">
                  College Baseball • MLB • NFL • NBA • NCAA Football • NCAA
                  Basketball • Youth Sports
                </span>
              </div>
            </div>

            {/* Right: Sport selector + metrics */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-orange-600/15 blur-[85px] rounded-full pointer-events-none" />
              <div className="relative bg-zinc-900/60 border border-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wide italic">
                      Multi-Sport Edge
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono">
                      Select a sport to view performance signal.
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[11px] font-black font-mono">
                    LIVE MODEL
                  </div>
                </div>

                {/* Sport pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {SPORTS.map((sport) => {
                    const isActive = sport.key === activeSport;
                    return (
                      <button
                        key={sport.key}
                        type="button"
                        onClick={() => setActiveSport(sport.key)}
                        className={[
                          'relative px-3 py-1.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-sky-500 border-orange-400/80 text-white shadow-[0_0_18px_rgba(234,88,12,0.7)]'
                            : 'bg-zinc-900/60 border-white/10 text-gray-300 hover:border-sky-400/40 hover:text-white',
                        ].join(' ')}
                      >
                        <span>{sport.emoji}</span>
                        <span>{sport.short}</span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em]">
                            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                            LIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 rounded-2xl bg-black/50 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-400 font-bold uppercase">
                        {sportConfig.label}
                      </span>
                      <Trophy className="w-4 h-4 text-orange-400" />
                    </div>
                    <div className="text-2xl font-black flex items-baseline gap-1">
                      <span>{metrics.winEdge}</span>
                      <span className="text-xs text-gray-400">win edge</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Tag: {sportConfig.levelTag}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-400 font-bold uppercase">
                        ROI (Season)
                      </span>
                      <TrendingUp className="w-4 h-4 text-sky-300" />
                    </div>
                    <div className="text-2xl font-black flex items-baseline gap-1">
                      <span>{metrics.roi}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Confidence: {metrics.confidence}
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/10 col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-gray-400 font-bold uppercase">
                        Focus Points
                      </span>
                      <Target className="w-4 h-4 text-sky-300" />
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed">
                      {metrics.focus}
                    </p>
                  </div>
                </div>

                {/* Deep link */}
                <Link
                  href={sportConfig.href}
                  className="flex items-center justify-between px-3 py-2 rounded-2xl bg-zinc-900/80 border border-white/10 text-[11px] text-gray-300 hover:border-orange-500/40 hover:text-white hover:bg-black/80 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    Jump into {sportConfig.label} dashboard
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* LIVE STRIP (ALL 7 SPORTS) */}
        <section className="w-full bg-black/50 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4 overflow-x-auto custom-scrollbar">
            <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-gray-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" />
              </span>
              <span>LIVE BOARD</span>
            </div>

            <div className="w-px h-5 bg-white/10 shrink-0" />

            {SPORTS.map((sport) => (
              <Link
                key={sport.key}
                href={sport.href}
                className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 hover:border-orange-500/60 hover:bg-zinc-900 text-[11px] font-bold transition-colors"
              >
                <span>{sport.emoji}</span>
                <span className="uppercase tracking-[0.14em]">
                  {sport.label}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              </Link>
            ))}
          </div>
        </section>

        {/* INTELLIGENCE GRID */}
        <section className="w-full max-w-7xl mx-auto px-4 py-12 flex-1">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black text-white italic tracking-tighter">
              INTELLIGENCE GRID
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-white/20 via-orange-500/40 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-[minmax(0,1fr)]">
            {/* 1. DIAMOND INTEL (College Baseball primary feature) */}
            <div className="md:col-span-2 md:row-span-2 relative group rounded-3xl border border-white/10 bg-zinc-900/40 overflow-hidden hover:border-orange-500/60 transition-all duration-500 shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587280501635-6850370e306d?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

              <div className="absolute top-6 right-6 z-20">
                <div className="w-12 h-12 rounded-2xl bg-black/50 backdrop-blur border border-white/10 flex items-center justify-center group-hover:bg-orange-600 group-hover:border-orange-500 transition-colors duration-300 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10 h-full flex flex-col justify-end p-8 md:p-10">
                <div className="mb-auto inline-flex">
                  <span className="px-3 py-1 rounded-full bg-orange-600/30 border border-orange-500/60 text-orange-200 text-[10px] font-bold uppercase tracking-[0.25em] backdrop-blur-md">
                    College Baseball • Primary Access
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tighter drop-shadow-lg">
                  DIAMOND
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300">
                    INTEL SUITE
                  </span>
                </h2>

                <p className="text-gray-200 mb-8 max-w-md text-sm md:text-base font-medium leading-relaxed">
                  Pitch tunneling, umpire scorecards, Omaha probability ladder,
                  and travel-wear models built for college baseball degenerates
                  who still care about the fundamentals.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/sports/college-baseball"
                    className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    Enter College Baseball Hub
                  </Link>
                  <Link
                    href="/pitch-tunnel-simulator"
                    className="px-6 py-3 bg-black/70 border border-white/20 text-white font-bold rounded-lg hover:bg-black/90 backdrop-blur transition-colors flex items-center justify-center gap-2 group/btn"
                  >
                    <Target className="w-4 h-4 text-sky-300" />
                    3D Pitch Tunnel Lab
                  </Link>
                </div>
              </div>
            </div>

            {/* 2. Live Wire (alerts) */}
            <div className="md:col-span-1 md:row-span-2 rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-md flex flex-col overflow-hidden">
              <div className="p-5 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <span className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  Live Wire
                </span>
                <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/20 animate-pulse font-mono">
                  LIVE FEED
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {LIVE_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl bg-zinc-950/60 border border-white/5 hover:border-white/20 transition-colors cursor-pointer group shadow-lg"
                  >
                    <div className="flex justify-between mb-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 ${alert.color} tracking-wide`}
                      >
                        {alert.tag} • {alert.sport}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {alert.time} ago
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                      {alert.msg}
                    </p>
                  </div>
                ))}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-dashed border-white/5 flex items-center justify-center">
                  <span className="text-[10px] text-gray-600 italic">
                    Awaiting new signals across SEC, pro, and youth...
                  </span>
                </div>
              </div>
              <Link
                href="/trends"
                className="p-3 text-center text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/5 uppercase tracking-[0.2em]"
              >
                View All Trends
              </Link>
            </div>

            {/* 3. Recruiting Intel */}
            <div className="md:col-span-1 md:row-span-1 rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-6 relative group hover:border-sky-500/40 transition-all cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity group-hover:scale-110 transform duration-500">
                <Users className="w-24 h-24 text-sky-400" />
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-4 text-sky-300">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                  Recruiting Intel
                </h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  SEC &amp; Big 12 class scorecards, flip alerts, and Deep
                  South pipeline mapping from youth to Saturdays.
                </p>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* 4. Pro Lock card */}
            <div className="md:col-span-1 md:row-span-1 rounded-3xl border border-white/5 bg-black/70 p-6 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0)_0,rgba(0,0,0,0)_10px,rgba(255,255,255,0.03)_10px,rgba(255,255,255,0.03)_20px)] opacity-40" />
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xl">
                  <Lock className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors" />
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.22em] mb-1">
                  Pro Tier
                </span>
                <p className="text-[10px] text-gray-600 px-2 text-center">
                  Hit &quot;All-American&quot; rank to unlock pro-only tools &
                  Blaze Copilot integrations.
                </p>
              </div>
            </div>

            {/* 5. Podcast / Media */}
            <div className="md:col-span-2 lg:col-span-3 rounded-3xl border border-white/10 bg-zinc-900/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 group hover:bg-zinc-900/60 transition-colors relative overflow-hidden">
              <div className="absolute left-[-50px] top-[-50px] w-64 h-64 bg-orange-600/10 rounded-full blur-[70px]" />
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
                  <h4 className="text-sm font-bold text-orange-400 uppercase tracking-[0.18em] mb-1">
                    Latest Intelligence Briefing
                  </h4>
                  <h3 className="text-lg font-bold text-white">
                    Weekend Rotation: SEC &amp; Big 12 Overview
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Austin Humphrey walks through Texas baseball, SEC football
                    chaos, and youth pipeline risers in one slate.
                  </p>
                </div>
              </div>
              <button className="relative z-10 px-6 py-2 rounded-full border border-white/20 hover:bg-white hover:text-black text-xs font-bold transition-colors uppercase tracking-[0.22em] shrink-0">
                Listen Now
              </button>
            </div>

            {/* 6. Quests / Gamification */}
            <div className="md:col-span-1 md:row-span-1 rounded-3xl border border-white/10 bg-zinc-900/60 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-[0.22em]">
                  Daily Quests
                </span>
                <span className="text-[10px] text-sky-300 font-mono">
                  +150 XP available
                </span>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: 'Log a College Baseball pick',
                    progress: 0.7,
                  },
                  {
                    label: 'Check NFL drive chart view',
                    progress: 0.4,
                  },
                  {
                    label: 'Save one youth prospect note',
                    progress: 0.1,
                  },
                ].map((quest) => (
                  <div key={quest.label} className="space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-300">
                      <span>{quest.label}</span>
                      <span className="text-gray-500">
                        {Math.round(quest.progress * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 via-orange-400 to-orange-600"
                        style={{ width: `${quest.progress * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/5 bg-zinc-950 pt-12 pb-8 mt-auto relative z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
              <div className="flex items-center gap-2 opacity-70 grayscale hover:grayscale-0 transition-all">
                <Flame className="w-6 h-6 text-orange-600" />
                <span className="font-black text-lg text-white">
                  BLAZE SPORTS INTEL
                </span>
              </div>
              <div className="flex flex-wrap gap-6">
                {['Unified', 'Historical Data', 'Trends', 'Profile'].map(
                  (item) => {
                    const hrefMap: Record<string, string> = {
                      Unified: '/unified',
                      'Historical Data': '/unified?view=historical',
                      Trends: '/trends',
                      Profile: '/profile',
                    };
                    return (
                      <Link
                        key={item}
                        href={hrefMap[item] ?? '#'}
                        className="text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors uppercase tracking-[0.2em]"
                      >
                        {item}
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
            <div className="text-center border-t border-white/5 pt-8">
              <p className="text-[10px] text-gray-600 font-mono">
                © 2025 BLAZE SPORTS INTEL. BOERNE, TX. DATA: Highlightly Baseball
                (NCAA) • SportsDataIO (MLB/NFL/NBA) • MaxPreps (HS) • Perfect
                Game (Youth) • Proprietary scrapers.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
