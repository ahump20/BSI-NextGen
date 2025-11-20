'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';
import { Avatar } from '@/components/Avatar';
import { NcaaFusionCard } from '@/components/NcaaFusionCard';

/**
 * Homepage
 *
 * Sports intelligence platform landing page
 * - Feature highlights
 * - Quick navigation to sports sections
 * - Authentication status
 * - Mobile-first responsive design
 */
export default function HomePage() {
  const { user, authenticated, loading, login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header / Navigation */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
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
                <h1 className="text-xl font-bold text-gray-900">
                  Blaze Sports Intel
                </h1>
                <p className="text-xs text-gray-600 hidden sm:block">
                  Professional Sports Intelligence
                </p>
              </div>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center space-x-2">
              {loading ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : authenticated && user ? (
                <>
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Avatar
                      src={user.picture}
                      name={user.name || user.email}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {user.name || user.email.split('@')[0]}
                    </span>
                  </Link>
                  <Link
                    href="/profile"
                    className="sm:hidden"
                  >
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
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Fill ESPN&apos;s Gaps with
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {' '}
              Real Data
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
            Professional sports intelligence platform delivering complete college
            baseball box scores, real-time analytics, and advanced predictive
            models across MLB, NFL, NBA, and NCAA.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/command-center"
              className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <svg
                className="w-6 h-6"
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
              <span>Command Center</span>
            </Link>
            <Link
              href="/sports/college-baseball"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              College Baseball
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-800 font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 border-2 border-gray-200"
            >
              See Features
            </Link>
          </div>
        </div>
      </section>

      {/* Sports Navigation */}
      <section className="container mx-auto px-4 py-12">
        <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Sports Coverage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* College Baseball - Priority #1 */}
          <Link
            href="/sports/college-baseball"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-blue-100"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">College Baseball</h4>
                <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full">
                  PRIORITY
                </span>
              </div>
              <p className="text-blue-100 text-sm">
                Complete box scores ESPN won&apos;t show you
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
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
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  D1Baseball rankings
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
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
            </div>
          </Link>

          {/* MLB - Active */}
          <Link
            href="/sports/mlb"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-red-100"
          >
            <div className="bg-gradient-to-br from-red-600 to-orange-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">MLB</h4>
                <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                  ACTIVE
                </span>
              </div>
              <p className="text-red-100 text-sm">
                Real-time stats from official MLB API
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Live scores and standings
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Division standings
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Detailed linescores
                </li>
              </ul>
            </div>
          </Link>

          {/* NFL - Active */}
          <Link
            href="/sports/nfl"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-green-100"
          >
            <div className="bg-gradient-to-br from-green-700 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">NFL</h4>
                <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                  ACTIVE
                </span>
              </div>
              <p className="text-green-100 text-sm">
                Live scores from SportsDataIO
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Weekly standings and schedules
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
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
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Real-time game updates
                </li>
              </ul>
            </div>
          </Link>

          {/* NBA - Active */}
          <Link
            href="/sports/nba"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-orange-100"
          >
            <div className="bg-gradient-to-br from-orange-600 to-red-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">NBA</h4>
                <span className="px-3 py-1 bg-green-400 text-gray-900 text-xs font-bold rounded-full">
                  ACTIVE
                </span>
              </div>
              <p className="text-orange-100 text-sm">
                Live scores from SportsDataIO
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Live game updates
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
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
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
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
            </div>
          </Link>

          {/* Youth Sports - NEW */}
          <Link
            href="/sports/youth-sports"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-orange-100"
          >
            <div className="bg-gradient-to-br from-orange-600 to-orange-700 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">Youth Sports</h4>
                <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-orange-100 text-sm">
                Texas HS Football • Perfect Game Baseball
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  District standings & rankings
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Tournament schedules
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Top prospects & recruiting
                </li>
              </ul>
            </div>
          </Link>

          {/* NCAA Football - NEW */}
          <Link
            href="/sports/ncaa-football"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-orange-100"
          >
            <div className="bg-gradient-to-br from-orange-700 to-orange-800 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">NCAA Football</h4>
                <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-orange-100 text-sm">
                Longhorns in SEC • Real-time Rankings
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Team analytics & stats
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pythagorean expectations
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Live conference standings
                </li>
              </ul>
            </div>
          </Link>

          {/* NCAA Basketball - NEW */}
          <Link
            href="/sports/ncaa-basketball"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-blue-100"
          >
            <div className="bg-gradient-to-br from-blue-700 to-blue-800 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">NCAA Basketball</h4>
                <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-blue-100 text-sm">
                March Madness • Brackets & Analytics
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Team analytics & metrics
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Efficiency ratings
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
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
            </div>
          </Link>

          {/* Command Center - NEW */}
          <Link
            href="/command-center"
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-105 overflow-hidden border-2 border-red-100"
          >
            <div className="bg-gradient-to-br from-red-600 to-orange-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-2xl font-bold">Command Center</h4>
                <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-red-100 text-sm">
                Multi-Sport Live Dashboard • 24/7 Real-Time Scores
              </p>
            </div>
            <div className="p-6">
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  All 7 sports in one dashboard
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Auto-refresh every 30 seconds
                </li>
                <li className="flex items-center text-gray-700">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Live game indicators & filters
                </li>
              </ul>
            </div>
          </Link>

          {/* NCAA Fusion - NEW */}
          <NcaaFusionCard />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Why Blaze Sports Intel?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Complete Data
              </h4>
              <p className="text-gray-600">
                Full box scores and stats ESPN doesn&apos;t provide, especially
                for college baseball
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Real-Time Updates
              </h4>
              <p className="text-gray-600">
                Live scores and stats updated every 30 seconds during games
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
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
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Advanced Analytics
              </h4>
              <p className="text-gray-600">
                Predictive models, Pythagorean wins, and efficiency metrics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <h5 className="text-xl font-bold mb-4">Blaze Sports Intel</h5>
              <p className="text-gray-400 text-sm">
                Professional sports intelligence platform filling ESPN&apos;s
                gaps with real, complete data.
              </p>
            </div>

            {/* Links */}
            <div>
              <h5 className="text-lg font-bold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/sports/college-baseball"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    College Baseball
                  </Link>
                </li>
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                {authenticated ? (
                  <li>
                    <Link
                      href="/profile"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Profile
                    </Link>
                  </li>
                ) : (
                  <li>
                    <button
                      onClick={() => login()}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      Sign In
                    </button>
                  </li>
                )}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h5 className="text-lg font-bold mb-4">Legal</h5>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/terms"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Blaze Sports Intel. All rights
              reserved.
            </p>
            <p className="mt-2">
              Data sources: Official league APIs, D1Baseball, NCAA, ESPN
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
