# Phase 16: News & Content Aggregation Layer

**Status:** Planning
**Started:** January 2025
**Target Completion:** Week of January 27, 2025
**Dependencies:** Phase 15 (D1 Schema & Data Ingestion) ✅

---

## Executive Summary

Phase 16 implements a **comprehensive news and content aggregation system** for Blaze Sports Intel. This phase transforms the platform from pure data delivery to a complete sports intelligence hub by adding news, highlights, analysis, and real-time alerts.

### Goals

1. **Aggregate Sports News** from multiple sources (ESPN, The Athletic, team sites)
2. **Detect Trending Topics** using AI-powered analysis
3. **Generate Content Feeds** personalized by team/league/topic
4. **Deliver Real-Time Alerts** for breaking news and game events
5. **Create Analytics Summaries** with AI-generated insights

### Success Metrics

- ✅ News articles ingested from 3+ sources per sport
- ✅ Trending topics detected within 5 minutes of breaking
- ✅ <100ms response time for feed generation
- ✅ 90%+ accuracy in content categorization
- ✅ Real-time alerts delivered <30 seconds of event
- ✅ User engagement: 50%+ click-through on recommended content

---

## Architecture Overview

### Data Flow

```
News Sources → Content Workers → D1 Database → AI Analysis → Content Feeds → Client
     ↓              ↓                 ↓             ↓              ↓
 RSS/API      Normalization      Storage      Categorization  Personalization
```

### Components

1. **Content Ingestion Workers**
   - Scheduled cron triggers (every 5 minutes)
   - RSS feed parsing
   - API integrations (ESPN, The Athletic)
   - Web scraping (team sites, beat reporters)

2. **AI Content Analysis** (Workers AI)
   - Topic extraction and categorization
   - Sentiment analysis (positive/negative/neutral)
   - Entity recognition (players, teams, coaches)
   - Trending topic detection

3. **Content Feed API**
   - `/api/content/feed` - Personalized content stream
   - `/api/content/trending` - Trending topics
   - `/api/content/highlights` - Game highlights and summaries
   - `/api/content/alerts` - Real-time breaking news

4. **Real-Time Alert System**
   - WebSocket connections for live updates
   - Push notifications (future: mobile apps)
   - Email digests (daily/weekly summaries)

---

## Database Schema Extensions

### Migration 004: Content Tables

```sql
-- content_sources: News and content providers
CREATE TABLE IF NOT EXISTS content_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'rss', 'api', 'scraper'
  url TEXT NOT NULL,
  credibility_score INTEGER NOT NULL DEFAULT 50, -- 0-100
  last_fetched_at INTEGER,
  fetch_interval_seconds INTEGER NOT NULL DEFAULT 300, -- 5 minutes
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_content_sources_type ON content_sources(type);
CREATE INDEX idx_content_sources_active ON content_sources(is_active);
CREATE INDEX idx_content_sources_fetch ON content_sources(last_fetched_at);

-- content_articles: News articles and content
CREATE TABLE IF NOT EXISTS content_articles (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  external_id TEXT, -- Source's article ID
  title TEXT NOT NULL,
  excerpt TEXT,
  content_html TEXT,
  author TEXT,
  published_at INTEGER NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,

  -- AI-Generated Metadata
  category TEXT, -- 'news', 'analysis', 'rumor', 'injury', 'trade'
  sentiment TEXT, -- 'positive', 'neutral', 'negative'
  trending_score REAL DEFAULT 0.0,

  -- Relationships
  league_id TEXT,
  team_ids TEXT, -- JSON array of team IDs
  player_names TEXT, -- JSON array of player names

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (source_id) REFERENCES content_sources(id) ON DELETE CASCADE,
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL
);

CREATE INDEX idx_articles_source ON content_articles(source_id);
CREATE INDEX idx_articles_published ON content_articles(published_at DESC);
CREATE INDEX idx_articles_category ON content_articles(category);
CREATE INDEX idx_articles_sentiment ON content_articles(sentiment);
CREATE INDEX idx_articles_trending ON content_articles(trending_score DESC);
CREATE INDEX idx_articles_league ON content_articles(league_id);
CREATE UNIQUE INDEX idx_articles_source_external ON content_articles(source_id, external_id);

-- content_topics: Extracted topics and entities
CREATE TABLE IF NOT EXISTS content_topics (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  topic_type TEXT NOT NULL, -- 'team', 'player', 'coach', 'keyword'
  topic_value TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.0, -- 0.0-1.0
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (article_id) REFERENCES content_articles(id) ON DELETE CASCADE
);

CREATE INDEX idx_topics_article ON content_topics(article_id);
CREATE INDEX idx_topics_type ON content_topics(topic_type);
CREATE INDEX idx_topics_value ON content_topics(topic_value);
CREATE INDEX idx_topics_confidence ON content_topics(confidence DESC);

-- trending_topics: Real-time trending analysis
CREATE TABLE IF NOT EXISTS trending_topics (
  id TEXT PRIMARY KEY,
  topic_value TEXT NOT NULL,
  topic_type TEXT NOT NULL,
  league_id TEXT,

  -- Trending Metrics
  article_count INTEGER NOT NULL DEFAULT 0,
  velocity REAL NOT NULL DEFAULT 0.0, -- Articles per hour
  peak_at INTEGER, -- Unix timestamp of peak
  sentiment_avg REAL DEFAULT 0.0, -- -1.0 to 1.0

  -- Time Windows
  window_start INTEGER NOT NULL,
  window_end INTEGER NOT NULL,

  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL
);

CREATE INDEX idx_trending_topic ON trending_topics(topic_value);
CREATE INDEX idx_trending_league ON trending_topics(league_id);
CREATE INDEX idx_trending_velocity ON trending_topics(velocity DESC);
CREATE INDEX idx_trending_window ON trending_topics(window_start, window_end);

-- user_content_prefs: User preferences for content (future)
CREATE TABLE IF NOT EXISTS user_content_prefs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL, -- Future: Auth integration
  favorite_teams TEXT, -- JSON array
  favorite_players TEXT, -- JSON array
  preferred_categories TEXT, -- JSON array
  notification_settings TEXT, -- JSON object
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_user_prefs_user ON user_content_prefs(user_id);
CREATE UNIQUE INDEX idx_user_prefs_unique ON user_content_prefs(user_id);
```

---

## Content Ingestion Architecture

### Worker Structure

```
cloudflare-workers/
└── blaze-content/
    ├── src/
    │   ├── index.ts               # Main worker entry
    │   ├── ingestors/
    │   │   ├── rss-ingestor.ts    # RSS feed parsing
    │   │   ├── espn-ingestor.ts   # ESPN API integration
    │   │   └── scraper-ingestor.ts # Web scraping
    │   ├── analyzers/
    │   │   ├── topic-extractor.ts  # AI topic extraction
    │   │   ├── sentiment.ts        # Sentiment analysis
    │   │   └── trending.ts         # Trending detection
    │   └── utils/
    │       ├── html-parser.ts      # HTML to text conversion
    │       └── deduplication.ts    # Duplicate detection
    ├── wrangler.toml
    └── package.json
```

### Main Content Worker

```typescript
/**
 * Blaze Content Aggregation Worker
 *
 * Scheduled worker that aggregates sports news and content
 * from multiple sources, analyzes with AI, and stores in D1.
 *
 * Runs every 5 minutes via Cron Trigger
 */

export interface Env {
  BLAZE_DB: D1Database;
  SPORTS_CACHE: KVNamespace;
  AI: Ai; // Workers AI binding
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
    });

    const startTime = Date.now();

    // Get active content sources
    const sources = await env.BLAZE_DB.prepare(
      `SELECT * FROM content_sources
       WHERE is_active = 1
       AND (last_fetched_at IS NULL OR last_fetched_at < unixepoch() - fetch_interval_seconds)
       ORDER BY last_fetched_at ASC NULLS FIRST
       LIMIT 20`
    ).all<ContentSource>();

    const results = {
      fetched: 0,
      inserted: 0,
      analyzed: 0,
      errors: [] as string[],
    };

    // Process each source
    for (const source of sources.results) {
      try {
        let articles: Article[] = [];

        // Fetch based on source type
        switch (source.type) {
          case 'rss':
            articles = await new RSSIngestor().fetch(source.url);
            break;
          case 'api':
            articles = await new ESPNIngestor().fetch(source.url);
            break;
          case 'scraper':
            articles = await new ScraperIngestor().fetch(source.url);
            break;
        }

        results.fetched += articles.length;

        // Insert new articles
        for (const article of articles) {
          try {
            const inserted = await this.upsertArticle(env.BLAZE_DB, source.id, article);
            if (inserted) {
              results.inserted++;

              // Analyze with AI
              ctx.waitUntil(this.analyzeArticle(env, inserted.id));
              results.analyzed++;
            }
          } catch (error) {
            console.error('[Content] Failed to insert article:', article.title, error);
            results.errors.push(`Article insert failed: ${article.title}`);
          }
        }

        // Update source last_fetched_at
        await env.BLAZE_DB.prepare(
          'UPDATE content_sources SET last_fetched_at = unixepoch() WHERE id = ?'
        )
          .bind(source.id)
          .run();

      } catch (error) {
        console.error(`[Content] Source fetch failed:`, source.name, error);
        results.errors.push(`Source ${source.name}: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    const duration = Date.now() - startTime;

    console.log('[Content] Completed scheduled job', {
      duration: `${duration}ms`,
      results,
    });

    // Update trending topics
    ctx.waitUntil(this.updateTrendingTopics(env));
  },

  /**
   * Upsert article (insert or skip if duplicate)
   */
  async upsertArticle(
    db: D1Database,
    sourceId: string,
    article: Article
  ): Promise<{ id: string } | null> {
    const articleId = crypto.randomUUID();

    // Check for duplicate by URL
    const existing = await db
      .prepare('SELECT id FROM content_articles WHERE url = ?')
      .bind(article.url)
      .first<{ id: string }>();

    if (existing) {
      console.log('[Content] Skipping duplicate article:', article.title);
      return null;
    }

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
        article.externalId,
        article.title,
        article.excerpt,
        article.contentHtml,
        article.author,
        Math.floor(new Date(article.publishedAt).getTime() / 1000),
        article.url,
        article.imageUrl,
        article.leagueId
      )
      .run();

    console.log('[Content] Inserted article:', articleId, article.title);
    return { id: articleId };
  },

  /**
   * Analyze article with Workers AI
   */
  async analyzeArticle(env: Env, articleId: string): Promise<void> {
    const article = await env.BLAZE_DB.prepare(
      'SELECT * FROM content_articles WHERE id = ?'
    )
      .bind(articleId)
      .first<Article>();

    if (!article) return;

    try {
      // Extract topics and entities using Workers AI
      const analysis = await env.AI.run('@cf/meta/llama-3-8b-instruct', {
        prompt: `Analyze this sports article and extract:
1. Category (news, analysis, rumor, injury, trade)
2. Sentiment (positive, neutral, negative)
3. Key topics (teams, players, events)
4. Trending potential (0-100)

Article: "${article.title}"
${article.excerpt}

Return JSON with: category, sentiment, topics[], trending_score`,
      });

      const result = JSON.parse(analysis.response);

      // Update article with AI analysis
      await env.BLAZE_DB.prepare(
        `UPDATE content_articles
         SET category = ?, sentiment = ?, trending_score = ?, updated_at = unixepoch()
         WHERE id = ?`
      )
        .bind(result.category, result.sentiment, result.trending_score, articleId)
        .run();

      // Insert extracted topics
      for (const topic of result.topics) {
        await env.BLAZE_DB.prepare(
          `INSERT INTO content_topics
           (id, article_id, topic_type, topic_value, confidence)
           VALUES (?, ?, ?, ?, ?)`
        )
          .bind(
            crypto.randomUUID(),
            articleId,
            topic.type,
            topic.value,
            topic.confidence
          )
          .run();
      }

      console.log('[Content] Analyzed article:', articleId, result);
    } catch (error) {
      console.error('[Content] AI analysis failed:', articleId, error);
    }
  },

  /**
   * Update trending topics based on recent articles
   */
  async updateTrendingTopics(env: Env): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;

    // Get topics from recent articles
    const recentTopics = await env.BLAZE_DB.prepare(
      `SELECT
        t.topic_value,
        t.topic_type,
        a.league_id,
        COUNT(*) as article_count,
        AVG(CASE a.sentiment
          WHEN 'positive' THEN 1.0
          WHEN 'neutral' THEN 0.0
          WHEN 'negative' THEN -1.0
        END) as sentiment_avg
       FROM content_topics t
       JOIN content_articles a ON t.article_id = a.id
       WHERE a.published_at > ?
       GROUP BY t.topic_value, t.topic_type, a.league_id
       HAVING COUNT(*) >= 3
       ORDER BY COUNT(*) DESC
       LIMIT 100`
    )
      .bind(oneHourAgo)
      .all();

    // Upsert trending topics
    for (const topic of recentTopics.results) {
      const velocity = topic.article_count; // Articles per hour
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
          topic.sentiment_avg,
          oneHourAgo,
          now
        )
        .run();
    }

    console.log('[Content] Updated trending topics:', recentTopics.results.length);
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

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { status: 200 });
    }

    // Get personalized content feed
    if (url.pathname === '/api/content/feed') {
      const league = url.searchParams.get('league');
      const category = url.searchParams.get('category');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      let query = `
        SELECT a.*, s.name as source_name, s.credibility_score
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

      query += ' ORDER BY a.published_at DESC LIMIT ?';
      bindings.push(limit);

      const articles = await env.BLAZE_DB.prepare(query).bind(...bindings).all();

      return new Response(
        JSON.stringify({
          articles: articles.results,
          meta: {
            league,
            category,
            count: articles.results.length,
            lastUpdated: new Date().toISOString(),
          },
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60',
          },
        }
      );
    }

    // Get trending topics
    if (url.pathname === '/api/content/trending') {
      const league = url.searchParams.get('league');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      let query = `
        SELECT * FROM trending_topics
        WHERE 1=1
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
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30',
          },
        }
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

---

## Content Sources Configuration

### Initial Content Sources

```typescript
const INITIAL_SOURCES: ContentSource[] = [
  // MLB Sources
  {
    id: 'espn-mlb',
    name: 'ESPN MLB',
    type: 'rss',
    url: 'https://www.espn.com/espn/rss/mlb/news',
    credibility_score: 90,
    fetch_interval_seconds: 300, // 5 minutes
  },
  {
    id: 'mlb-news',
    name: 'MLB.com News',
    type: 'rss',
    url: 'https://www.mlb.com/feeds/news/rss.xml',
    credibility_score: 95,
    fetch_interval_seconds: 300,
  },

  // NFL Sources
  {
    id: 'espn-nfl',
    name: 'ESPN NFL',
    type: 'rss',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    credibility_score: 90,
    fetch_interval_seconds: 300,
  },
  {
    id: 'nfl-news',
    name: 'NFL.com News',
    type: 'rss',
    url: 'https://www.nfl.com/feeds/news/rss.xml',
    credibility_score: 95,
    fetch_interval_seconds: 300,
  },

  // NBA Sources
  {
    id: 'espn-nba',
    name: 'ESPN NBA',
    type: 'rss',
    url: 'https://www.espn.com/espn/rss/nba/news',
    credibility_score: 90,
    fetch_interval_seconds: 300,
  },

  // NCAA Football Sources
  {
    id: 'espn-ncaa-football',
    name: 'ESPN College Football',
    type: 'rss',
    url: 'https://www.espn.com/espn/rss/ncf/news',
    credibility_score: 90,
    fetch_interval_seconds: 300,
  },

  // College Baseball Sources (High Priority - ESPN Gap Filler)
  {
    id: 'd1baseball',
    name: 'D1Baseball',
    type: 'rss',
    url: 'https://d1baseball.com/feed/',
    credibility_score: 85,
    fetch_interval_seconds: 300,
  },
  {
    id: 'baseball-america-college',
    name: 'Baseball America College',
    type: 'rss',
    url: 'https://www.baseballamerica.com/college/feed/',
    credibility_score: 85,
    fetch_interval_seconds: 600, // 10 minutes
  },
];
```

---

## Deployment Plan

### Step 1: Create Content Sources Table

```bash
# Apply migration 004
npx wrangler d1 execute blaze-sports-db --remote --file=migrations/004_content_tables.sql

# Seed initial content sources
npx wrangler d1 execute blaze-sports-db --remote --file=seeds/001_content_sources.sql
```

### Step 2: Deploy Content Worker

```bash
# Deploy content aggregation worker
cd cloudflare-workers/blaze-content
npx wrangler deploy

# Verify deployment
curl https://blaze-content.your-subdomain.workers.dev/health

# Test content feed
curl https://blaze-content.your-subdomain.workers.dev/api/content/feed?league=mlb
```

### Step 3: Enable Workers AI

```toml
# wrangler.toml
[ai]
binding = "AI"
```

### Step 4: Monitor Content Ingestion

```bash
# Tail logs
npx wrangler tail blaze-content

# Query content stats
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT source_id, COUNT(*) FROM content_articles GROUP BY source_id"

# View trending topics
npx wrangler d1 execute blaze-sports-db --remote \
  --command="SELECT * FROM trending_topics ORDER BY velocity DESC LIMIT 10"
```

---

## Success Criteria

- [ ] Content sources configured for all 4 sports
- [ ] Content ingestion worker deployed and running every 5 minutes
- [ ] At least 100 articles ingested per day
- [ ] AI analysis successfully categorizing 90%+ of articles
- [ ] Trending topics updated hourly
- [ ] Content feed API responding <100ms
- [ ] Duplicate detection preventing >95% of duplicates
- [ ] College baseball content prioritized (ESPN gap filler)

---

## Next Steps (Phase 17)

1. **Predictive Analytics** - ML models for game predictions
2. **User Authentication** - User accounts and preferences
3. **Personalization Engine** - Custom feeds and recommendations
4. **Mobile Push Notifications** - Real-time alerts for breaking news

---

**Phase 16 Status:** Planning
**Last Updated:** January 2025
**Document Version:** 1.0
