-- Seed file: API and Scraper Content Sources
-- Adds ESPN API sources and team site scrapers to complement RSS feeds
-- Run after: 001_content_sources.sql

-- ESPN API Sources (Direct API Integration)
-- These fetch from ESPN's public APIs for more reliable news delivery

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  -- MLB
  ('espn-api-mlb', 'ESPN MLB API', 'api', 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news', 95, 300),

  -- NFL
  ('espn-api-nfl', 'ESPN NFL API', 'api', 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news', 95, 300),

  -- NBA
  ('espn-api-nba', 'ESPN NBA API', 'api', 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news', 95, 300),

  -- NCAA Football
  ('espn-api-ncaa-football', 'ESPN College Football API', 'api', 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/news', 95, 300),

  -- College Baseball (HIGH PRIORITY - ESPN Gap Filler)
  ('espn-api-college-baseball', 'ESPN College Baseball API', 'api', 'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/news', 95, 300),

  -- NCAA Basketball
  ('espn-api-ncaa-basketball', 'ESPN College Basketball API', 'api', 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/news', 95, 300);

-- Team Site Scrapers (Web Scraping)
-- These scrape official team websites for news and updates
-- Note: Scraper configs are defined in code (WebScraper.getTeamSiteConfig)

INSERT OR IGNORE INTO content_sources (id, name, type, url, credibility_score, fetch_interval_seconds) VALUES
  -- MLB Team Sites
  ('team-site-cardinals', 'Cardinals Official Site', 'scraper', 'https://www.mlb.com/cardinals/news', 85, 600),
  ('team-site-dodgers', 'Dodgers Official Site', 'scraper', 'https://www.mlb.com/dodgers/news', 85, 600),
  ('team-site-yankees', 'Yankees Official Site', 'scraper', 'https://www.mlb.com/yankees/news', 85, 600);

-- Update: Increase fetch interval for existing RSS sources to reduce load
-- API sources are more reliable and faster, so we can fetch RSS less frequently

UPDATE content_sources
SET fetch_interval_seconds = 600
WHERE type = 'rss'
AND fetch_interval_seconds = 300;

-- Summary Statistics
SELECT
  type,
  COUNT(*) as source_count,
  AVG(credibility_score) as avg_credibility,
  AVG(fetch_interval_seconds) as avg_interval_seconds
FROM content_sources
WHERE is_active = 1
GROUP BY type
ORDER BY source_count DESC;
