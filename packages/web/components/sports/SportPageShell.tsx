'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { gradients, type AccentTone } from '@/components/design-system/theme';
import { useAuth } from '@/lib/hooks/useAuth';

interface SportPageShellProps {
  sport: string;
  tagline: string;
  accent?: AccentTone;
  children: ReactNode;
  actions?: ReactNode;
}

export function SportPageShell({
  sport,
  tagline,
  accent = 'slate',
  children,
  actions,
}: SportPageShellProps) {
  const { authenticated, user, loading } = useAuth();

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradients[accent]}`}> 
      <a href="#sport-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-3 py-2 rounded-md shadow">Skip to content</a>
      <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-40" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4" aria-label={`${sport} primary navigation`}>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-2xl font-bold text-slate-900 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              Blaze Sports Intel
            </Link>
            <span className="text-slate-400" aria-hidden="true">•</span>
            <div>
              <p className="text-sm text-slate-500">{tagline}</p>
              <p className="text-lg font-semibold text-slate-900">{sport}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {actions}
            {!loading && (
              authenticated && user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                  aria-label="View profile"
                >
                  <Avatar src={user.picture} name={user.name || user.email} size="sm" />
                  <span className="hidden sm:inline">{user.name || user.email}</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full bg-slate-900 text-white text-sm font-medium transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                >
                  Sign in
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      <main id="sport-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        {children}
      </main>
    </div>
  );
}
