import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Types for Cloudflare bindings
type Bindings = {
  DB: D1Database;
  BLAZE_TRENDS_CACHE: KVNamespace;
  OPENAI_API_KEY: string;
  BRAVE_API_KEY: string;
};

type Variables = {
  startTime: number;
};

// Initialize Hono app
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use('*', cors());
app.use('*', async (c, next) => {
  c.set('startTime', Date.now());
  await next();
});

// Types
interface Trend {
  id: string;
  sport: string;
  title: string;
  summary: string;
  context: string;
  keyPlayers: string[];
  teamIds: string[];
  significance: string;
  viralScore: number;
  sources: Source[];
  createdAt: string;
  updatedAt: string;
}

interface Source {
  url: string;
  title: string;
  publishedAt: string;
  sourceName: string;
}

interface NewsArticle {
  id: string;
  url: string;
  title: string;
  description: string;
  publishedAt: string;
  sourceName: string;
  sport: string;
}

// Sports configuration
const SPORTS_CONFIG = {
  college_baseball: {
    keywords: ['college baseball', 'NCAA baseball', 'D1 baseball', 'CWS', 'College World Series'],
    priority: 1,
  },
  mlb: {
    keywords: ['MLB', 'Major League Baseball', 'baseball'],
    priority: 2,
  },
  nfl: {
    keywords: ['NFL', 'National Football League', 'football'],
    priority: 3,
  },
  college_football: {
    keywords: ['college football', 'NCAA football', 'FCS', 'Group of Five'],
    priority: 4,
  },
  college_basketball: {
    keywords: ['college basketball', 'NCAA basketball', 'March Madness'],
    priority: 5,
  },
};

// Exclusions
const EXCLUDED_KEYWORDS = ['soccer', 'football' /* when context is soccer */, 'premier league', 'champions league', 'la liga', 'serie a', 'bundesliga'];

// ============================================================================
// API Routes
// ============================================================================

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all trends or filtered by sport
app.get('/api/trends', async (c) => {
  const sport = c.req.query('sport');
  const limit = Math.min(parseInt(c.req.query('limit') || '10'), 50);

  try {
    // Try cache first
    const cacheKey = `trends:${sport || 'all'}:${limit}`;
    const cached = await c.env.BLAZE_TRENDS_CACHE.get(cacheKey);

    if (cached) {
      return c.json({
        trends: JSON.parse(cached),
        cached: true,
      });
    }

    // Query database
    let query = `
      SELECT * FROM trends
      ${sport ? 'WHERE sport = ?' : ''}
      ORDER BY created_at DESC, viral_score DESC
      LIMIT ?
    `;

    const params = sport ? [sport, limit] : [limit];
    const result = await c.env.DB.prepare(query).bind(...params).all();

    const trends = result.results.map(formatTrend);

    // Cache for 5 minutes
    await c.env.BLAZE_TRENDS_CACHE.put(cacheKey, JSON.stringify(trends), {
      expirationTtl: 300,
    });

    return c.json({
      trends,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching trends:', error);
    return c.json({ error: 'Failed to fetch trends' }, 500);
  }
});

// Get specific trend by ID
app.get('/api/trends/:id', async (c) => {
  const id = c.req.param('id');

  try {
    // Try cache first
    const cacheKey = `trend:${id}`;
    const cached = await c.env.BLAZE_TRENDS_CACHE.get(cacheKey);

    if (cached) {
      return c.json({
        trend: JSON.parse(cached),
        cached: true,
      });
    }

    const result = await c.env.DB.prepare('SELECT * FROM trends WHERE id = ?')
      .bind(id)
      .first();

    if (!result) {
      return c.json({ error: 'Trend not found' }, 404);
    }

    const trend = formatTrend(result);

    // Cache for 10 minutes
    await c.env.BLAZE_TRENDS_CACHE.put(cacheKey, JSON.stringify(trend), {
      expirationTtl: 600,
    });

    return c.json({
      trend,
      cached: false,
    });
  } catch (error) {
    console.error('Error fetching trend:', error);
    return c.json({ error: 'Failed to fetch trend' }, 500);
  }
});

// Cron monitoring endpoint
app.get('/cron/monitor', async (c) => {
  const startTime = Date.now();

  try {
    console.log('Starting trend monitoring...');

    // Process each sport
    const results = await Promise.all(
      Object.keys(SPORTS_CONFIG).map(sport => processSport(sport, c.env))
    );

    const duration = Date.now() - startTime;

    // Log monitoring event
    await logMonitoringEvent(c.env.DB, {
      eventType: 'monitor_complete',
      details: JSON.stringify({ results }),
      durationMs: duration,
      success: true,
    });

    // Invalidate cache
    await invalidateCache(c.env.BLAZE_TRENDS_CACHE);

    return c.json({
      success: true,
      duration,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Monitoring error:', error);

    await logMonitoringEvent(c.env.DB, {
      eventType: 'monitor_error',
      details: JSON.stringify({ error: String(error) }),
      durationMs: Date.now() - startTime,
      success: false,
    });

    return c.json({ error: 'Monitoring failed' }, 500);
  }
});

// ============================================================================
// Core Functions
// ============================================================================

async function processSport(sport: string, env: Bindings): Promise<any> {
  const startTime = Date.now();

  try {
    console.log(`Processing ${sport}...`);

    // 1. Fetch news from Brave Search
    const articles = await fetchNewsArticles(sport, env.BRAVE_API_KEY);
    console.log(`Found ${articles.length} articles for ${sport}`);

    if (articles.length === 0) {
      return { sport, articles: 0, trends: 0, duration: Date.now() - startTime };
    }

    // 2. Store articles in database
    await storeArticles(env.DB, articles, sport);

    // 3. Analyze with OpenAI
    const trends = await analyzeWithAI(articles, sport, env.OPENAI_API_KEY);
    console.log(`Generated ${trends.length} trends for ${sport}`);

    // 4. Store trends in database
    await storeTrends(env.DB, trends);

    return {
      sport,
      articles: articles.length,
      trends: trends.length,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error(`Error processing ${sport}:`, error);
    return {
      sport,
      error: String(error),
      duration: Date.now() - startTime,
    };
  }
}

async function fetchNewsArticles(sport: string, apiKey: string): Promise<NewsArticle[]> {
  const config = SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG];
  if (!config) return [];

  const searchQuery = config.keywords.join(' OR ');
  const excludeQuery = EXCLUDED_KEYWORDS.map(kw => `-${kw}`).join(' ');
  const fullQuery = `${searchQuery} ${excludeQuery}`;

  const url = new URL('https://api.search.brave.com/res/v1/news/search');
  url.searchParams.set('q', fullQuery);
  url.searchParams.set('count', '20');
  url.searchParams.set('freshness', 'pd'); // Past day

  const response = await fetch(url.toString(), {
    headers: {
      'X-Subscription-Token': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Brave API error: ${response.status}`);
  }

  const data = await response.json() as { results?: any[] };

  return (data.results || []).map((article: any) => ({
    id: hashString(article.url),
    url: article.url,
    title: article.title,
    description: article.description || '',
    publishedAt: article.age || new Date().toISOString(),
    sourceName: article.meta_url?.hostname || 'Unknown',
    sport,
  }));
}

async function analyzeWithAI(articles: NewsArticle[], sport: string, apiKey: string): Promise<Trend[]> {
  if (articles.length === 0) return [];

  const prompt = `You are a sports news analyst for Blaze Sports Intel. Analyze the following ${sport} news articles and identify 1-3 significant trending storylines.

Focus on:
- Major upsets or surprising performances
- Milestone achievements
- Playoff implications
- Underrepresented programs (FCS, Group of Five, D1 baseball)
- Emerging players or breakout performances

Articles:
${articles.slice(0, 10).map((a, i) => `${i + 1}. ${a.title}\n   ${a.description}\n   Source: ${a.sourceName}`).join('\n\n')}

Return a JSON array with this exact structure:
[
  {
    "title": "Clear, engaging headline",
    "summary": "2-3 sentence summary of the trend",
    "context": "Background information and why it matters",
    "keyPlayers": ["Player Name 1", "Player Name 2"],
    "teamIds": ["Team1", "Team2"],
    "significance": "Why this is significant",
    "viralScore": 75
  }
]

Rules:
- Return valid JSON only, no markdown or explanations
- viralScore: 0-100 based on significance and interest
- Include 1-3 trends maximum
- Be specific with player and team names
- Empty array if no significant trends`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a professional sports news analyst. Always respond with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content || '[]';

  // Parse JSON response
  let parsedTrends;
  try {
    parsedTrends = JSON.parse(content);
  } catch (error) {
    console.error('Failed to parse AI response:', content);
    return [];
  }

  // Format trends
  const timestamp = Date.now();
  return parsedTrends.map((trend: any, index: number) => ({
    id: `${sport}_${timestamp}_${hashString(trend.title)}`,
    sport,
    title: trend.title,
    summary: trend.summary,
    context: trend.context || '',
    keyPlayers: trend.keyPlayers || [],
    teamIds: trend.teamIds || [],
    significance: trend.significance || '',
    viralScore: trend.viralScore || 50,
    sources: articles.slice(0, 5).map(a => ({
      url: a.url,
      title: a.title,
      publishedAt: a.publishedAt,
      sourceName: a.sourceName,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

async function storeArticles(db: D1Database, articles: NewsArticle[], sport: string) {
  const timestamp = new Date().toISOString();

  for (const article of articles) {
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO news_articles
        (id, url, title, description, published_at, source_name, sport, content_hash, processed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).bind(
        article.id,
        article.url,
        article.title,
        article.description,
        article.publishedAt,
        article.sourceName,
        sport,
        hashString(article.title + article.description),
        timestamp
      ).run();
    } catch (error) {
      console.error('Error storing article:', error);
    }
  }
}

async function storeTrends(db: D1Database, trends: Trend[]) {
  for (const trend of trends) {
    try {
      await db.prepare(`
        INSERT OR REPLACE INTO trends
        (id, sport, title, summary, context, key_players, team_ids, significance, viral_score, sources, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        trend.id,
        trend.sport,
        trend.title,
        trend.summary,
        trend.context,
        JSON.stringify(trend.keyPlayers),
        JSON.stringify(trend.teamIds),
        trend.significance,
        trend.viralScore,
        JSON.stringify(trend.sources),
        trend.createdAt,
        trend.updatedAt
      ).run();

      console.log(`Stored trend: ${trend.id}`);
    } catch (error) {
      console.error('Error storing trend:', error);
    }
  }
}

async function logMonitoringEvent(db: D1Database, event: {
  eventType: string;
  sport?: string;
  details?: string;
  durationMs?: number;
  success: boolean;
}) {
  try {
    await db.prepare(`
      INSERT INTO monitoring_logs
      (timestamp, event_type, sport, details, duration_ms, success)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      new Date().toISOString(),
      event.eventType,
      event.sport || null,
      event.details || null,
      event.durationMs || null,
      event.success ? 1 : 0
    ).run();
  } catch (error) {
    console.error('Error logging monitoring event:', error);
  }
}

async function invalidateCache(kv: KVNamespace) {
  // List and delete all trend cache keys
  const keys = ['trends:all:10', 'trends:all:20', 'trends:all:50'];
  Object.keys(SPORTS_CONFIG).forEach(sport => {
    keys.push(`trends:${sport}:10`);
    keys.push(`trends:${sport}:20`);
    keys.push(`trends:${sport}:50`);
  });

  await Promise.all(keys.map(key => kv.delete(key)));
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTrend(row: any): Trend {
  return {
    id: row.id,
    sport: row.sport,
    title: row.title,
    summary: row.summary,
    context: row.context || '',
    keyPlayers: JSON.parse(row.key_players || '[]'),
    teamIds: JSON.parse(row.team_ids || '[]'),
    significance: row.significance || '',
    viralScore: row.viral_score || 0,
    sources: JSON.parse(row.sources || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Scheduled/Cron Handler
// ============================================================================

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    return app.fetch(request, env);
  },

  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext): Promise<void> {
    // Run monitoring job every 15 minutes
    console.log('Cron triggered at:', new Date(event.scheduledTime).toISOString());

    ctx.waitUntil(
      (async () => {
        try {
          const results = await Promise.all(
            Object.keys(SPORTS_CONFIG).map(sport => processSport(sport, env))
          );

          await logMonitoringEvent(env.DB, {
            eventType: 'cron_complete',
            details: JSON.stringify({ results }),
            success: true,
          });

          await invalidateCache(env.BLAZE_TRENDS_CACHE);

          console.log('Cron completed successfully');
        } catch (error) {
          console.error('Cron error:', error);

          await logMonitoringEvent(env.DB, {
            eventType: 'cron_error',
            details: JSON.stringify({ error: String(error) }),
            success: false,
          });
        }
      })()
    );
  },
};
