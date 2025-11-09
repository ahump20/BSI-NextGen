'use client';

import Link from 'next/link';

export function Header() {
  const openCommandPalette = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-2xl font-bold text-orange-500 hover:text-orange-400 transition-colors">
              Blaze Sports Intel
            </Link>
            <p className="text-sm text-gray-400">
              Real Data. Mobile-First. ESPN Gap Filled.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-medium">
            <Link
              href="/"
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
            >
              Home Dashboard
            </Link>
            <Link
              href="/mlb"
              className="px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
            >
              MLB Scoreboard
            </Link>
            <button
              onClick={openCommandPalette}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              title="Open Command Palette (Cmd/Ctrl+K)"
            >
              <span>🔍</span>
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-xs bg-blue-700 rounded">⌘K</kbd>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
