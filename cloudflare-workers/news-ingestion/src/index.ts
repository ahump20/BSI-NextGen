/**
 * Blaze Sports Intel - News Ingestion Worker
 *
 * Purpose: Periodic ingestion of sports news from RSS feeds into D1
 * Schedule: Runs every 30 minutes via Cloudflare Cron Triggers
 * Storage: Cloudflare D1 database (news_articles table)
 */

export interface Env {
  DB: D1Database;
}

type NewsSource = {
  name: string;
  url: string;
  sport?: string; // 'MLB', 'NFL', etc., or null for general
};

type IngestResult = {
  recordsProcessed: number;
  recordsInserted: number;
  recordsSkipped: number; // Duplicates
  recordsFailed: number;
  errors: string[];
};

/**
 * RSS Feed Sources
 * Using free public RSS feeds - no API keys required
 */
const NEWS_SOURCES: NewsSource[] = [
  // College Baseball
  {
    name: 'D1Baseball',
    url: 'https://d1baseball.com/feed/',
    sport: 'COLLEGE_BASEBALL',
  },
  {
    name: 'Baseball America',
    url: 'https://www.baseballamerica.com/college/feed/',
    sport: 'COLLEGE_BASEBALL',
  },

  // MLB
  {
    name: 'MLB News',
    url: 'https://www.mlb.com/feeds/news/rss.xml',
    sport: 'MLB',
  },

  // NFL
  {
    name: 'NFL News',
    url: 'https://www.nfl.com/feeds/rss/news',
    sport: 'NFL',
  },

  // NBA
  {
    name: 'NBA News',
    url: 'https://www.nba.com/news/rss.xml',
    sport: 'NBA',
  },

  // NCAA Football
  {
    name: 'ESPN College Football',
    url: 'https://www.espn.com/espn/rss/ncf/news',
    sport: 'NCAA_FOOTBALL',
  },

  // NCAA Basketball
  {
    name: 'ESPN College Basketball',
    url: 'https://www.espn.com/espn/rss/ncb/news',
    sport: 'NCAA_BASKETBALL',
  },

  // General Sports
  {
    name: 'ESPN Top Headlines',
    url: 'https://www.espn.com/espn/rss/news',
    sport: null,
  },
];

/**
 * Main worker entry point
 */
export default {
  /**
   * Scheduled trigger (cron)
   * Runs every 30 minutes to ingest latest news
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[News Ingestion] Scheduled run started:', new Date().toISOString());

    const startTime = Date.now();

    try {
      // Ingest from all RSS sources in parallel
      const results = await Promise.allSettled(
        NEWS_SOURCES.map((source) => ingestRSSFeed(env, source))
      );

      // Log aggregated results
      const aggregated = results.reduce(
        (acc, r) => {
          if (r.status === 'fulfilled') {
            acc.recordsProcessed += r.value.recordsProcessed;
            acc.recordsInserted += r.value.recordsInserted;
            acc.recordsSkipped += r.value.recordsSkipped;
            acc.recordsFailed += r.value.recordsFailed;
            acc.errors.push(...r.value.errors);
          }
          return acc;
        },
        { recordsProcessed: 0, recordsInserted: 0, recordsSkipped: 0, recordsFailed: 0, errors: [] as string[] }
      );

      await logIngestion(env, {
        jobType: 'news',
        sport: 'all',
        status: aggregated.errors.length > 0 ? 'partial' : 'success',
        recordsProcessed: aggregated.recordsProcessed,
        recordsInserted: aggregated.recordsInserted,
        recordsUpdated: 0,
        recordsFailed: aggregated.recordsFailed,
        errorMessage: aggregated.errors.length > 0 ? aggregated.errors.join('; ') : null,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        metadata: JSON.stringify({
          recordsSkipped: aggregated.recordsSkipped,
          sourcesProcessed: NEWS_SOURCES.length,
        }),
      });

      console.log(
        '[News Ingestion] Completed:',
        aggregated.recordsInserted,
        'inserted,',
        aggregated.recordsSkipped,
        'skipped (duplicates),',
        aggregated.recordsFailed,
        'failed in',
        Date.now() - startTime,
        'ms'
      );
    } catch (error) {
      console.error('[News Ingestion] Scheduled run failed:', error);
    }
  },

  /**
   * HTTP trigger for manual ingestion
   * GET /ingest?source={sourceName}
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          sources: NEWS_SOURCES.length,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Manual ingestion trigger
    if (url.pathname === '/ingest') {
      const sourceName = url.searchParams.get('source');
      const startTime = Date.now();

      try {
        let result: IngestResult;

        if (sourceName) {
          // Ingest specific source
          const source = NEWS_SOURCES.find((s) => s.name.toLowerCase() === sourceName.toLowerCase());

          if (!source) {
            return new Response(
              JSON.stringify({
                error: `Unknown source: ${sourceName}`,
                availableSources: NEWS_SOURCES.map((s) => s.name),
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }

          result = await ingestRSSFeed(env, source);
        } else {
          // Ingest all sources
          const results = await Promise.allSettled(NEWS_SOURCES.map((source) => ingestRSSFeed(env, source)));

          result = results.reduce(
            (acc, r) => {
              if (r.status === 'fulfilled') {
                acc.recordsProcessed += r.value.recordsProcessed;
                acc.recordsInserted += r.value.recordsInserted;
                acc.recordsSkipped += r.value.recordsSkipped;
                acc.recordsFailed += r.value.recordsFailed;
                acc.errors.push(...r.value.errors);
              }
              return acc;
            },
            { recordsProcessed: 0, recordsInserted: 0, recordsSkipped: 0, recordsFailed: 0, errors: [] as string[] }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            source: sourceName || 'all',
            durationMs: Date.now() - startTime,
            ...result,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('[News Ingestion] Manual trigger failed:', error);

        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // List available sources
    if (url.pathname === '/sources') {
      return new Response(
        JSON.stringify({
          success: true,
          sources: NEWS_SOURCES.map((s) => ({
            name: s.name,
            sport: s.sport || 'general',
            url: s.url,
          })),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Ingest a single RSS feed
 */
async function ingestRSSFeed(env: Env, source: NewsSource): Promise<IngestResult> {
  const result: IngestResult = {
    recordsProcessed: 0,
    recordsInserted: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    errors: [],
  };

  try {
    console.log(`[News Ingestion] Fetching ${source.name} from ${source.url}`);

    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'BlazeSportsIntel/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`RSS feed returned ${response.status}`);
    }

    const rssText = await response.text();
    const articles = parseRSS(rssText, source);

    result.recordsProcessed = articles.length;

    for (const article of articles) {
      try {
        // Generate content hash for deduplication
        const contentHash = await hashContent(article.title, article.description || '');

        // Check if article already exists
        const existing = await env.DB.prepare(
          'SELECT id FROM news_articles WHERE content_hash = ? OR url = ?'
        )
          .bind(contentHash, article.url)
          .first();

        if (existing) {
          result.recordsSkipped++;
          continue;
        }

        // Insert new article
        await env.DB.prepare(`
          INSERT INTO news_articles (
            title, url, description, content, source_name, author,
            sport, published_at, content_hash, image_url, metadata
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
          .bind(
            article.title,
            article.url,
            article.description || null,
            article.content || null,
            source.name,
            article.author || null,
            source.sport || null,
            article.publishedAt,
            contentHash,
            article.imageUrl || null,
            JSON.stringify({ source: source.name })
          )
          .run();

        result.recordsInserted++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(
          `${source.name} article "${article.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    console.log(
      `[News Ingestion] ${source.name}: ${result.recordsInserted} inserted, ${result.recordsSkipped} skipped, ${result.recordsFailed} failed`
    );
  } catch (error) {
    result.errors.push(`${source.name} feed failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error(`[News Ingestion] ${source.name} failed:`, error);
  }

  return result;
}

/**
 * Parse RSS feed XML
 */
function parseRSS(
  rssXml: string,
  source: NewsSource
): Array<{
  title: string;
  url: string;
  description?: string;
  content?: string;
  author?: string;
  publishedAt: string;
  imageUrl?: string;
}> {
  const articles: any[] = [];

  try {
    // Simple regex-based RSS parsing (lightweight for Workers)
    // Matches <item>...</item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
    const items = rssXml.matchAll(itemRegex);

    for (const item of items) {
      const itemContent = item[1];

      // Extract fields
      const title = extractTag(itemContent, 'title');
      const link = extractTag(itemContent, 'link');
      const description = extractTag(itemContent, 'description');
      const content = extractTag(itemContent, 'content:encoded') || extractTag(itemContent, 'content');
      const author = extractTag(itemContent, 'author') || extractTag(itemContent, 'dc:creator');
      const pubDate = extractTag(itemContent, 'pubDate');
      const imageUrl = extractImageUrl(itemContent);

      if (!title || !link) continue;

      articles.push({
        title: cleanHTML(title),
        url: link,
        description: description ? cleanHTML(description) : undefined,
        content: content ? cleanHTML(content) : undefined,
        author: author ? cleanHTML(author) : undefined,
        publishedAt: pubDate ? parseDate(pubDate) : new Date().toISOString(),
        imageUrl: imageUrl || undefined,
      });
    }
  } catch (error) {
    console.error('[RSS Parser] Error parsing RSS:', error);
  }

  return articles;
}

/**
 * Extract XML tag content
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract image URL from various RSS formats
 */
function extractImageUrl(xml: string): string | null {
  // Try media:thumbnail
  let match = xml.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
  if (match) return match[1];

  // Try enclosure
  match = xml.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/i);
  if (match) return match[1];

  // Try media:content
  match = xml.match(/<media:content[^>]+url="([^"]+)"[^>]+medium="image"/i);
  if (match) return match[1];

  return null;
}

/**
 * Clean HTML entities and tags
 */
function cleanHTML(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // Remove CDATA
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse RSS date to ISO string
 */
function parseDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Generate content hash for deduplication
 */
async function hashContent(title: string, description: string): Promise<string> {
  const content = `${title}${description.substring(0, 200)}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Log ingestion run
 */
async function logIngestion(
  env: Env,
  log: {
    jobType: string;
    sport: string;
    status: string;
    recordsProcessed: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsFailed: number;
    errorMessage: string | null;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    metadata?: string;
  }
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO ingestion_log (
      job_type, sport, status, records_processed, records_inserted,
      records_updated, records_failed, error_message,
      started_at, completed_at, duration_ms, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      log.jobType,
      log.sport,
      log.status,
      log.recordsProcessed,
      log.recordsInserted,
      log.recordsUpdated,
      log.recordsFailed,
      log.errorMessage,
      log.startedAt,
      log.completedAt,
      log.durationMs,
      log.metadata || null
    )
    .run();
}
