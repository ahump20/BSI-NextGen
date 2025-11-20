-- ============================================================================
-- Blaze Sports Intel - D1 Database Schema
-- ============================================================================
-- Purpose: Historical sports data storage for multi-sport intelligence platform
-- Sports: MLB, NFL, NBA, NCAA Football, NCAA Basketball, College Baseball, Youth Sports
-- Timezone: All timestamps in America/Chicago
-- ============================================================================

-- ============================================================================
-- TEAMS TABLE (Shared across all sports)
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    sport TEXT NOT NULL, -- 'MLB', 'NFL', 'NBA', 'NCAA_FOOTBALL', 'NCAA_BASKETBALL', 'COLLEGE_BASEBALL', 'YOUTH'
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    city TEXT,
    logo_url TEXT,
    conference TEXT,
    division TEXT,
    is_active INTEGER DEFAULT 1,
    metadata TEXT, -- JSON for sport-specific data
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport);
CREATE INDEX IF NOT EXISTS idx_teams_sport_active ON teams(sport, is_active);
CREATE INDEX IF NOT EXISTS idx_teams_abbreviation ON teams(abbreviation);
CREATE INDEX IF NOT EXISTS idx_teams_conference ON teams(sport, conference);

-- ============================================================================
-- GAMES TABLE (All sports unified)
-- ============================================================================
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY,
    sport TEXT NOT NULL,
    league TEXT, -- 'MLB', 'NFL', 'NBA', 'NCAA', 'High School', etc.
    game_date TEXT NOT NULL, -- ISO 8601 date (YYYY-MM-DD)
    game_time TEXT, -- ISO 8601 datetime
    season INTEGER,
    week INTEGER, -- For NFL/NCAA Football

    -- Teams
    home_team_id TEXT NOT NULL,
    away_team_id TEXT NOT NULL,

    -- Scores
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,

    -- Status
    status TEXT NOT NULL, -- 'scheduled', 'live', 'final', 'postponed', 'cancelled'
    period TEXT, -- Current period/inning/quarter

    -- Venue
    venue_name TEXT,
    venue_city TEXT,
    venue_state TEXT,

    -- Metadata
    metadata TEXT, -- JSON for sport-specific data (linescore, stats, etc.)

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Primary indexes for common queries
CREATE INDEX IF NOT EXISTS idx_games_sport_date ON games(sport, game_date);
CREATE INDEX IF NOT EXISTS idx_games_sport_status ON games(sport, status);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_home_team ON games(home_team_id, game_date);
CREATE INDEX IF NOT EXISTS idx_games_away_team ON games(away_team_id, game_date);
CREATE INDEX IF NOT EXISTS idx_games_season ON games(sport, season);
CREATE INDEX IF NOT EXISTS idx_games_week ON games(sport, season, week);

-- Composite index for live scoreboard queries
CREATE INDEX IF NOT EXISTS idx_games_sport_date_status ON games(sport, game_date, status);

-- ============================================================================
-- STANDINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS standings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sport TEXT NOT NULL,
    season INTEGER NOT NULL,
    team_id TEXT NOT NULL,

    -- Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,

    -- Conference/Division
    conference TEXT,
    division TEXT,

    -- Stats
    win_percentage REAL,
    games_back REAL,
    points_for INTEGER,
    points_against INTEGER,
    streak TEXT,

    -- Rankings
    conference_rank INTEGER,
    division_rank INTEGER,

    -- Metadata
    metadata TEXT, -- JSON for additional stats

    -- Snapshot tracking
    snapshot_date TEXT NOT NULL, -- When this standing was recorded
    created_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX IF NOT EXISTS idx_standings_sport_season ON standings(sport, season);
CREATE INDEX IF NOT EXISTS idx_standings_team ON standings(team_id, season);
CREATE INDEX IF NOT EXISTS idx_standings_conference ON standings(sport, season, conference);
CREATE INDEX IF NOT EXISTS idx_standings_snapshot ON standings(sport, season, snapshot_date);

-- ============================================================================
-- PLAYER STATS (For future use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS player_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    sport TEXT NOT NULL,

    -- Basic info
    player_name TEXT NOT NULL,
    position TEXT,
    jersey_number TEXT,

    -- Stats (stored as JSON due to sport-specific variations)
    stats TEXT NOT NULL, -- JSON: batting, pitching, passing, rushing, etc.

    -- Timestamps
    created_at TEXT DEFAULT (datetime('now')),

    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX IF NOT EXISTS idx_player_stats_game ON player_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_player ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_team ON player_stats(team_id);

-- ============================================================================
-- NEWS ARTICLES TABLE (Phase 16)
-- ============================================================================
CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Article info
    title TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT,

    -- Source
    source_name TEXT NOT NULL,
    author TEXT,

    -- Classification
    sport TEXT, -- 'MLB', 'NFL', 'NBA', etc. or NULL for general
    teams TEXT, -- JSON array of team IDs mentioned
    keywords TEXT, -- JSON array of keywords

    -- Dates
    published_at TEXT NOT NULL,
    scraped_at TEXT DEFAULT (datetime('now')),

    -- Deduplication
    content_hash TEXT, -- Hash of title + first 200 chars for dedup

    -- Metadata
    image_url TEXT,
    metadata TEXT, -- JSON for additional data

    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_news_sport ON news_articles(sport, published_at);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source ON news_articles(source_name, published_at);
CREATE INDEX IF NOT EXISTS idx_news_hash ON news_articles(content_hash);
CREATE INDEX IF NOT EXISTS idx_news_url ON news_articles(url);

-- ============================================================================
-- ANALYTICS CACHE TABLE
-- ============================================================================
-- Stores pre-computed analytics to reduce API calls
CREATE TABLE IF NOT EXISTS analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,

    -- What's being cached
    entity_type TEXT NOT NULL, -- 'team', 'game', 'season'
    entity_id TEXT NOT NULL,
    sport TEXT NOT NULL,

    -- The cached data
    analytics_data TEXT NOT NULL, -- JSON: Pythagorean, efficiency, momentum, etc.

    -- TTL
    computed_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,

    -- Metadata
    metadata TEXT
);

CREATE INDEX IF NOT EXISTS idx_analytics_key ON analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_analytics_entity ON analytics_cache(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_analytics_expires ON analytics_cache(expires_at);

-- ============================================================================
-- DATA INGESTION LOG
-- ============================================================================
-- Track ingestion runs for monitoring
CREATE TABLE IF NOT EXISTS ingestion_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- What was ingested
    job_type TEXT NOT NULL, -- 'games', 'standings', 'news', 'analytics'
    sport TEXT,

    -- Results
    status TEXT NOT NULL, -- 'success', 'partial', 'failed'
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Error tracking
    error_message TEXT,
    error_details TEXT, -- JSON

    -- Timing
    started_at TEXT NOT NULL,
    completed_at TEXT,
    duration_ms INTEGER,

    -- Metadata
    metadata TEXT -- JSON: API calls made, sources used, etc.
);

CREATE INDEX IF NOT EXISTS idx_ingestion_job_type ON ingestion_log(job_type, started_at);
CREATE INDEX IF NOT EXISTS idx_ingestion_sport ON ingestion_log(sport, started_at);
CREATE INDEX IF NOT EXISTS idx_ingestion_status ON ingestion_log(status, started_at);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Recent games with team details
CREATE VIEW IF NOT EXISTS v_recent_games AS
SELECT
    g.id,
    g.sport,
    g.league,
    g.game_date,
    g.game_time,
    g.status,
    g.home_score,
    g.away_score,
    ht.display_name AS home_team_name,
    ht.abbreviation AS home_team_abbr,
    ht.logo_url AS home_team_logo,
    at.display_name AS away_team_name,
    at.abbreviation AS away_team_abbr,
    at.logo_url AS away_team_logo,
    g.venue_name,
    g.period
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
ORDER BY g.game_date DESC, g.game_time DESC;

-- Live games view
CREATE VIEW IF NOT EXISTS v_live_games AS
SELECT
    g.id,
    g.sport,
    g.league,
    g.game_date,
    g.status,
    g.period,
    g.home_score,
    g.away_score,
    ht.display_name AS home_team_name,
    ht.abbreviation AS home_team_abbr,
    at.display_name AS away_team_name,
    at.abbreviation AS away_team_abbr,
    g.venue_name
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
WHERE g.status = 'live'
ORDER BY g.game_time;

-- Latest standings view
CREATE VIEW IF NOT EXISTS v_latest_standings AS
SELECT
    s.sport,
    s.season,
    s.conference,
    s.division,
    t.display_name AS team_name,
    t.abbreviation AS team_abbr,
    t.logo_url AS team_logo,
    s.wins,
    s.losses,
    s.ties,
    s.win_percentage,
    s.games_back,
    s.streak,
    s.conference_rank,
    s.division_rank
FROM standings s
JOIN teams t ON s.team_id = t.id
WHERE s.snapshot_date = (
    SELECT MAX(snapshot_date)
    FROM standings s2
    WHERE s2.team_id = s.team_id
    AND s2.season = s.season
)
ORDER BY s.sport, s.season, s.conference, s.division, s.wins DESC;

-- ============================================================================
-- SAMPLE QUERIES (Documentation)
-- ============================================================================

-- Get today's games for a sport:
-- SELECT * FROM v_recent_games WHERE sport = 'NFL' AND game_date = date('now');

-- Get live games:
-- SELECT * FROM v_live_games;

-- Get team's recent games:
-- SELECT * FROM games WHERE (home_team_id = 'team_123' OR away_team_id = 'team_123')
-- AND game_date >= date('now', '-7 days') ORDER BY game_date DESC;

-- Get standings for a conference:
-- SELECT * FROM v_latest_standings WHERE sport = 'NCAA_FOOTBALL' AND conference = 'SEC';

-- Get recent news for a sport:
-- SELECT * FROM news_articles WHERE sport = 'MLB'
-- ORDER BY published_at DESC LIMIT 20;

-- Get team analytics from cache:
-- SELECT analytics_data FROM analytics_cache
-- WHERE entity_type = 'team' AND entity_id = 'team_123'
-- AND expires_at > datetime('now');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
