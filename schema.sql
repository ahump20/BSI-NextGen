-- schema.sql (Run in Cloudflare D1)
CREATE TABLE IF NOT EXISTS player_progress (
  player_id TEXT PRIMARY KEY,
  games_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  total_runs INTEGER DEFAULT 0,
  total_hits INTEGER DEFAULT 0,
  total_home_runs INTEGER DEFAULT 0,
  unlocked_characters TEXT DEFAULT '[]',
  unlocked_stadiums TEXT DEFAULT '[]',
  current_level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_player_level ON player_progress(current_level);
CREATE INDEX IF NOT EXISTS idx_player_wins ON player_progress(wins DESC);

CREATE TABLE IF NOT EXISTS leaderboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  player_name TEXT,
  stat_type TEXT NOT NULL,
  stat_value INTEGER NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES player_progress(player_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_type_value ON leaderboard(stat_type, stat_value DESC);
