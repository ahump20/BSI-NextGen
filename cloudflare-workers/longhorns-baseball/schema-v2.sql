-- Texas Longhorns Baseball Stats Database Schema (Version 2)
-- D1 database for storing player statistics with proper constraints
-- Created: 2025-11-09 (Revised after council review)

-- Team configuration table (enables multi-team support)
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_name TEXT NOT NULL UNIQUE,
  espn_team_id TEXT NOT NULL UNIQUE,
  conference TEXT,
  division TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- wOBA coefficients by season (for accurate advanced metrics)
CREATE TABLE IF NOT EXISTS woba_coefficients (
  season INTEGER PRIMARY KEY CHECK(season BETWEEN 2020 AND 2030),
  wbb REAL NOT NULL,      -- Weight for walks
  whbp REAL NOT NULL,     -- Weight for hit-by-pitch
  w1b REAL NOT NULL,      -- Weight for singles
  w2b REAL NOT NULL,      -- Weight for doubles
  w3b REAL NOT NULL,      -- Weight for triples
  whr REAL NOT NULL,      -- Weight for home runs
  woba_scale REAL NOT NULL,
  woba_fip REAL NOT NULL,  -- FIP constant
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default 2024 coefficients (update annually via FanGraphs)
INSERT OR IGNORE INTO woba_coefficients (season, wbb, whbp, w1b, w2b, w3b, whr, woba_scale, woba_fip)
VALUES (2024, 0.690, 0.720, 0.880, 1.247, 1.578, 2.031, 1.185, 3.132);

INSERT OR IGNORE INTO woba_coefficients (season, wbb, whbp, w1b, w2b, w3b, whr, woba_scale, woba_fip)
VALUES (2025, 0.690, 0.720, 0.880, 1.247, 1.578, 2.031, 1.185, 3.132);

-- Insert Texas Longhorns team record
INSERT OR IGNORE INTO teams (team_name, espn_team_id, conference, division)
VALUES ('Texas Longhorns', '251', 'SEC', 'D1');

-- Player statistics table (game-by-game records)
CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Player identification
  player_name TEXT NOT NULL,
  player_espn_id TEXT,  -- ESPN athlete ID for linking
  position TEXT CHECK(position IN ('P', 'C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'UTIL')),
  stat_type TEXT NOT NULL CHECK(stat_type IN ('batting', 'pitching')),

  -- Game context
  team_id INTEGER NOT NULL REFERENCES teams(id),
  season INTEGER NOT NULL CHECK(season BETWEEN 2020 AND 2030),
  game_date DATE NOT NULL,
  opponent TEXT,
  home_away TEXT CHECK(home_away IN ('home', 'away', 'neutral')),
  game_result TEXT CHECK(game_result IN ('win', 'loss', 'tie', NULL)),

  -- Batting statistics
  at_bats INTEGER DEFAULT 0 CHECK(at_bats >= 0),
  runs INTEGER DEFAULT 0 CHECK(runs >= 0),
  hits INTEGER DEFAULT 0 CHECK(hits >= 0 AND hits <= at_bats),
  doubles INTEGER DEFAULT 0 CHECK(doubles >= 0),
  triples INTEGER DEFAULT 0 CHECK(triples >= 0),
  home_runs INTEGER DEFAULT 0 CHECK(home_runs >= 0),
  rbi INTEGER DEFAULT 0 CHECK(rbi >= 0),
  walks INTEGER DEFAULT 0 CHECK(walks >= 0),
  strikeouts INTEGER DEFAULT 0 CHECK(strikeouts >= 0),
  stolen_bases INTEGER DEFAULT 0 CHECK(stolen_bases >= 0),
  caught_stealing INTEGER DEFAULT 0 CHECK(caught_stealing >= 0),
  hit_by_pitch INTEGER DEFAULT 0 CHECK(hit_by_pitch >= 0),
  sacrifice_flies INTEGER DEFAULT 0 CHECK(sacrifice_flies >= 0),

  -- Pitching statistics
  innings_pitched REAL DEFAULT 0.0 CHECK(innings_pitched >= 0),
  hits_allowed INTEGER DEFAULT 0 CHECK(hits_allowed >= 0),
  runs_allowed INTEGER DEFAULT 0 CHECK(runs_allowed >= 0),
  earned_runs INTEGER DEFAULT 0 CHECK(earned_runs >= 0 AND earned_runs <= runs_allowed),
  walks_allowed INTEGER DEFAULT 0 CHECK(walks_allowed >= 0),
  strikeouts_pitched INTEGER DEFAULT 0 CHECK(strikeouts_pitched >= 0),
  home_runs_allowed INTEGER DEFAULT 0 CHECK(home_runs_allowed >= 0),

  -- Derived batting metrics (using generated columns)
  batting_avg REAL GENERATED ALWAYS AS (
    CASE
      WHEN at_bats > 0 THEN ROUND(CAST(hits AS REAL) / at_bats, 3)
      ELSE 0.0
    END
  ) STORED,

  on_base_pct REAL GENERATED ALWAYS AS (
    CASE
      WHEN (at_bats + walks + hit_by_pitch + sacrifice_flies) > 0 THEN
        ROUND(CAST(hits + walks + hit_by_pitch AS REAL) /
              (at_bats + walks + hit_by_pitch + sacrifice_flies), 3)
      ELSE 0.0
    END
  ) STORED,

  slugging_pct REAL GENERATED ALWAYS AS (
    CASE
      WHEN at_bats > 0 THEN
        ROUND(CAST(hits + doubles + (2 * triples) + (3 * home_runs) AS REAL) / at_bats, 3)
      ELSE 0.0
    END
  ) STORED,

  ops REAL GENERATED ALWAYS AS (
    CASE
      WHEN at_bats > 0 AND (at_bats + walks + hit_by_pitch + sacrifice_flies) > 0 THEN
        ROUND(
          (CAST(hits + walks + hit_by_pitch AS REAL) /
           (at_bats + walks + hit_by_pitch + sacrifice_flies)) +
          (CAST(hits + doubles + (2 * triples) + (3 * home_runs) AS REAL) / at_bats),
          3
        )
      ELSE 0.0
    END
  ) STORED,

  -- Derived pitching metrics
  era REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN ROUND((CAST(earned_runs AS REAL) * 9.0) / innings_pitched, 2)
      ELSE 0.0
    END
  ) STORED,

  whip REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN
        ROUND(CAST(hits_allowed + walks_allowed AS REAL) / innings_pitched, 2)
      ELSE 0.0
    END
  ) STORED,

  k_per_9 REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN
        ROUND((CAST(strikeouts_pitched AS REAL) * 9.0) / innings_pitched, 2)
      ELSE 0.0
    END
  ) STORED,

  bb_per_9 REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN
        ROUND((CAST(walks_allowed AS REAL) * 9.0) / innings_pitched, 2)
      ELSE 0.0
    END
  ) STORED,

  -- Metadata
  source_url TEXT,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate entries for same player/game
  UNIQUE(player_name, team_id, season, game_date, stat_type)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_player_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_team_season ON player_stats(team_id, season);
CREATE INDEX IF NOT EXISTS idx_stat_type ON player_stats(stat_type);
CREATE INDEX IF NOT EXISTS idx_game_date ON player_stats(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_ops_leaders ON player_stats(ops DESC)
  WHERE stat_type = 'batting' AND at_bats > 0;
CREATE INDEX IF NOT EXISTS idx_era_leaders ON player_stats(era ASC)
  WHERE stat_type = 'pitching' AND innings_pitched > 0;
CREATE INDEX IF NOT EXISTS idx_scraped_at ON player_stats(scraped_at DESC);

-- Season aggregate views (for leaderboards)
CREATE VIEW IF NOT EXISTS season_batting_leaders AS
SELECT
  player_name,
  team_id,
  season,
  COUNT(*) as games_played,
  SUM(at_bats) as total_ab,
  SUM(runs) as total_runs,
  SUM(hits) as total_hits,
  SUM(doubles) as total_2b,
  SUM(triples) as total_3b,
  SUM(home_runs) as total_hr,
  SUM(rbi) as total_rbi,
  SUM(walks) as total_bb,
  SUM(strikeouts) as total_so,
  SUM(stolen_bases) as total_sb,
  ROUND(CAST(SUM(hits) AS REAL) / NULLIF(SUM(at_bats), 0), 3) as season_avg,
  ROUND(CAST(SUM(hits + walks + hit_by_pitch) AS REAL) /
        NULLIF(SUM(at_bats + walks + hit_by_pitch + sacrifice_flies), 0), 3) as season_obp,
  ROUND(CAST(SUM(hits + doubles + (2 * triples) + (3 * home_runs)) AS REAL) /
        NULLIF(SUM(at_bats), 0), 3) as season_slg,
  ROUND(
    (CAST(SUM(hits + walks + hit_by_pitch) AS REAL) /
     NULLIF(SUM(at_bats + walks + hit_by_pitch + sacrifice_flies), 0)) +
    (CAST(SUM(hits + doubles + (2 * triples) + (3 * home_runs)) AS REAL) /
     NULLIF(SUM(at_bats), 0)),
    3
  ) as season_ops
FROM player_stats
WHERE stat_type = 'batting' AND at_bats > 0
GROUP BY player_name, team_id, season
HAVING total_ab >= 10  -- Minimum 10 at-bats for leaderboards
ORDER BY season_ops DESC;

CREATE VIEW IF NOT EXISTS season_pitching_leaders AS
SELECT
  player_name,
  team_id,
  season,
  COUNT(*) as appearances,
  SUM(innings_pitched) as total_ip,
  SUM(hits_allowed) as total_h,
  SUM(runs_allowed) as total_r,
  SUM(earned_runs) as total_er,
  SUM(walks_allowed) as total_bb,
  SUM(strikeouts_pitched) as total_so,
  SUM(home_runs_allowed) as total_hr,
  ROUND((CAST(SUM(earned_runs) AS REAL) * 9.0) / NULLIF(SUM(innings_pitched), 0), 2) as season_era,
  ROUND(CAST(SUM(hits_allowed + walks_allowed) AS REAL) / NULLIF(SUM(innings_pitched), 0), 2) as season_whip,
  ROUND((CAST(SUM(strikeouts_pitched) AS REAL) * 9.0) / NULLIF(SUM(innings_pitched), 0), 2) as season_k9,
  ROUND((CAST(SUM(walks_allowed) AS REAL) * 9.0) / NULLIF(SUM(innings_pitched), 0), 2) as season_bb9
FROM player_stats
WHERE stat_type = 'pitching' AND innings_pitched > 0
GROUP BY player_name, team_id, season
HAVING total_ip >= 5.0  -- Minimum 5 innings pitched for leaderboards
ORDER BY season_era ASC;

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_player_stats_timestamp
AFTER UPDATE ON player_stats
BEGIN
  UPDATE player_stats SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Validation log table (for tracking scraper accuracy)
CREATE TABLE IF NOT EXISTS validation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  validation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  season INTEGER NOT NULL,
  validation_type TEXT CHECK(validation_type IN ('batting', 'pitching', 'full')),
  players_checked INTEGER,
  mismatches_found INTEGER,
  avg_variance REAL,
  status TEXT CHECK(status IN ('passed', 'failed', 'warning')),
  notes TEXT
);
