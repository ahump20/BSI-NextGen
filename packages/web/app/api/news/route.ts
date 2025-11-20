import { NextRequest, NextResponse } from 'next/server';
import { getD1Client } from '@/lib/d1/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/news
 * Get sports news articles from D1
 *
 * Query params:
 * - sport: Filter by sport (MLB, NFL, NBA, NCAA_FOOTBALL, NCAA_BASKETBALL, COLLEGE_BASEBALL)
 * - limit: Number of articles to return (default: 20, max: 100)
 * - offset: Pagination offset (default: 0)
 * - source: Filter by news source name
 *
 * Examples:
 * /api/news?sport=COLLEGE_BASEBALL&limit=10
 * /api/news?source=D1Baseball
 * /api/news (all recent news)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport');
    const source = searchParams.get('source');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const d1 = getD1Client();

    // Check if D1 is available
    if (!d1.isAvailable()) {
      return NextResponse.json(
        {
          success: false,
          error: 'News service not available - D1 not configured',
          hint: 'Deploy news ingestion worker and configure D1',
        },
        { status: 503 }
      );
    }

    // Build query
    let sql = `
      SELECT
        id, title, url, description, source_name, author,
        sport, published_at, image_url,
        datetime(published_at) as published_date
      FROM news_articles
      WHERE 1=1
    `;

    const params: any[] = [];

    if (sport) {
      sql += ` AND sport = ?`;
      params.push(sport);
    }

    if (source) {
      sql += ` AND source_name = ?`;
      params.push(source);
    }

    sql += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute query
    const result = await d1.query(sql, params);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to fetch news',
        },
        { status: 500 }
      );
    }

    // Format articles
    const articles = result.data.map((article: any) => ({
      id: article.id,
      title: article.title,
      url: article.url,
      description: article.description,
      source: article.source_name,
      author: article.author,
      sport: article.sport || 'general',
      publishedAt: article.published_at,
      imageUrl: article.image_url,
      // Calculate relative time
      timeAgo: getTimeAgo(new Date(article.published_at)),
    }));

    // Get total count for pagination
    let countSql = `SELECT COUNT(*) as total FROM news_articles WHERE 1=1`;
    const countParams: any[] = [];

    if (sport) {
      countSql += ` AND sport = ?`;
      countParams.push(sport);
    }

    if (source) {
      countSql += ` AND source_name = ?`;
      countParams.push(source);
    }

    const countResult = await d1.query<{ total: number }>(countSql, countParams);
    const total = countResult.success && countResult.data[0] ? countResult.data[0].total : 0;

    return NextResponse.json(
      {
        success: true,
        articles,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + articles.length < total,
        },
        filters: {
          sport: sport || 'all',
          source: source || 'all',
        },
        source: {
          provider: 'Cloudflare D1',
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600', // 5min cache for news
        },
      }
    );
  } catch (error) {
    console.error('[News API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch news',
      },
      { status: 500 }
    );
  }
}

/**
 * Get human-readable time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
