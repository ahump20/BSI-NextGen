'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { NcaaFusionCard } from '../components/NcaaFusionCard';

/**
 * Homepage - Phase 13.7 Complete
 * 
 * Multi-sport intelligence platform landing page
 * - Command Center prominence
 * - 7 sports: College Baseball, MLB, NFL, NBA, NCAA Football, NCAA Basketball, Youth
 * - Authentication status
 * - Mobile-first responsive design
 */
export default function HomePage() {
  const { user, authenticated, loading, login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header / Navigation */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Blaze Sports Intel</h1>
              <p className="text-xs text-gray-400">Professional Sports Intelligence</p>
            </div>
          </Link>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : authenticated && user ? (
              <>
                <Link
                  href="/profile"
                  className="text-sm text-gray-300 hover:text-white transition-colors"
                >
                  {user.name || user.email.split('@')[0]}
                </Link>
              </>
            ) : (
              <button
                onClick={() => login()}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Fill ESPN's Gaps with{' '}
            <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Real Data
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            24/7 multi-sport Command Center delivering complete college baseball box scores, 
            real-time analytics, and advanced predictive models across 7 sports: MLB, NFL, NBA, 
            NCAA Football, NCAA Basketball, College Baseball, and Youth.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/unified"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              🔴 Live Command Center
            </Link>
            <Link
              href="/sports/college-baseball"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
            >
              College Baseball Hub
            </Link>
            <Link
              href="/sports/mlb"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Platform Features
            </Link>
          </div>
        </div>
      </section>

      {/* Command Center Highlight */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-xl p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔴</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-white">Live Command Center</h3>
                <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded uppercase">
                  LIVE NOW
                </span>
              </div>
              <p className="text-gray-300 mb-4">
                Multi-league dashboard tracking live games, standings, and unified search across all 7 sports. 
                30-second updates.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">Live</div>
                  <div className="text-xs text-gray-400">Games</div>
                  <div className="text-sm text-gray-300">Real-time</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">7</div>
                  <div className="text-xs text-gray-400">Sports</div>
                  <div className="text-sm text-gray-300">Unified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">Search</div>
                  <div className="text-xs text-gray-400">Standings</div>
                  <div className="text-sm text-gray-300">Intelligent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">30s</div>
                  <div className="text-xs text-gray-400">Updates</div>
                  <div className="text-sm text-gray-300">Automatic</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sports Navigation - All 7 sports */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold text-white mb-8 text-center">7-Sport Coverage</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* College Baseball - PRIORITY */}
          <Link
            href="/sports/college-baseball"
            className="group relative bg-gradient-to-br from-orange-900/40 to-amber-900/40 border-2 border-orange-500/50 hover:border-orange-500 rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-orange-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">⚾</span>
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded uppercase">
                PRIORITY
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">College Baseball</h4>
            <p className="text-sm text-gray-300 mb-4">
              Complete box scores, live stats, conference standings. Everything ESPN refuses to show.
            </p>
            <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm group-hover:gap-3 transition-all">
              View Coverage <span>→</span>
            </div>
          </Link>

          {/* MLB */}
          <Link
            href="/sports/mlb"
            className="group relative bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-2 border-blue-500/50 hover:border-blue-500 rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">⚾</span>
              <span className="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded uppercase">
                ACTIVE
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">MLB</h4>
            <p className="text-sm text-gray-300 mb-4">
              Major League Baseball - Live games, pitch-by-pitch tracking, MMI analysis, advanced metrics.
            </p>
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm group-hover:gap-3 transition-all">
              View Coverage <span>→</span>
            </div>
          </Link>

          {/* NFL */}
          <Link
            href="/sports/nfl"
            className="group relative bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/50 hover:border-green-500 rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-green-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">🏈</span>
              <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded uppercase">
                ACTIVE
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">NFL</h4>
            <p className="text-sm text-gray-300 mb-4">
              National Football League - Live scores, team stats, player performance, weekly matchups.
            </p>
            <div className="flex items-center gap-2 text-green-400 font-semibold text-sm group-hover:gap-3 transition-all">
              View Coverage <span>→</span>
            </div>
          </Link>

          {/* NBA */}
          <Link
            href="/sports/nba"
            className="group relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-2 border-purple-500/50 hover:border-purple-500 rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-purple-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">🏀</span>
              <span className="px-2 py-1 bg-purple-500 text-white text-xs font-bold rounded uppercase">
                ACTIVE
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">NBA</h4>
            <p className="text-sm text-gray-300 mb-4">
              National Basketball Association - Live games, player tracking, team analytics, playoff coverage.
            </p>
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm group-hover:gap-3 transition-all">
              View Coverage <span>→</span>
            </div>
          </Link>

          {/* Youth Sports */}
          <Link
            href="/sports/youth-sports"
            className="group relative bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-2 border-cyan-500/50 hover:border-cyan-500 rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">🎯</span>
              <span className="px-2 py-1 bg-cyan-500 text-white text-xs font-bold rounded uppercase">
                NEW
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Youth Sports</h4>
            <p className="text-sm text-gray-300 mb-4">
              Texas HS Football + Perfect Game - Youth development tracking, tournament coverage.
            </p>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm group-hover:gap-3 transition-all">
              View Coverage <span>→</span>
            </div>
          </Link>

          {/* NCAA Football */}
          <Link
            href="/sports/ncaa-football"
            className="group relative bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-2 border-amber-500/50 hover:border-amber-500 rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">🏈</span>
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded uppercase">
                NEW
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">NCAA Football</h4>
            <p className="text-sm text-gray-300 mb-4">
              College Football - Longhorns SEC coverage, playoff tracking, conference analytics.
            </p>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm group-hover:gap-3 transition-all">
              View Coverage <span>→</span>
            </div>
          </Link>

          {/* NCAA Basketball */}
          <Link
            href="/sports/ncaa-basketball"
            className="group relative bg-gradient-to-br from-red-900/40 to-rose-900/40 border-2 border-red-500/50 hover:border-red-500 rounded-xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-red-500/20"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">🏀</span>
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded uppercase">
                NEW
              </span>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">NCAA Basketball</h4>
            <p className="text-sm text-gray-300 mb-4">
              College Basketball - March Madness coverage, conference tournaments, recruiting intel.
            </p>
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm group-hover:gap-3 transition-all">
              View Coverage <span>→</span>
            </div>
          </Link>

          {/* NCAA Fusion - Spans full width */}
          <div className="md:col-span-2 lg:col-span-3">
            <NcaaFusionCard />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-2xl">
              🤖
            </div>
            <h4 className="text-xl font-bold text-white mb-2">AI Copilot</h4>
            <p className="text-sm text-gray-400">
              Conversational intelligence for game strategy, player analysis, and predictive insights.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-2xl">
              📊
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Analytics Dashboard</h4>
            <p className="text-sm text-gray-400">
              Advanced metrics, 3D visualizations, and predictive models for competitive edges.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
              🏆
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Championship Platform</h4>
            <p className="text-sm text-gray-400">
              Tournament brackets, playoff tracking, title odds for all leagues and conferences.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/80 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h5 className="text-white font-semibold mb-3">Sports</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sports/college-baseball" className="text-gray-400 hover:text-white">College Baseball</Link></li>
                <li><Link href="/sports/mlb" className="text-gray-400 hover:text-white">MLB</Link></li>
                <li><Link href="/sports/nfl" className="text-gray-400 hover:text-white">NFL</Link></li>
                <li><Link href="/sports/nba" className="text-gray-400 hover:text-white">NBA</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-3">NCAA</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/sports/ncaa-football" className="text-gray-400 hover:text-white">NCAA Football</Link></li>
                <li><Link href="/sports/ncaa-basketball" className="text-gray-400 hover:text-white">NCAA Basketball</Link></li>
                <li><Link href="/sports/youth-sports" className="text-gray-400 hover:text-white">Youth Sports</Link></li>
                <li><Link href="/college/fusion" className="text-gray-400 hover:text-white">NCAA Fusion</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-3">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="/unified" className="text-gray-400 hover:text-white">Command Center</Link></li>
                <li><Link href="/trends" className="text-gray-400 hover:text-white">Trends</Link></li>
                <li><Link href="/profile" className="text-gray-400 hover:text-white">Profile</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="text-white font-semibold mb-3">Platform</h5>
              <ul className="space-y-2 text-sm">
                <li><span className="text-gray-400">AI Copilot</span></li>
                <li><span className="text-gray-400">Analytics Suite</span></li>
                <li><span className="text-gray-400">3D Visualizations</span></li>
                <li><span className="text-gray-400">Predictive Models</span></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2024 Blaze Sports Intel. Professional sports intelligence platform.
            </p>
            <p className="text-xs text-gray-500 mt-2 md:mt-0">
              Data: MLB Stats API, SportsData.io, NCAA, ESPN • Real-time updates every 30s
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
