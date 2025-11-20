'use client';

import { useState, useEffect } from 'react';
import { NewsCardList, NewsHeadlines, type NewsArticle } from './NewsCard';

type NewsFeedProps = {
  sport?: string;
  source?: string;
  limit?: number;
  layout?: 'grid' | 'headlines';
  columns?: 1 | 2 | 3 | 4;
  title?: string;
};

/**
 * NewsFeed Component
 *
 * Fetches and displays news articles from the API
 * Supports filtering by sport and source
 */
export function NewsFeed({
  sport,
  source,
  limit = 20,
  layout = 'grid',
  columns = 3,
  title = 'Latest News',
}: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, [sport, source, limit]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (sport) params.append('sport', sport);
      if (source) params.append('source', source);
      params.append('limit', limit.toString());

      const response = await fetch(`/api/news?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }

      setArticles(data.articles || []);
    } catch (err) {
      console.error('[NewsFeed] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium mb-2">News Unavailable</p>
          <p className="text-yellow-600 text-sm">{error}</p>
          <p className="text-yellow-600 text-xs mt-2">
            News requires D1 database and news ingestion worker deployment
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No news articles available yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Check back soon for the latest updates
          </p>
        </div>
      </div>
    );
  }

  // Render news feed
  return (
    <div className="bg-gray-50 rounded-lg p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-500">
          {articles.length} article{articles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {layout === 'grid' ? (
        <NewsCardList articles={articles} columns={columns} />
      ) : (
        <NewsHeadlines articles={articles} />
      )}
    </div>
  );
}
