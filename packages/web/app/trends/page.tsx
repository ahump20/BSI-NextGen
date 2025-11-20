'use client';

import React, { useState, useEffect } from 'react';
import { TrendCard } from '@/components/TrendCard';
import { SportFilter } from '@/components/SportFilter';
import { Trend, TrendsResponse, SportType } from '@/types/trends';

// Replace with your actual Cloudflare Worker URL
const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://blaze-trends.YOUR_SUBDOMAIN.workers.dev';

export default function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportType>('all');
  const [cached, setCached] = useState(false);

  useEffect(() => {
    fetchTrends();
  }, [selectedSport]);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL(`${WORKER_URL}/api/trends`);
      if (selectedSport !== 'all') {
        url.searchParams.set('sport', selectedSport);
      }
      url.searchParams.set('limit', '20');

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch trends: ${response.status}`);
      }

      const data: TrendsResponse = await response.json();
      setTrends(data.trends);
      setCached(data.cached || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl md:text-5xl">🔥</span>
            <h1 className="text-3xl md:text-5xl font-bold">Blaze Trends</h1>
          </div>
          <p className="text-white/90 text-sm md:text-lg max-w-2xl">
            Real-time sports highlights powered by AI. Stay ahead of the game with trending storylines
            from college baseball, MLB, NFL, and more.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Sport Filter */}
        <SportFilter selectedSport={selectedSport} onSportChange={setSelectedSport} />

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading trends</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchTrends}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cache Indicator */}
        {!loading && cached && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-blue-500 mr-2"
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
              <p className="text-sm text-blue-700">
                Lightning fast response from cache ⚡
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && trends.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trends found</h3>
            <p className="text-gray-600 mb-6">
              There are no trending stories for {selectedSport === 'all' ? 'any sport' : selectedSport} right now.
              Check back soon!
            </p>
            <button
              onClick={fetchTrends}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Trends Grid */}
        {!loading && !error && trends.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                Showing <span className="font-semibold">{trends.length}</span> trending{' '}
                {trends.length === 1 ? 'story' : 'stories'}
              </p>
              <button
                onClick={fetchTrends}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trends.map((trend) => (
                <TrendCard key={trend.id} trend={trend} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Blaze Sports Intel. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Powered by AI • Updated every 15 minutes
          </p>
        </div>
      </footer>
    </div>
  );
}
