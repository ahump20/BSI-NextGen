'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-800 animate-pulse" />
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="px-4 py-2 bg-blaze-orange text-white rounded-lg font-medium hover:bg-orange-600 transition-colors text-sm"
      >
        Sign In
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blaze-orange flex items-center justify-center text-white font-bold">
            {session.user.name?.[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium hidden sm:inline">
          {session.user.name}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-gray-800 z-20">
            <div className="p-4 border-b border-gray-800">
              <p className="font-medium text-white">{session.user.name}</p>
              <p className="text-sm text-gray-400">{session.user.email}</p>
            </div>

            <div className="p-2">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // Navigate to profile or settings
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // Navigate to favorites
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Favorites
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  // Navigate to settings
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>

            <div className="p-2 border-t border-gray-800">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
