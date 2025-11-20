-- Seed 001: Initial Content Sources
-- Created: January 2025
-- Description: Populate content_sources with initial RSS feeds and APIs

-- ============================================================================
-- MLB Sources
-- ============================================================================

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  ('espn-mlb', 'ESPN MLB', 'rss', 'https://www.espn.com/espn/rss/mlb/news', 90, 300),
  ('mlb-news', 'MLB.com News', 'rss', 'https://www.mlb.com/feeds/news/rss.xml', 95, 300),
  ('mlb-rumors', 'MLB Trade Rumors', 'rss', 'https://www.mlbtraderumors.com/feed', 80, 600);

-- ============================================================================
-- NFL Sources
-- ============================================================================

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  ('espn-nfl', 'ESPN NFL', 'rss', 'https://www.espn.com/espn/rss/nfl/news', 90, 300),
  ('nfl-news', 'NFL.com News', 'rss', 'https://www.nfl.com/feeds/news/rss.xml', 95, 300),
  ('profootballtalk', 'Pro Football Talk', 'rss', 'https://profootballtalk.nbcsports.com/feed/', 85, 300);

-- ============================================================================
-- NBA Sources
-- ============================================================================

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  ('espn-nba', 'ESPN NBA', 'rss', 'https://www.espn.com/espn/rss/nba/news', 90, 300),
  ('nba-news', 'NBA.com News', 'rss', 'https://www.nba.com/news/rss.xml', 95, 300);

-- ============================================================================
-- NCAA Football Sources
-- ============================================================================

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  ('espn-ncaa-football', 'ESPN College Football', 'rss', 'https://www.espn.com/espn/rss/ncf/news', 90, 300),
  ('on3-cfb', 'On3 College Football', 'rss', 'https://www.on3.com/feed/', 80, 600);

-- ============================================================================
-- College Baseball Sources (HIGH PRIORITY - ESPN Gap Filler)
-- ============================================================================

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  ('d1baseball', 'D1Baseball', 'rss', 'https://d1baseball.com/feed/', 90, 300),
  ('baseball-america-college', 'Baseball America College', 'rss', 'https://www.baseballamerica.com/college/feed/', 85, 600),
  ('perfect-game-news', 'Perfect Game News', 'rss', 'https://www.perfectgame.org/news/rss.aspx', 80, 600);

-- ============================================================================
-- General Sports News
-- ============================================================================

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  ('athletic-general', 'The Athletic', 'rss', 'https://theathletic.com/feed/', 95, 300),
  ('sports-illustrated', 'Sports Illustrated', 'rss', 'https://www.si.com/rss/', 85, 600);

-- ============================================================================
-- Regional Sports (Texas Focus)
-- ============================================================================

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  ('texas-longhorns', 'Texas Longhorns Official', 'rss', 'https://texassports.com/rss.aspx?path=general', 90, 300),
  ('burnt-orange-nation', 'Burnt Orange Nation', 'rss', 'https://www.burntorangenation.com/rss/current', 75, 600);
