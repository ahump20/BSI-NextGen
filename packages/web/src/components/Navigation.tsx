'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Global Navigation Component
 *
 * Responsive navigation bar with sports dropdown
 * Mobile-first design with hamburger menu
 */
export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSportsOpen, setIsSportsOpen] = useState(false);

  const sports = [
    { name: 'College Baseball', href: '/sports/college-baseball', icon: '⚾' },
    { name: 'NCAA Football', href: '/sports/ncaa-football', icon: '🏈' },
    { name: 'NCAA Basketball', href: '/sports/ncaa-basketball', icon: '🏀' },
    { name: 'NFL', href: '/sports/nfl', icon: '🏈' },
    { name: 'NBA', href: '/sports/nba', icon: '🏀' },
    { name: 'MLB', href: '/sports/mlb', icon: '⚾' },
    { name: 'Youth Sports', href: '/sports/youth-sports', icon: '🌟' },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
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
            <div className="hidden sm:block">
              <div className="text-white font-bold text-lg">Blaze Sports Intel</div>
              <div className="text-gray-400 text-xs">Professional Sports Intelligence</div>
            </div>
            <div className="sm:hidden">
              <div className="text-white font-bold">BSI</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Home
            </Link>

            <Link
              href="/command-center"
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <span>🔥</span>
              <span>Command Center</span>
            </Link>

            {/* Sports Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setIsSportsOpen(true)}
              onMouseLeave={() => setIsSportsOpen(false)}
            >
              <button className="text-gray-300 hover:text-white transition-colors font-medium flex items-center space-x-1">
                <span>Sports</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isSportsOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isSportsOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-xl border border-gray-700 py-2 z-50">
                  {sports.map((sport) => (
                    <Link
                      key={sport.href}
                      href={sport.href}
                      className="block px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      <span className="mr-2">{sport.icon}</span>
                      {sport.name}
                    </Link>
                  ))}
                  <div className="border-t border-gray-700 my-2"></div>
                  <Link
                    href="/college/fusion?sport=basketball"
                    className="block px-4 py-2 text-amber-400 hover:bg-gray-700 transition-colors font-semibold"
                  >
                    <span className="mr-2">🔥</span>
                    NCAA Fusion Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-300 hover:text-white p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <Link
              href="/"
              className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>

            <Link
              href="/command-center"
              className="block px-4 py-2 my-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg"
              onClick={() => setIsOpen(false)}
            >
              🔥 Command Center
            </Link>

            <div className="mt-4">
              <div className="px-4 py-2 text-gray-500 text-xs font-semibold uppercase">
                Sports
              </div>
              {sports.map((sport) => (
                <Link
                  key={sport.href}
                  href={sport.href}
                  className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors rounded-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <span className="mr-2">{sport.icon}</span>
                  {sport.name}
                </Link>
              ))}
              <Link
                href="/college/fusion?sport=basketball"
                className="block px-4 py-2 text-amber-400 hover:bg-gray-800 transition-colors rounded-lg font-semibold mt-2"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-2">🔥</span>
                NCAA Fusion Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
