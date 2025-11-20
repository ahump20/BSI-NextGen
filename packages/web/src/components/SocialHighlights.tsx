'use client';

import { useState, useEffect } from 'react';

interface Highlight {
  id: string;
  sport: string;
  title: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  source: 'twitter' | 'instagram' | 'youtube';
  timestamp: string;
  likes: number;
  shares: number;
}

interface SocialHighlightsProps {
  sport?: string;
  limit?: number;
}

/**
 * Social Media Highlights Component
 *
 * Displays trending sports highlights from social media platforms
 * - Twitter/X highlights
 * - Instagram clips
 * - YouTube shorts
 * - Real-time engagement metrics
 *
 * Features:
 * - Auto-refresh every 60 seconds
 * - Filter by sport
 * - Click to expand/play video
 * - Social sharing
 */
export function SocialHighlights({ sport, limit = 6 }: SocialHighlightsProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);

  useEffect(() => {
    fetchHighlights();
    const interval = setInterval(fetchHighlights, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [sport]);

  const fetchHighlights = async () => {
    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch(`/api/social/highlights?sport=${sport || 'all'}&limit=${limit}`);
      // const data = await response.json();
      // setHighlights(data.highlights);

      // Mock data for demonstration
      const mockHighlights: Highlight[] = [
        {
          id: '1',
          sport: 'college-baseball',
          title: 'LSU Walk-Off Home Run',
          description: 'Dylan Crews crushes a 3-run homer in the bottom of the 9th!',
          thumbnailUrl: '/api/placeholder/400/225',
          source: 'twitter',
          timestamp: new Date().toISOString(),
          likes: 1243,
          shares: 342,
        },
        {
          id: '2',
          sport: 'mlb',
          title: 'Ohtani Strikes Out 10',
          description: 'Shohei Ohtani dominates with 10 strikeouts in 7 innings',
          thumbnailUrl: '/api/placeholder/400/225',
          source: 'instagram',
          timestamp: new Date().toISOString(),
          likes: 5432,
          shares: 1234,
        },
        {
          id: '3',
          sport: 'nfl',
          title: 'Mahomes 50-yard TD Pass',
          description: 'Patrick Mahomes connects deep with Travis Kelce',
          thumbnailUrl: '/api/placeholder/400/225',
          source: 'youtube',
          timestamp: new Date().toISOString(),
          likes: 8765,
          shares: 2341,
        },
      ];

      setHighlights(mockHighlights.slice(0, limit));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching highlights:', error);
      setLoading(false);
    }
  };

  const getSocialIcon = (source: Highlight['source']) => {
    switch (source) {
      case 'twitter':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="white" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="white" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
          <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>Trending Highlights</span>
        </h3>
        <button
          onClick={fetchHighlights}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {highlights.map((highlight) => (
          <div
            key={highlight.id}
            onClick={() => setSelectedHighlight(highlight)}
            className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer transform hover:scale-[1.02] border border-gray-200"
          >
            {/* Thumbnail */}
            <div className="relative bg-gray-900 aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Sport badge */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-sm rounded text-xs font-semibold text-white">
                {highlight.sport.toUpperCase().replace('-', ' ')}
              </div>
              {/* Source badge */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                {getSocialIcon(highlight.source)}
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">
                {highlight.title}
              </h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {highlight.description}
              </p>

              {/* Engagement */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    <span>{highlight.likes.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                    </svg>
                    <span>{highlight.shares.toLocaleString()}</span>
                  </span>
                </div>
                <span className="text-gray-400">
                  {new Date(highlight.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedHighlight && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedHighlight(null)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gray-900 aspect-video">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div>
                  <p className="text-lg mb-2">Video Player</p>
                  <p className="text-sm text-gray-400">
                    Integration with {selectedHighlight.source} embed coming soon
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHighlight(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedHighlight.title}
              </h3>
              <p className="text-gray-600 mb-4">{selectedHighlight.description}</p>
              <div className="flex items-center space-x-4">
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Share Highlight
                </button>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">
                  View on {selectedHighlight.source}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
