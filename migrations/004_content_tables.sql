-- Migration 004: Content Tables for News & Content Aggregation
-- Created: January 2025
-- Description: Adds tables for news aggregation, AI analysis, and trending topics

-- ============================================================================
-- Content Sources
-- ============================================================================

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

-- ============================================================================
-- Content Articles
-- ============================================================================

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
  url TEXT NOT NULL UNIQUE,
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
CREATE INDEX idx_articles_url ON content_articles(url);
CREATE UNIQUE INDEX idx_articles_source_external ON content_articles(source_id, external_id) WHERE external_id IS NOT NULL;

-- ============================================================================
-- Content Topics
-- ============================================================================

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
CREATE INDEX idx_topics_combined ON content_topics(topic_type, topic_value);

-- ============================================================================
-- Trending Topics
-- ============================================================================

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
CREATE INDEX idx_trending_updated ON trending_topics(updated_at DESC);
CREATE UNIQUE INDEX idx_trending_unique ON trending_topics(topic_value, topic_type, window_start);

-- ============================================================================
-- User Content Preferences (Future)
-- ============================================================================

-- user_content_prefs: User preferences for content (requires auth integration)
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

-- ============================================================================
-- Content Ingestion Logs
-- ============================================================================

-- content_ingestion_logs: Track content ingestion jobs
CREATE TABLE IF NOT EXISTS content_ingestion_logs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  articles_fetched INTEGER NOT NULL DEFAULT 0,
  articles_inserted INTEGER NOT NULL DEFAULT 0,
  articles_updated INTEGER NOT NULL DEFAULT 0,
  articles_failed INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (source_id) REFERENCES content_sources(id) ON DELETE CASCADE
);

CREATE INDEX idx_content_logs_source ON content_ingestion_logs(source_id);
CREATE INDEX idx_content_logs_started ON content_ingestion_logs(started_at DESC);

-- ============================================================================
-- Cleanup Trigger: Remove old trending topics (> 24 hours)
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS cleanup_old_trending
AFTER INSERT ON trending_topics
BEGIN
  DELETE FROM trending_topics
  WHERE window_end < unixepoch() - 86400; -- 24 hours
END;
