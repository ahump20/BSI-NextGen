import Link from 'next/link';
import type { ReactNode } from 'react';
import { sportConfigs, type SportConfig } from '../sport-config';

interface SportPageShellProps {
  config: SportConfig;
  updatedAt?: string;
  children: ReactNode;
}

const sportNav = Object.values(sportConfigs);

export function SportPageShell({ config, updatedAt, children }: SportPageShellProps) {
  return (
    <div className={`min-h-screen bg-grid ${config.background} text-data-primary`}>
      <header className="border-b border-border/60 bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/80 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white font-semibold shadow-sm`}
              aria-hidden
            >
              {config.code}
            </span>
            <div className="flex flex-col">
              <Link href="/sports" className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-data-primary">
                Sports Intelligence
              </Link>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-data-primary leading-tight">{config.name}</h1>
                <span className={`hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.pill}`}>
                  Data-first
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-snug" aria-live="polite">
                {config.tagline}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground" aria-live="polite">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
            <span className="font-medium">Live feeds</span>
            {updatedAt && <span className="hidden sm:inline">• Updated {new Date(updatedAt).toLocaleTimeString()}</span>}
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-3" aria-label="Sports navigation">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar" role="list">
            {sportNav.map(sport => (
              <Link
                key={sport.slug}
                href={`/sports/${sport.slug}`}
                className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-data-blue inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  sport.slug === config.slug
                    ? 'bg-surface-strong text-data-primary shadow-sm'
                    : 'text-muted-foreground hover:text-data-primary hover:bg-surface-strong/60'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${sport.slug === config.slug ? 'bg-data-blue' : 'bg-border'}`} aria-hidden />
                <span>{sport.name}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6" role="main">
        {children}
      </main>
    </div>
  );
}
