import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Rajdhani, Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import '@/app/globals.css';

const rajdhani = Rajdhani({ subsets: ['latin'], variable: '--font-rajdhani' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'BlazeSportsIntel | Real-time Sports Intelligence',
  description:
    'BlazeSportsIntel delivers instant advanced metrics, narrative insights, and visual dashboards across every court.',
  openGraph: {
    title: 'BlazeSportsIntel',
    description:
      'Actionable sports intelligence with real-time KPIs, predictive narratives, and immersive visuals.',
    siteName: 'BlazeSportsIntel',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlazeSportsIntel',
    description: 'Cloudflare-native sports intelligence with data storytelling at its core.'
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${rajdhani.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 font-sans">
        <ThemeProvider>
          <QueryProvider>
            <div className="relative flex min-h-screen flex-col">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
                <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
              </div>
              <main className="relative z-10 flex-1 px-4 pb-16 pt-12 sm:px-12 lg:px-24">{children}</main>
              <footer className="relative z-10 border-t border-white/5 px-4 py-6 text-xs text-white/60 sm:px-12 lg:px-24">
                © {new Date().getFullYear()} BlazeSportsIntel. Crafted for elite programs.
              </footer>
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
