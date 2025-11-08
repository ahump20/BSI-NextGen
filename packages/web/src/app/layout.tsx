import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Blaze Sports Intel - Real Sports Data, Mobile-First',
  description: 'Professional sports intelligence platform with real-time data for MLB, NFL, NBA, NCAA Football, and College Baseball. Filling the ESPN gap.',
  keywords: 'sports data, MLB, NFL, NBA, college baseball, NCAA football, real-time scores',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-orange-500">
              Blaze Sports Intel
            </h1>
            <p className="text-sm text-gray-400">
              Real Data. Mobile-First. ESPN Gap Filled.
            </p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="bg-gray-900 border-t border-gray-800 mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-400">
            <p>
              Data from MLB Stats API, SportsDataIO, ESPN API | America/Chicago Timezone
            </p>
            <p className="mt-2">
              Blaze Sports Intel © 2025 | Built with real data, no placeholders
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
