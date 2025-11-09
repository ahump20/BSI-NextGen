import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CommandPalette } from '@/components/CommandPalette';
import { Header } from '@/components/Header';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationContainer } from '@/components/NotificationContainer';
import { PreferencesPanel } from '@/components/PreferencesPanel';
import { LiveScoreIndicator } from '@/components/LiveScoreIndicator';
import { PWAInstaller } from '@/components/PWAInstaller';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel - Real Sports Data, Mobile-First',
  description: 'Professional sports intelligence platform with real-time data for MLB, NFL, NBA, NCAA Football, and College Baseball. Filling the ESPN gap.',
  keywords: 'sports data, MLB, NFL, NBA, college baseball, NCAA football, real-time scores',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Blaze Sports Intel',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-gray-950 text-white min-h-screen">
        <NotificationProvider>
          <PreferencesProvider>
            <Header />
            <CommandPalette />
            <NotificationContainer />
            <PreferencesPanel />
            <LiveScoreIndicator />
            <PWAInstaller />
            <main className="container mx-auto px-4 py-6">
              {children}
            </main>
            <footer className="bg-gray-900 border-t border-gray-800 mt-12">
              <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
                <p>
                  Data from MLB Stats API, SportsDataIO, ESPN API | America/Chicago Timezone
                </p>
                <p className="mt-2">
                  Blaze Sports Intel © 2025 | Built with real data, no placeholders | Enhanced with Desktop Commander
                </p>
              </div>
            </footer>
          </PreferencesProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
