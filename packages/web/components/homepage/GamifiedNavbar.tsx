'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Shield, Bell, Menu, X } from 'lucide-react';
import type { UserStats, UserStatsResponse } from '@bsi/shared';

/**
 * GamifiedNavbar Component
 *
 * Navigation bar with gamification elements
 * Features:
 * - User rank and XP display
 * - Progress bar to next level
 * - Daily streak counter
 * - Notification bell
 * - Mobile-responsive menu
 */

interface GamifiedNavbarProps {
  className?: string;
}

export const GamifiedNavbar: React.FC<GamifiedNavbarProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/homepage/user-stats');
        if (response.ok) {
          const data: UserStatsResponse = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('[GamifiedNavbar] Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <nav className={`w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(191,87,0,0.4)] group-hover:shadow-[0_0_30px_rgba(191,87,0,0.6)] transition-shadow">
            <Flame className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tighter text-white">
              BLAZE<span className="text-orange-500">INTEL</span>
            </span>
            <span className="text-[9px] font-bold text-gray-500 tracking-[0.2em] uppercase">
              Sports Intelligence
            </span>
          </div>
        </Link>

        {/* Gamification Dashboard (Desktop) */}
        {!loading && stats && (
          <div className="hidden lg:flex items-center gap-6 bg-zinc-900/80 px-5 py-1.5 rounded-full border border-white/10 shadow-inner">
            {/* Rank */}
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Rank</span>
                <span className="text-xs font-bold text-white">{stats.rank}</span>
              </div>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* XP Progress */}
            <div className="flex flex-col w-32 justify-center">
              <div className="flex justify-between text-[9px] font-bold mb-1">
                <span className="text-orange-500">XP</span>
                <span className="text-gray-500">
                  {stats.xp} / {stats.nextLevel}
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_10px_rgba(234,88,12,0.5)] transition-all duration-500"
                  style={{ width: `${(stats.xp / stats.nextLevel) * 100}%` }}
                />
              </div>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Streak */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500/20 animate-pulse" />
                <div className="absolute inset-0 blur-sm bg-orange-500/40" />
              </div>
              <span className="text-xs font-bold text-white font-mono">{stats.streak}</span>
            </div>
          </div>
        )}

        {/* Loading State (Desktop) */}
        {loading && (
          <div className="hidden lg:flex items-center gap-3 bg-zinc-900/80 px-5 py-2 rounded-full border border-white/10">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Loading stats...</span>
          </div>
        )}

        {/* Mobile Menu Trigger */}
        <button
          className="lg:hidden text-white p-2 active:scale-95 transition-transform"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* User Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="relative cursor-pointer group">
            <Bell className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-zinc-950" />
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 border-2 border-zinc-900 ring-2 ring-white/10 cursor-pointer hover:ring-white/20 transition-all" />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/5 bg-zinc-950/95 backdrop-blur-md">
          <div className="px-4 py-6 space-y-4">
            {/* User Stats (Mobile) */}
            {!loading && stats && (
              <div className="bg-zinc-900/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-sky-400" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Rank</p>
                      <p className="text-sm font-bold text-white">{stats.rank}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                    <span className="text-sm font-bold text-white font-mono">
                      {stats.streak} day streak
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold mb-2">
                    <span className="text-orange-500">XP Progress</span>
                    <span className="text-gray-500">
                      {stats.xp} / {stats.nextLevel}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400"
                      style={{ width: `${(stats.xp / stats.nextLevel) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            <nav className="space-y-2">
              <Link
                href="/sports/college-baseball"
                className="block px-4 py-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 text-white font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                College Baseball
              </Link>
              <Link
                href="/trends"
                className="block px-4 py-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 text-white font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trends
              </Link>
              <Link
                href="/profile"
                className="block px-4 py-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 text-white font-medium transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Profile
              </Link>
            </nav>
          </div>
        </div>
      )}
    </nav>
  );
};
