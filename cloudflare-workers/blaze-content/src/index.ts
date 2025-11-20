/**
 * Blaze Content Aggregation Worker
 *
 * Scheduled worker that aggregates sports news and content
 * from multiple sources, analyzes with AI, and stores in D1.
 *
 * Runs every 5 minutes via Cron Trigger: */5 * * * *
 */

import { RSSIngestor } from './ingestors/rss-ingestor';
import type {
  ContentSource,
  Article,
  ArticleRecord,
  IngestionResult,
  TrendingTopic,
} from './types';

export interface Env {
  BLAZE_DB: D1Database;
  SPORTS_CACHE: KVNamespace;
  AI: Ai;
}

export default {
  /**
   * Cron Trigger Handler
   * Runs every 5 minutes: */5 * * * *
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('[Content] Starting scheduled content ingestion', {
      scheduledTime: new Date(event.scheduledTime).toISOString(),
      cron: event.cron,
    });

    const startTime = Date.now();

    try {
      // Get active content sources that need fetching
      const sources = await env.BLAZE_DB.prepare(
        `SELECT * FROM content_sources
         WHERE is_active = 1
         AND (last_fetched_at IS NULL OR last_fetched_at < unixepoch() - fetch_interval_seconds)
         ORDER BY last_fetched_at ASC NULLS FIRST
         LIMIT 20`
      ).all<ContentSource>();

      console.log(`[Content] Found ${sources.results.length} sources to fetch`);

      const results: IngestionResult = {
        fetched: 0,
        inserted: 0,
        updated: 0,
        failed: 0,
        errors: [],
      };

      // Process each source
      for (const source of sources.results) {
        try {
          const sourceResult = await processContentSource(env, source);

          results.fetched += sourceResult.fetched;
          results.inserted += sourceResult.inserted;
          results.updated += sourceResult.updated;
          results.failed += sourceResult.failed;
          results.errors.push(...sourceResult.errors);

          // Update source last_fetched_at
          await env.BLAZE_DB.prepare(
            'UPDATE content_sources SET last_fetched_at = unixepoch(), updated_at = unixepoch() WHERE id = ?'
          )
            .bind(source.id)
            .run();

          console.log(`[Content] Processed source ${source.name}:`, {
            fetched: sourceResult.fetched,
            inserted: sourceResult.inserted,
            updated: sourceResult.updated,
            failed: sourceResult.failed,
          });
        } catch (error) {
          console.error(`[Content] Source processing failed:`, source.name, error);
          results.errors.push(
            `Source ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      const duration = Date.now() - startTime;

      console.log('[Content] Completed scheduled job', {
        duration: `${duration}ms`,
        sourcesProcessed: sources.results.length,
        results,
      });

      // Update trending topics asynchronously
      ctx.waitUntil(updateTrendingTopics(env));
    } catch (error) {
      console.error('[Content] Scheduled job failed:', error);
      throw error;
    }
  },

  /**
   * HTTP Handler for Content API
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (url.pathname === '/health') {
        return new Response(
          JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Manual ingestion trigger
      if (url.pathname === '/ingest' && request.method === 'POST') {
        ctx.waitUntil(
          this.scheduled(
            { scheduledTime: Date.now(), cron: 'manual' } as ScheduledEvent,
            env,
            ctx
          )
        );

        return new Response(
          JSON.stringify({
            message: 'Content ingestion started',
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get personalized content feed
      if (url.pathname === '/api/content/feed') {
        const league = url.searchParams.get('league');
        const category = url.searchParams.get('category');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
        const offset = parseInt(url.searchParams.get('offset') || '0');

        let query = `
          SELECT
            a.*,
            s.name as source_name,
            s.credibility_score
          FROM content_articles a
          JOIN content_sources s ON a.source_id = s.id
          WHERE 1=1
        `;
        const bindings: any[] = [];

        if (league) {
          query += ' AND a.league_id = ?';
          bindings.push(league);
        }

        if (category) {
          query += ' AND a.category = ?';
          bindings.push(category);
        }

        query += ' ORDER BY a.published_at DESC LIMIT ? OFFSET ?';
        bindings.push(limit, offset);

        const articles = await env.BLAZE_DB.prepare(query).bind(...bindings).all();

        return new Response(
          JSON.stringify({
            articles: articles.results,
            meta: {
              league,
              category,
              count: articles.results.length,
              limit,
              offset,
              lastUpdated: new Date().toISOString(),
            },
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=60',
            },
          }
        );
      }

      // Get trending topics
      if (url.pathname === '/api/content/trending') {
        const league = url.searchParams.get('league');
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);

        let query = `
          SELECT * FROM trending_topics
          WHERE window_end > unixepoch() - 3600
        `;
        const bindings: any[] = [];

        if (league) {
          query += ' AND league_id = ?';
          bindings.push(league);
        }

        query += ' ORDER BY velocity DESC LIMIT ?';
        bindings.push(limit);

        const trending = await env.BLAZE_DB.prepare(query).bind(...bindings).all();

        return new Response(
          JSON.stringify({
            trending: trending.results,
            meta: {
              league,
              count: trending.results.length,
              lastUpdated: new Date().toISOString(),
            },
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=30',
            },
          }
        );
      }

      // Get recent articles for a specific source
      if (url.pathname === '/api/content/source') {
        const sourceId = url.searchParams.get('id');
        if (!sourceId) {
          return new Response(
            JSON.stringify({ error: 'Missing source id parameter' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);

        const articles = await env.BLAZE_DB.prepare(
          `SELECT * FROM content_articles
           WHERE source_id = ?
           ORDER BY published_at DESC
           LIMIT ?`
        )
          .bind(sourceId, limit)
          .all();

        return new Response(
          JSON.stringify({
            articles: articles.results,
            meta: {
              sourceId,
              count: articles.results.length,
              lastUpdated: new Date().toISOString(),
            },
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300',
            },
          }
        );
      }

      // Get content statistics
      if (url.pathname === '/api/content/stats') {
        const stats = await env.BLAZE_DB.prepare(
          `SELECT
            COUNT(*) as total_articles,
            COUNT(DISTINCT source_id) as active_sources,
            COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as analyzed_articles,
            COUNT(CASE WHEN published_at > unixepoch() - 86400 THEN 1 END) as articles_24h
           FROM content_articles`
        ).first();

        return new Response(
          JSON.stringify({
            stats,
            meta: {
              timestamp: new Date().toISOString(),
            },
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300',
            },
          }
        );
      }

      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders,
      });
    } catch (error) {
      console.error('[Content] Request failed:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

/**
 * Process a single content source
 */
async function processContentSource(
  env: Env,
  source: ContentSource
): Promise<IngestionResult> {
  const result: IngestionResult = {
    fetched: 0,
    inserted: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };

  try {
    let articles: Article[] = [];

    // Fetch based on source type
    switch (source.type) {
      case 'rss':
        const rssIngestor = new RSSIngestor();
        articles = await rssIngestor.fetch(source.url);
        break;

      case 'api':
        // Future: API ingestors (ESPN, etc.)
        console.warn(`[Content] API ingestor not implemented for: ${source.name}`);
        break;

      case 'scraper':
        // Future: Web scraping
        console.warn(`[Content] Scraper not implemented for: ${source.name}`);
        break;

      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }

    result.fetched = articles.length;

    // Upsert articles
    for (const article of articles) {
      try {
        const inserted = await upsertArticle(env.BLAZE_DB, source.id, article);
        if (inserted) {
          result.inserted++;
        } else {
          result.updated++;
        }
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Article "${article.title}": ${error instanceof Error ? error.message : 'Unknown'}`
        );
      }
    }

    return result;
  } catch (error) {
    console.error('[Content] Source processing failed:', source.name, error);
    throw error;
  }
}

/**
 * Upsert article (insert or skip if duplicate)
 */
async function upsertArticle(
  db: D1Database,
  sourceId: string,
  article: Article
): Promise<boolean> {
  // Check for duplicate by URL
  const existing = await db
    .prepare('SELECT id FROM content_articles WHERE url = ?')
    .bind(article.url)
    .first<{ id: string }>();

  if (existing) {
    console.log(`[Content] Skipping duplicate article: ${article.title}`);
    return false;
  }

  const articleId = crypto.randomUUID();
  const publishedAt = Math.floor(new Date(article.publishedAt).getTime() / 1000);

  await db
    .prepare(
      `INSERT INTO content_articles
       (id, source_id, external_id, title, excerpt, content_html, author,
        published_at, url, image_url, league_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      articleId,
      sourceId,
      article.externalId || null,
      article.title,
      article.excerpt || null,
      article.contentHtml || null,
      article.author || null,
      publishedAt,
      article.url,
      article.imageUrl || null,
      article.leagueId || null
    )
    .run();

  console.log(`[Content] Inserted article: ${articleId} - ${article.title}`);
  return true;
}

/**
 * Update trending topics based on recent articles
 */
async function updateTrendingTopics(env: Env): Promise<void> {
  console.log('[Content] Updating trending topics...');

  const now = Math.floor(Date.now() / 1000);
  const oneHourAgo = now - 3600;

  try {
    // Get topics from recent articles (simplified version without content_topics for now)
    // In future, we'll extract topics with AI analysis

    // For now, just track articles by category as "topics"
    const recentArticles = await env.BLAZE_DB.prepare(
      `SELECT
        category as topic_value,
        'category' as topic_type,
        league_id,
        COUNT(*) as article_count,
        AVG(CASE sentiment
          WHEN 'positive' THEN 1.0
          WHEN 'neutral' THEN 0.0
          WHEN 'negative' THEN -1.0
          ELSE 0.0
        END) as sentiment_avg
       FROM content_articles
       WHERE published_at > ?
       AND category IS NOT NULL
       GROUP BY category, league_id
       HAVING COUNT(*) >= 2
       ORDER BY COUNT(*) DESC
       LIMIT 50`
    )
      .bind(oneHourAgo)
      .all();

    // Upsert trending topics
    for (const topic of recentArticles.results) {
      const velocity = topic.article_count as number; // Articles per hour
      const trendingId = crypto.randomUUID();

      await env.BLAZE_DB.prepare(
        `INSERT OR REPLACE INTO trending_topics
         (id, topic_value, topic_type, league_id, article_count, velocity,
          sentiment_avg, window_start, window_end, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`
      )
        .bind(
          trendingId,
          topic.topic_value,
          topic.topic_type,
          topic.league_id,
          topic.article_count,
          velocity,
          topic.sentiment_avg || 0.0,
          oneHourAgo,
          now
        )
        .run();
    }

    console.log(`[Content] Updated ${recentArticles.results.length} trending topics`);
  } catch (error) {
    console.error('[Content] Failed to update trending topics:', error);
  }
}
