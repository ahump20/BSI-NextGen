-- Migration: Initial database schema for Sandlot Sluggers
-- Created: 2025-11-06
-- Description: Player progression and stats tracking

-- Player progression table
CREATE TABLE IF NOT EXISTS player_progress (
  player_id TEXT PRIMARY KEY,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_hits INTEGER NOT NULL DEFAULT 0,
  total_home_runs INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  unlocked_characters TEXT NOT NULL DEFAULT '[]', -- JSON array of character IDs
  unlocked_stadiums TEXT NOT NULL DEFAULT '[]',  -- JSON array of stadium IDs
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_player_progress_wins
  ON player_progress(wins DESC, total_runs DESC);

CREATE INDEX IF NOT EXISTS idx_player_progress_level
  ON player_progress(current_level DESC, experience DESC);

CREATE INDEX IF NOT EXISTS idx_player_progress_total_runs
  ON player_progress(total_runs DESC);

CREATE INDEX IF NOT EXISTS idx_player_progress_total_hits
  ON player_progress(total_hits DESC);

CREATE INDEX IF NOT EXISTS idx_player_progress_total_home_runs
  ON player_progress(total_home_runs DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_player_progress_timestamp
  AFTER UPDATE ON player_progress
  FOR EACH ROW
BEGIN
  UPDATE player_progress
  SET updated_at = strftime('%s', 'now')
  WHERE player_id = NEW.player_id;
END;

-- Character unlock tracking (optional, for analytics)
CREATE TABLE IF NOT EXISTS character_unlocks (
  unlock_id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (player_id) REFERENCES player_progress(player_id)
);

CREATE INDEX IF NOT EXISTS idx_character_unlocks_player
  ON character_unlocks(player_id);

-- Stadium unlock tracking (optional, for analytics)
CREATE TABLE IF NOT EXISTS stadium_unlocks (
  unlock_id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  stadium_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (player_id) REFERENCES player_progress(player_id)
);

CREATE INDEX IF NOT EXISTS idx_stadium_unlocks_player
  ON stadium_unlocks(player_id);

-- Game history (for detailed analytics and replay)
CREATE TABLE IF NOT EXISTS game_history (
  game_id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  character_id TEXT,
  stadium_id TEXT,
  won INTEGER NOT NULL, -- 0 or 1
  runs_scored INTEGER NOT NULL,
  hits_recorded INTEGER NOT NULL,
  home_runs_hit INTEGER NOT NULL,
  experience_earned INTEGER NOT NULL,
  played_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (player_id) REFERENCES player_progress(player_id)
);

CREATE INDEX IF NOT EXISTS idx_game_history_player
  ON game_history(player_id, played_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_history_played_at
  ON game_history(played_at DESC);
