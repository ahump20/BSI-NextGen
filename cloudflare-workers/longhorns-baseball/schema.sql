-- Texas Longhorns Baseball Stats Database Schema
-- D1 database for storing player statistics with derived analytics
-- Created: 2025-11-09

-- Player statistics table with comprehensive batting and pitching stats
CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  stat_type TEXT NOT NULL CHECK(stat_type IN ('batting', 'pitching')),
  game_date DATE NOT NULL,

  -- Batting statistics
  at_bats INTEGER DEFAULT 0,
  runs INTEGER DEFAULT 0,
  hits INTEGER DEFAULT 0,
  doubles INTEGER DEFAULT 0,
  triples INTEGER DEFAULT 0,
  home_runs INTEGER DEFAULT 0,
  rbi INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  stolen_bases INTEGER DEFAULT 0,
  caught_stealing INTEGER DEFAULT 0,

  -- Pitching statistics
  innings_pitched REAL DEFAULT 0.0,
  hits_allowed INTEGER DEFAULT 0,
  runs_allowed INTEGER DEFAULT 0,
  earned_runs INTEGER DEFAULT 0,
  walks_allowed INTEGER DEFAULT 0,
  strikeouts_pitched INTEGER DEFAULT 0,
  home_runs_allowed INTEGER DEFAULT 0,

  -- Derived sabermetrics (computed on insert/update)
  batting_avg REAL GENERATED ALWAYS AS (
    CASE
      WHEN at_bats > 0 THEN CAST(hits AS REAL) / at_bats
      ELSE 0.0
    END
  ) STORED,

  on_base_pct REAL GENERATED ALWAYS AS (
    CASE
      WHEN (at_bats + walks) > 0 THEN CAST(hits + walks AS REAL) / (at_bats + walks)
      ELSE 0.0
    END
  ) STORED,

  slugging_pct REAL GENERATED ALWAYS AS (
    CASE
      WHEN at_bats > 0 THEN
        CAST(hits + doubles + (2 * triples) + (3 * home_runs) AS REAL) / at_bats
      ELSE 0.0
    END
  ) STORED,

  ops REAL GENERATED ALWAYS AS (
    CASE
      WHEN at_bats > 0 THEN
        (CAST(hits + walks AS REAL) / (at_bats + walks)) +
        (CAST(hits + doubles + (2 * triples) + (3 * home_runs) AS REAL) / at_bats)
      ELSE 0.0
    END
  ) STORED,

  era REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN (CAST(earned_runs AS REAL) * 9.0) / innings_pitched
      ELSE 0.0
    END
  ) STORED,

  whip REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN
        CAST(hits_allowed + walks_allowed AS REAL) / innings_pitched
      ELSE 0.0
    END
  ) STORED,

  k_per_9 REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN (CAST(strikeouts_pitched AS REAL) * 9.0) / innings_pitched
      ELSE 0.0
    END
  ) STORED,

  bb_per_9 REAL GENERATED ALWAYS AS (
    CASE
      WHEN innings_pitched > 0 THEN (CAST(walks_allowed AS REAL) * 9.0) / innings_pitched
      ELSE 0.0
    END
  ) STORED,

  -- Metadata
  opponent TEXT,
  home_away TEXT CHECK(home_away IN ('home', 'away')),
  game_result TEXT CHECK(game_result IN ('win', 'loss', 'tie')),
  source_url TEXT,
  scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Ensure unique player/stat/game combinations
  UNIQUE(player_name, stat_type, game_date, opponent)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_player_name ON player_stats(player_name);
CREATE INDEX IF NOT EXISTS idx_stat_type ON player_stats(stat_type);
CREATE INDEX IF NOT EXISTS idx_game_date ON player_stats(game_date DESC);
CREATE INDEX IF NOT EXISTS idx_ops ON player_stats(ops DESC) WHERE stat_type = 'batting';
CREATE INDEX IF NOT EXISTS idx_era ON player_stats(era ASC) WHERE stat_type = 'pitching';
CREATE INDEX IF NOT EXISTS idx_scraped_at ON player_stats(scraped_at DESC);

-- Season statistics view (aggregated by player)
CREATE VIEW IF NOT EXISTS season_batting_stats AS
SELECT
  player_name,
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
  -- Season-long averages
  ROUND(CAST(SUM(hits) AS REAL) / NULLIF(SUM(at_bats), 0), 3) as season_avg,
  ROUND(CAST(SUM(hits + walks) AS REAL) / NULLIF(SUM(at_bats + walks), 0), 3) as season_obp,
  ROUND(CAST(SUM(hits + doubles + (2 * triples) + (3 * home_runs)) AS REAL) / NULLIF(SUM(at_bats), 0), 3) as season_slg,
  ROUND(
    (CAST(SUM(hits + walks) AS REAL) / NULLIF(SUM(at_bats + walks), 0)) +
    (CAST(SUM(hits + doubles + (2 * triples) + (3 * home_runs)) AS REAL) / NULLIF(SUM(at_bats), 0)),
    3
  ) as season_ops
FROM player_stats
WHERE stat_type = 'batting' AND at_bats > 0
GROUP BY player_name;

-- Season pitching statistics view
CREATE VIEW IF NOT EXISTS season_pitching_stats AS
SELECT
  player_name,
  COUNT(*) as appearances,
  SUM(innings_pitched) as total_ip,
  SUM(hits_allowed) as total_h,
  SUM(runs_allowed) as total_r,
  SUM(earned_runs) as total_er,
  SUM(walks_allowed) as total_bb,
  SUM(strikeouts_pitched) as total_so,
  SUM(home_runs_allowed) as total_hr,
  -- Season-long averages
  ROUND((CAST(SUM(earned_runs) AS REAL) * 9.0) / NULLIF(SUM(innings_pitched), 0), 2) as season_era,
  ROUND(CAST(SUM(hits_allowed + walks_allowed) AS REAL) / NULLIF(SUM(innings_pitched), 0), 2) as season_whip,
  ROUND((CAST(SUM(strikeouts_pitched) AS REAL) * 9.0) / NULLIF(SUM(innings_pitched), 0), 2) as season_k9,
  ROUND((CAST(SUM(walks_allowed) AS REAL) * 9.0) / NULLIF(SUM(innings_pitched), 0), 2) as season_bb9
FROM player_stats
WHERE stat_type = 'pitching' AND innings_pitched > 0
GROUP BY player_name;

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_player_stats_timestamp
AFTER UPDATE ON player_stats
BEGIN
  UPDATE player_stats SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
