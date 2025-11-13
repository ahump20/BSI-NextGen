-- Blaze Trends Database Schema
-- Stores sports news trends identified by AI analysis

-- Trends table
CREATE TABLE IF NOT EXISTS trends (
  id TEXT PRIMARY KEY,                    -- Format: {sport}_{timestamp}_{hash}
  sport TEXT NOT NULL,                    -- Sport category (college_baseball, mlb, nfl, etc.)
  title TEXT NOT NULL,                    -- Trend title/headline
  summary TEXT NOT NULL,                  -- Brief summary of the trend
  context TEXT,                           -- Additional context and background
  key_players TEXT,                       -- JSON array of player names
  team_ids TEXT,                          -- JSON array of team IDs/names
  significance TEXT,                      -- Why this trend matters
  viral_score INTEGER DEFAULT 0,          -- Virality metric (0-100)
  sources TEXT NOT NULL,                  -- JSON array of source URLs with metadata
  created_at TEXT NOT NULL,               -- ISO 8601 timestamp
  updated_at TEXT NOT NULL                -- ISO 8601 timestamp
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_trends_sport ON trends(sport);
CREATE INDEX IF NOT EXISTS idx_trends_created_at ON trends(created_at);
CREATE INDEX IF NOT EXISTS idx_trends_viral_score ON trends(viral_score);
CREATE INDEX IF NOT EXISTS idx_trends_sport_created ON trends(sport, created_at);

-- News articles table (stores raw articles before trend analysis)
CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,                    -- Article URL hash
  url TEXT NOT NULL UNIQUE,               -- Original article URL
  title TEXT NOT NULL,                    -- Article title
  description TEXT,                       -- Article description/snippet
  published_at TEXT NOT NULL,             -- ISO 8601 timestamp
  source_name TEXT,                       -- Publisher name
  sport TEXT NOT NULL,                    -- Sport category
  content_hash TEXT,                      -- Hash for deduplication
  processed BOOLEAN DEFAULT 0,            -- Whether included in trend analysis
  created_at TEXT NOT NULL                -- When we fetched it
);

-- Create indexes for news articles
CREATE INDEX IF NOT EXISTS idx_articles_sport ON news_articles(sport);
CREATE INDEX IF NOT EXISTS idx_articles_published ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_processed ON news_articles(processed);
CREATE INDEX IF NOT EXISTS idx_articles_content_hash ON news_articles(content_hash);

-- Monitoring table (tracks system health and API usage)
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,                -- ISO 8601 timestamp
  event_type TEXT NOT NULL,               -- Type of event (fetch, analyze, error, etc.)
  sport TEXT,                             -- Related sport (if applicable)
  details TEXT,                           -- JSON with event details
  duration_ms INTEGER,                    -- Operation duration in milliseconds
  success BOOLEAN DEFAULT 1               -- Whether operation succeeded
);

-- Create index for monitoring logs
CREATE INDEX IF NOT EXISTS idx_monitoring_timestamp ON monitoring_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitoring_event_type ON monitoring_logs(event_type);
