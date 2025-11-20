'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/Avatar';
import { NcaaFusionCard } from '@/components/NcaaFusionCard';

/**
 * StarField Background Animation
 * Creates an interactive particle field effect
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

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${Math.random() * 0.5 + 0.3})`;
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
      className="fixed inset-0 -z-10 opacity-30"
      style={{ pointerEvents: 'none' }}
    />
  );
}

/**
 * Enhanced Homepage with Interactive Design
 */
export default function HomePage() {
  const { user, authenticated, loading, login } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Animated Background */}
      <StarField />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md shadow-xl border-b border-indigo-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/50 transition-shadow duration-300">
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
                <p className="text-xs text-indigo-300 hidden sm:block">
                  Professional Sports Intelligence
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              ) : authenticated && user ? (
                <>
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
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
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300 text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div
          className={`text-center max-w-5xl mx-auto transition-all duration-1000 ${
            mounted
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="mb-6">
            <span className="px-4 py-2 bg-indigo-500/20 text-indigo-300 text-sm font-semibold rounded-full border border-indigo-500/30">
              🔥 Now Live: 2025-2026 Season Data
            </span>
          </div>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Fill ESPN&apos;s Gaps with
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Real Intelligence
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
            Professional sports analytics platform delivering complete college
            baseball box scores, real-time stats, and advanced predictive
            models across MLB, NFL, NBA, and NCAA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sports/college-baseball"
              className="group px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105"
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
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-indigo-500/30 hover:border-indigo-500/50"
            >
              View Unified Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Ticker */}
      <section className="bg-slate-800/50 backdrop-blur-sm border-y border-indigo-500/20 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">
                4
              </div>
              <div className="text-sm text-slate-400">Major Sports</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">
                Live
              </div>
              <div className="text-sm text-slate-400">Real-Time Data</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-pink-400 mb-2">
                30s
              </div>
              <div className="text-sm text-slate-400">Update Frequency</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-indigo-400 mb-2">
                100%
              </div>
              <div className="text-sm text-slate-400">Complete Box Scores</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Coverage - Bento Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Sports Coverage
          </h3>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Real-time data from official APIs. No placeholders, no fake stats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* College Baseball - Priority #1 */}
          <Link
            href="/sports/college-baseball"
            className="group relative bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full">
                PRIORITY
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-bold text-white mb-2">
                College Baseball
              </h4>
              <p className="text-blue-300 text-sm">
                Complete box scores ESPN won&apos;t show
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
            className="group relative bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-bold text-white mb-2">MLB</h4>
              <p className="text-red-300 text-sm">
                Official MLB Stats API
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
            className="group relative bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 hover:border-green-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-bold text-white mb-2">NFL</h4>
              <p className="text-green-300 text-sm">
                ESPN API Integration
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
            className="group relative bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/60 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/20 hover:scale-105"
          >
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                ACTIVE
              </span>
            </div>
            <div className="mb-4">
              <h4 className="text-2xl font-bold text-white mb-2">NBA</h4>
              <p className="text-orange-300 text-sm">
                2025-2026 Season Live
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
              <li className="flex items-center text-slate-300">
                <svg
                  className="w-5 h-5 text-green-400 mr-2"
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
            className="bg-gradient-to-br from-orange-700/20 to-orange-800/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-white">Youth Sports</h4>
              <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
                NEW
              </span>
            </div>
            <p className="text-orange-300 text-sm">
              Texas HS • Perfect Game
            </p>
          </Link>

          {/* NCAA Football */}
          <Link
            href="/sports/ncaa-football"
            className="bg-gradient-to-br from-orange-700/20 to-orange-800/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-white">NCAA Football</h4>
              <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
                NEW
              </span>
            </div>
            <p className="text-orange-300 text-sm">
              Longhorns in SEC
            </p>
          </Link>

          {/* NCAA Basketball */}
          <Link
            href="/sports/ncaa-basketball"
            className="bg-gradient-to-br from-blue-700/20 to-blue-800/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-white">NCAA Basketball</h4>
              <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
                NEW
              </span>
            </div>
            <p className="text-blue-300 text-sm">
              March Madness
            </p>
          </Link>

          {/* NCAA Fusion */}
          <div className="transform transition-all duration-300 hover:scale-105">
            <NcaaFusionCard />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-slate-800/30 backdrop-blur-sm py-20 border-y border-indigo-500/20">
        <div className="container mx-auto px-4">
          <h3 className="text-4xl font-bold text-white mb-16 text-center">
            Why Blaze Sports Intel?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl group-hover:shadow-blue-500/50 transition-all duration-300">
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
              <h4 className="text-2xl font-bold text-white mb-3">
                Complete Data
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Full box scores and stats ESPN doesn&apos;t provide, especially
                for college baseball
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl group-hover:shadow-green-500/50 transition-all duration-300">
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
              <h4 className="text-2xl font-bold text-white mb-3">
                Real-Time Updates
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Live scores and stats updated every 30 seconds during games
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-xl group-hover:shadow-purple-500/50 transition-all duration-300">
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
              <h4 className="text-2xl font-bold text-white mb-3">
                Advanced Analytics
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Predictive models, Pythagorean wins, and efficiency metrics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 border-t border-indigo-500/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Brand */}
            <div>
              <h5 className="text-2xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Blaze Sports Intel
              </h5>
              <p className="text-slate-400 leading-relaxed">
                Professional sports intelligence platform filling ESPN&apos;s
                gaps with real, complete data.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h5 className="text-lg font-bold mb-4 text-white">
                Quick Links
              </h5>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/sports/college-baseball"
                    className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
                  >
                    <span>→</span> College Baseball
                  </Link>
                </li>
                <li>
                  <Link
                    href="/unified"
                    className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
                  >
                    <span>→</span> Unified Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/trends"
                    className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2"
                  >
                    <span>→</span> Sports Trends
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h5 className="text-lg font-bold mb-4 text-white">Legal</h5>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/terms"
                    className="text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center">
            <p className="text-slate-500">
              &copy; {new Date().getFullYear()} Blaze Sports Intel. All rights
              reserved.
            </p>
            <p className="text-slate-600 mt-2 text-sm">
              Data sources: Official league APIs • D1Baseball • NCAA • ESPN
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
