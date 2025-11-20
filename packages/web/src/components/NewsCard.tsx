import Link from 'next/link';

export type NewsArticle = {
  id: number;
  title: string;
  url: string;
  description?: string;
  source: string;
  author?: string;
  sport: string;
  publishedAt: string;
  imageUrl?: string;
  timeAgo: string;
};

type NewsCardProps = {
  article: NewsArticle;
  showImage?: boolean;
  showDescription?: boolean;
};

/**
 * NewsCard Component
 *
 * Displays a single news article with optional image and description
 */
export function NewsCard({ article, showImage = true, showDescription = true }: NewsCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-200 hover:border-blue-300"
    >
      {showImage && article.imageUrl && (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        {showDescription && article.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">{article.description}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {/* Source */}
            <span className="font-semibold text-blue-600">{article.source}</span>

            {/* Author */}
            {article.author && (
              <>
                <span>•</span>
                <span>{article.author}</span>
              </>
            )}
          </div>

          {/* Time ago */}
          <span className="text-gray-400">{article.timeAgo}</span>
        </div>
      </div>
    </a>
  );
}

/**
 * NewsCardList Component
 *
 * Displays a grid of news cards
 */
type NewsCardListProps = {
  articles: NewsArticle[];
  columns?: 1 | 2 | 3 | 4;
  showImages?: boolean;
  showDescriptions?: boolean;
};

export function NewsCardList({
  articles,
  columns = 3,
  showImages = true,
  showDescriptions = true,
}: NewsCardListProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6`}>
      {articles.map((article) => (
        <NewsCard
          key={article.id}
          article={article}
          showImage={showImages}
          showDescription={showDescriptions}
        />
      ))}
    </div>
  );
}

/**
 * NewsHeadlines Component
 *
 * Compact list of news headlines (no images or descriptions)
 */
type NewsHeadlinesProps = {
  articles: NewsArticle[];
  maxItems?: number;
};

export function NewsHeadlines({ articles, maxItems = 10 }: NewsHeadlinesProps) {
  const displayArticles = articles.slice(0, maxItems);

  return (
    <div className="space-y-3">
      {displayArticles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
        >
          <h4 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
            {article.title}
          </h4>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-medium text-blue-600">{article.source}</span>
            <span className="text-gray-400">{article.timeAgo}</span>
          </div>
        </a>
      ))}
    </div>
  );
}
