-- Migration 002: Sport-Specific Extensions
-- Created: January 2025
-- Description: Sport-specific tables for detailed game data

-- mlb_innings: Inning-by-inning scoring for baseball
CREATE TABLE IF NOT EXISTS mlb_innings (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  inning INTEGER NOT NULL,
  home_runs INTEGER NOT NULL DEFAULT 0,
  away_runs INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_mlb_innings_game ON mlb_innings(game_id);
CREATE UNIQUE INDEX idx_mlb_innings_game_inning ON mlb_innings(game_id, inning);

-- nfl_drives: Drive-by-drive data for football
CREATE TABLE IF NOT EXISTS nfl_drives (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  quarter INTEGER NOT NULL,
  start_time TEXT NOT NULL, -- Game clock
  end_time TEXT NOT NULL,
  start_yard_line INTEGER,
  end_yard_line INTEGER,
  plays INTEGER NOT NULL,
  yards INTEGER NOT NULL,
  result TEXT, -- 'touchdown', 'field_goal', 'punt', 'turnover', 'end_half'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_nfl_drives_game ON nfl_drives(game_id);
CREATE INDEX idx_nfl_drives_team ON nfl_drives(team_id);
CREATE INDEX idx_nfl_drives_quarter ON nfl_drives(quarter);

-- nba_quarters: Quarter-by-quarter scoring for basketball
CREATE TABLE IF NOT EXISTS nba_quarters (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  quarter INTEGER NOT NULL, -- 1-4, 5+ for OT
  home_points INTEGER NOT NULL DEFAULT 0,
  away_points INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

CREATE INDEX idx_nba_quarters_game ON nba_quarters(game_id);
CREATE UNIQUE INDEX idx_nba_quarters_game_quarter ON nba_quarters(game_id, quarter);

-- ncaa_drives: Drive data for college football (similar to NFL but different schema)
CREATE TABLE IF NOT EXISTS ncaa_drives (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  quarter INTEGER NOT NULL,
  drive_number INTEGER NOT NULL,
  start_yard_line INTEGER,
  end_yard_line INTEGER,
  plays INTEGER NOT NULL DEFAULT 0,
  yards INTEGER NOT NULL DEFAULT 0,
  time_of_possession TEXT, -- Format: "MM:SS"
  result TEXT, -- 'touchdown', 'field_goal', 'punt', 'turnover', 'downs', 'end_half'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_ncaa_drives_game ON ncaa_drives(game_id);
CREATE INDEX idx_ncaa_drives_team ON ncaa_drives(team_id);
CREATE INDEX idx_ncaa_drives_quarter ON ncaa_drives(quarter);
