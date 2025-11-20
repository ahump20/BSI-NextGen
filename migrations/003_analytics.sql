-- Migration 003: Analytics Tables
-- Created: January 2025
-- Description: Pre-computed analytics and ingestion tracking

-- pythagorean_expectations: Pre-computed Pythagorean win expectations
CREATE TABLE IF NOT EXISTS pythagorean_expectations (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  season_id TEXT NOT NULL,
  points_for INTEGER NOT NULL,
  points_against INTEGER NOT NULL,
  games_played INTEGER NOT NULL,
  expected_wins REAL NOT NULL,
  actual_wins INTEGER NOT NULL,
  luck_factor REAL NOT NULL, -- actual_wins - expected_wins
  computed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);

CREATE INDEX idx_pythag_team ON pythagorean_expectations(team_id);
CREATE INDEX idx_pythag_season ON pythagorean_expectations(season_id);
CREATE INDEX idx_pythag_luck ON pythagorean_expectations(luck_factor DESC);
CREATE UNIQUE INDEX idx_pythag_team_season ON pythagorean_expectations(team_id, season_id);

-- ingestion_logs: Track data ingestion jobs
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  ingestion_type TEXT NOT NULL, -- 'games', 'standings', 'stats'
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_inserted INTEGER NOT NULL DEFAULT 0,
  records_updated INTEGER NOT NULL DEFAULT 0,
  records_failed INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

CREATE INDEX idx_ingestion_league ON ingestion_logs(league_id);
CREATE INDEX idx_ingestion_type ON ingestion_logs(ingestion_type);
CREATE INDEX idx_ingestion_started ON ingestion_logs(started_at DESC);
CREATE INDEX idx_ingestion_status ON ingestion_logs(completed_at);

-- cache_stats: Track cache performance metrics
CREATE TABLE IF NOT EXISTS cache_stats (
  id TEXT PRIMARY KEY,
  cache_key TEXT NOT NULL,
  sport TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  misses INTEGER NOT NULL DEFAULT 0,
  last_hit_at INTEGER,
  last_miss_at INTEGER,
  avg_fetch_time_ms INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_cache_stats_sport ON cache_stats(sport);
CREATE INDEX idx_cache_stats_endpoint ON cache_stats(endpoint);
CREATE INDEX idx_cache_stats_key ON cache_stats(cache_key);
CREATE UNIQUE INDEX idx_cache_stats_unique ON cache_stats(cache_key);

-- Create trigger to auto-update team_stats when games are inserted/updated
CREATE TRIGGER IF NOT EXISTS update_team_stats_on_game_insert
AFTER INSERT ON games
WHEN NEW.status = 'final' AND NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL
BEGIN
  -- Update home team stats
  INSERT INTO team_stats (id, team_id, season_id, wins, losses, points_for, points_against)
  VALUES (
    'ts-' || NEW.home_team_id || '-' || NEW.season_id,
    NEW.home_team_id,
    NEW.season_id,
    CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
    CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
    NEW.home_score,
    NEW.away_score
  )
  ON CONFLICT(team_id, season_id) DO UPDATE SET
    wins = wins + CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
    ties = ties + CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
    points_for = points_for + NEW.home_score,
    points_against = points_against + NEW.away_score,
    updated_at = unixepoch();

  -- Update away team stats
  INSERT INTO team_stats (id, team_id, season_id, wins, losses, points_for, points_against)
  VALUES (
    'ts-' || NEW.away_team_id || '-' || NEW.season_id,
    NEW.away_team_id,
    NEW.season_id,
    CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
    CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
    NEW.away_score,
    NEW.home_score
  )
  ON CONFLICT(team_id, season_id) DO UPDATE SET
    wins = wins + CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
    ties = ties + CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
    points_for = points_for + NEW.away_score,
    points_against = points_against + NEW.home_score,
    updated_at = unixepoch();
END;

-- Create trigger to auto-update team_stats when games are updated to final
CREATE TRIGGER IF NOT EXISTS update_team_stats_on_game_update
AFTER UPDATE ON games
WHEN NEW.status = 'final'
  AND OLD.status != 'final'
  AND NEW.home_score IS NOT NULL
  AND NEW.away_score IS NOT NULL
BEGIN
  -- Update home team stats
  INSERT INTO team_stats (id, team_id, season_id, wins, losses, points_for, points_against)
  VALUES (
    'ts-' || NEW.home_team_id || '-' || NEW.season_id,
    NEW.home_team_id,
    NEW.season_id,
    CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
    CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
    NEW.home_score,
    NEW.away_score
  )
  ON CONFLICT(team_id, season_id) DO UPDATE SET
    wins = wins + CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
    ties = ties + CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
    points_for = points_for + NEW.home_score,
    points_against = points_against + NEW.away_score,
    updated_at = unixepoch();

  -- Update away team stats
  INSERT INTO team_stats (id, team_id, season_id, wins, losses, points_for, points_against)
  VALUES (
    'ts-' || NEW.away_team_id || '-' || NEW.season_id,
    NEW.away_team_id,
    NEW.season_id,
    CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
    CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
    NEW.away_score,
    NEW.home_score
  )
  ON CONFLICT(team_id, season_id) DO UPDATE SET
    wins = wins + CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
    losses = losses + CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
    ties = ties + CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
    points_for = points_for + NEW.away_score,
    points_against = points_against + NEW.home_score,
    updated_at = unixepoch();
END;
