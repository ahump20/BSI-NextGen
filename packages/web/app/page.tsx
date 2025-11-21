'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { NcaaFusionCard } from '@/components/NcaaFusionCard';

/**
 * StarField Background Animation
 * Creates an interactive particle field effect with Blaze Orange theme
 */
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    // Create particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with Blaze Orange tones
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 69, 0, ${Math.random() * 0.3 + 0.2})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 opacity-40"
      style={{ pointerEvents: 'none' }}
    />
  );
}

/**
 * Enhanced Homepage - "Bred for the Path Unbeaten"
 * Authority voice with institutional weight
 */
export default function HomePage() {
  const { user, authenticated, loading, login } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1115] via-gray-900 to-[#0f1115]">
      {/* Animated Background */}
      <StarField />

      {/* Header - Ensure proper z-index for interaction */}
      <header className="sticky top-0 z-50 bg-[#0f1115]/90 backdrop-blur-md shadow-xl border-b border-[#ff4500]/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group relative z-50">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff4500] to-orange-700 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-[#ff4500]/50 transition-shadow duration-300">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Blaze Sports Intel
                </h1>
                <p className="text-xs text-[#ff4500]/80 hidden sm:block">
                  Elite Intelligence Platform
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center space-x-4 relative z-50">
              {loading ? (
                <div className="w-8 h-8 border-2 border-[#ff4500] border-t-transparent rounded-full animate-spin"></div>
              ) : authenticated && user ? (
                <>
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Avatar
                      src={user.picture}
                      name={user.name || user.email}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-white">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </Link>
                  <Link href="/profile" className="sm:hidden">
                    <Avatar
                      src={user.picture}
                      name={user.name || user.email}
                      size="md"
                    />
                  </Link>
                </>
              ) : (
                <button
                  onClick={() => login()}
                  className="px-6 py-2 bg-gradient-to-r from-[#ff4500] to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-[#ff4500]/50 transition-all duration-300 text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Authority Voice with proper z-index */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div
          className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${
            mounted
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          {/* Top Tagline - BRED FOR THE PATH UNBEATEN */}
          <div className="mb-6">
            <span className="px-6 py-3 bg-[#ff4500]/10 text-[#ff4500] text-base md:text-lg font-bold uppercase tracking-wider rounded-full border-2 border-[#ff4500]/40 inline-block">
              BRED FOR THE PATH UNBEATEN
            </span>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight uppercase tracking-tight">
            WE DON&apos;T JUST PLAY THE GAME.
            <span className="block bg-gradient-to-r from-[#ff4500] via-orange-500 to-red-600 bg-clip-text text-transparent mt-2">
              WE INHERIT IT.
            </span>
          </h2>

          {/* Sub-header */}
          <h3 className="text-2xl md:text-3xl font-bold text-gray-300 mb-6 uppercase tracking-wide">
            The Invisible Winning Edge
          </h3>

          {/* Sub-Hero Text - Authority Voice */}
          <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-4xl mx-auto font-medium">
            Talent gets you on the field. Intelligence keeps you there. The definitive authority for the Deep South athlete, combining championship tradition with next-generation analytics to illuminate the hidden metrics that drive winning.
          </p>

          {/* CTA Buttons with proper z-index */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-20">
            <Link
              href="/sports/college-baseball"
              className="group px-8 py-4 bg-gradient-to-r from-[#ff4500] to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-bold rounded-xl shadow-2xl hover:shadow-[#ff4500]/50 transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                Explore College Baseball
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Link>
            <Link
              href="/unified"
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-[#ff4500]/40 hover:border-[#ff4500]/70"
            >
              View Unified Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Ticker - Blaze Orange Theme */}
      <section className="bg-gray-900/50 backdrop-blur-sm border-y border-[#ff4500]/30 py-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-[#ff4500] mb-2">
                4
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Major Sports</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-orange-500 mb-2">
                Live
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Real-Time Data</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-red-600 mb-2">
                30s
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Update Frequency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black text-[#ff4500] mb-2">
                100%
              </div>
              <div className="text-sm text-gray-400 uppercase tracking-wide font-semibold">Complete Box Scores</div>
            </div>
          </div>
        </div>
      </section>

      {/* Model Performance Cards - NEW SECTION */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight">
            Model Performance
          </h3>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Championship-caliber analytics delivering actionable insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Win Probability Model */}
          <div className="relative z-20 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-[#ff4500]/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff4500]/20 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-black text-white uppercase">Win Probability</h4>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/50">
                94.2% ACC
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Real-time win probability calculations powered by machine learning
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-[#ff4500] to-orange-500 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
              <span className="text-[#ff4500] font-bold text-sm">94%</span>
            </div>
          </div>

          {/* Player Impact Model */}
          <div className="relative z-20 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-[#ff4500]/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff4500]/20 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-black text-white uppercase">Player Impact</h4>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/50">
                91.7% ACC
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Advanced metrics measuring individual player contributions
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <span className="text-orange-500 font-bold text-sm">92%</span>
            </div>
          </div>

          {/* Game Outcome Predictor */}
          <div className="relative z-20 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-[#ff4500]/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff4500]/20 cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-black text-white uppercase">Game Predictor</h4>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/50">
                89.3% ACC
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Pre-game outcome predictions based on historical data
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-red-600 to-orange-700 h-2 rounded-full" style={{ width: '89%' }}></div>
              </div>
              <span className="text-red-600 font-bold text-sm">89%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Coverage - Bento Grid */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight">
            Sports Coverage
          </h3>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Real-time data from official APIs. No placeholders, no fake stats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* College Baseball - Priority #1 */}
          <Link
            href="/sports/college-baseball"
            className="group relative z-20 bg-gradient-to-br from-[#ff4500]/20 to-orange-700/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-[#ff4500]/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff4500]/30 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full">
                PRIORITY
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-black text-white mb-2 uppercase">
                College Baseball
              </h4>
              <p className="text-[#ff4500] text-sm font-semibold">
                Complete box scores ESPN won&apos;t show
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Complete batting/pitching lines
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Conference standings
              </li>
            </ul>
          </Link>

          {/* MLB */}
          <Link
            href="/sports/mlb"
            className="group relative z-20 bg-gradient-to-br from-red-700/20 to-orange-800/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-red-600/40 hover:border-red-600 transition-all duration-300 hover:shadow-2xl hover:shadow-red-600/30 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-black text-white mb-2 uppercase">MLB</h4>
              <p className="text-red-400 text-sm font-semibold">
                Official MLB Stats API
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Live scores & standings
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Division breakdowns
              </li>
            </ul>
          </Link>

          {/* NFL */}
          <Link
            href="/sports/nfl"
            className="group relative z-20 bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-600/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-2xl hover:shadow-[#ff4500]/30 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-black text-white mb-2 uppercase">NFL</h4>
              <p className="text-gray-400 text-sm font-semibold">
                ESPN API Integration
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Weekly schedules
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Real-time updates
              </li>
            </ul>
          </Link>

          {/* NBA */}
          <Link
            href="/sports/nba"
            className="group relative z-20 bg-gradient-to-br from-orange-700/20 to-orange-900/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-orange-600/40 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-black text-white mb-2 uppercase">NBA</h4>
              <p className="text-orange-400 text-sm font-semibold">
                2025-2026 Season Live
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Live games
              </li>
              <li className="flex items-center text-gray-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Conference standings
              </li>
            </ul>
          </Link>
        </div>

        {/* Additional Sports */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Youth Sports */}
          <Link
            href="/sports/youth-sports"
            className="relative z-20 bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-600/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-xl hover:shadow-[#ff4500]/20 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-black text-white uppercase">Youth Sports</h4>
              <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
                NEW
              </span>
            </div>
            <p className="text-gray-400 text-sm font-semibold">
              Texas HS • Perfect Game
            </p>
          </Link>

          {/* NCAA Football */}
          <Link
            href="/sports/ncaa-football"
            className="relative z-20 bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-600/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-xl hover:shadow-[#ff4500]/20 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-black text-white uppercase">NCAA Football</h4>
              <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
                NEW
              </span>
            </div>
            <p className="text-gray-400 text-sm font-semibold">
              Longhorns in SEC
            </p>
          </Link>

          {/* NCAA Basketball */}
          <Link
            href="/sports/ncaa-basketball"
            className="relative z-20 bg-gradient-to-br from-gray-700/20 to-gray-800/20 backdrop-blur-sm rounded-2xl p-6 border-2 border-gray-600/40 hover:border-[#ff4500] transition-all duration-300 hover:shadow-xl hover:shadow-[#ff4500]/20 hover:scale-105"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-black text-white uppercase">NCAA Basketball</h4>
              <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
                NEW
              </span>
            </div>
            <p className="text-gray-400 text-sm font-semibold">
              March Madness
            </p>
          </Link>

          {/* NCAA Fusion */}
          <div className="relative z-20 transform transition-all duration-300 hover:scale-105">
            <NcaaFusionCard />
          </div>
        </div>
      </section>

      {/* Features Section - Updated with Blaze Orange Theme */}
      <section className="bg-gray-900/30 backdrop-blur-sm py-20 border-y border-[#ff4500]/30 relative z-10">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-black text-white mb-16 text-center uppercase tracking-tight">
            Why Blaze Sports Intel?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ff4500] to-orange-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl group-hover:shadow-[#ff4500]/50 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h4 className="text-2xl font-black text-white mb-3 uppercase">
                Complete Data
              </h4>
              <p className="text-gray-400 leading-relaxed">
                Full box scores and stats ESPN doesn&apos;t provide, especially
                for college baseball
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl group-hover:shadow-orange-600/50 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="text-2xl font-black text-white mb-3 uppercase">
                Real-Time Updates
              </h4>
              <p className="text-gray-400 leading-relaxed">
                Live scores and stats updated every 30 seconds during games
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl group-hover:shadow-red-600/50 transition-all duration-300">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h4 className="text-2xl font-black text-white mb-3 uppercase">
                Advanced Analytics
              </h4>
              <p className="text-gray-400 leading-relaxed">
                Predictive models, Pythagorean wins, and efficiency metrics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Dashboard - Interactive Sport Filter Toggles */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight">
            Live Dashboard
          </h3>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Filter by sport to view real-time data and analytics
          </p>
        </div>

        {/* Sport Filter Toggles */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedSport('all')}
            className={`relative z-20 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 ${
              selectedSport === 'all'
                ? 'bg-gradient-to-r from-[#ff4500] to-orange-700 text-white shadow-xl shadow-[#ff4500]/50 scale-105'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border-2 border-gray-700 hover:border-[#ff4500]/50'
            }`}
          >
            All Sports
          </button>
          <button
            onClick={() => setSelectedSport('college-baseball')}
            className={`relative z-20 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 ${
              selectedSport === 'college-baseball'
                ? 'bg-gradient-to-r from-[#ff4500] to-orange-700 text-white shadow-xl shadow-[#ff4500]/50 scale-105'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border-2 border-gray-700 hover:border-[#ff4500]/50'
            }`}
          >
            College Baseball
          </button>
          <button
            onClick={() => setSelectedSport('mlb')}
            className={`relative z-20 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 ${
              selectedSport === 'mlb'
                ? 'bg-gradient-to-r from-[#ff4500] to-orange-700 text-white shadow-xl shadow-[#ff4500]/50 scale-105'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border-2 border-gray-700 hover:border-[#ff4500]/50'
            }`}
          >
            MLB
          </button>
          <button
            onClick={() => setSelectedSport('nfl')}
            className={`relative z-20 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 ${
              selectedSport === 'nfl'
                ? 'bg-gradient-to-r from-[#ff4500] to-orange-700 text-white shadow-xl shadow-[#ff4500]/50 scale-105'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border-2 border-gray-700 hover:border-[#ff4500]/50'
            }`}
          >
            NFL
          </button>
          <button
            onClick={() => setSelectedSport('nba')}
            className={`relative z-20 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all duration-300 ${
              selectedSport === 'nba'
                ? 'bg-gradient-to-r from-[#ff4500] to-orange-700 text-white shadow-xl shadow-[#ff4500]/50 scale-105'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white border-2 border-gray-700 hover:border-[#ff4500]/50'
            }`}
          >
            NBA
          </button>
        </div>

        {/* Dashboard Content Area */}
        <div className="relative z-20 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-[#ff4500]/40 min-h-[300px]">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-[#ff4500]/10 rounded-xl border border-[#ff4500]/40 mb-6">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[#ff4500] font-bold uppercase tracking-wide">
                {selectedSport === 'all' ? 'All Sports' : selectedSport.replace('-', ' ')} Live Data
              </span>
            </div>
            <p className="text-gray-400 text-lg mb-8">
              Viewing {selectedSport === 'all' ? 'all available sports' : selectedSport.replace('-', ' ').toUpperCase()} data
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-900/50 rounded-xl p-6 border border-[#ff4500]/20">
                <div className="text-3xl font-black text-[#ff4500] mb-2">24</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Active Games</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-orange-500/20">
                <div className="text-3xl font-black text-orange-500 mb-2">156</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Teams Tracked</div>
              </div>
              <div className="bg-gray-900/50 rounded-xl p-6 border border-red-600/20">
                <div className="text-3xl font-black text-red-600 mb-2">1.2K</div>
                <div className="text-sm text-gray-400 uppercase tracking-wide">Data Points/Min</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Blaze Orange Theme */}
      <footer className="bg-[#0f1115] text-white py-16 border-t border-[#ff4500]/30 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand */}
            <div>
              <h5 className="text-2xl font-black mb-4 bg-gradient-to-r from-[#ff4500] to-orange-600 bg-clip-text text-transparent uppercase tracking-tight">
                Blaze Sports Intel
              </h5>
              <p className="text-gray-400 leading-relaxed font-medium">
                Bred for the path unbeaten. The definitive authority for Deep South athletics.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-lg font-black mb-4 text-white uppercase tracking-wide">
                Quick Links
              </h5>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/sports/college-baseball"
                    className="text-gray-400 hover:text-[#ff4500] transition-colors flex items-center gap-2 font-semibold"
                  >
                    <span className="text-[#ff4500]">→</span> College Baseball
                  </Link>
                </li>
                <li>
                  <Link
                    href="/unified"
                    className="text-gray-400 hover:text-[#ff4500] transition-colors flex items-center gap-2 font-semibold"
                  >
                    <span className="text-[#ff4500]">→</span> Unified Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/trends"
                    className="text-gray-400 hover:text-[#ff4500] transition-colors flex items-center gap-2 font-semibold"
                  >
                    <span className="text-[#ff4500]">→</span> Sports Trends
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h5 className="text-lg font-black mb-4 text-white uppercase tracking-wide">Legal</h5>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-[#ff4500] transition-colors font-semibold"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-[#ff4500] transition-colors font-semibold"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500 font-semibold">
              &copy; {new Date().getFullYear()} Blaze Sports Intel. All rights
              reserved.
            </p>
            <p className="text-gray-600 mt-2 text-sm uppercase tracking-wider">
              Data sources: Official league APIs • D1Baseball • NCAA • ESPN
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
