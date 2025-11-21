-- Initial Database Schema for Blaze Sports Intel
-- Supports: College Baseball, D1 Rankings, User Auth, MLB Integration

-- ========================================
-- USERS & AUTHENTICATION
-- ========================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL, -- 'auth0', 'google', 'github'
  auth_provider_id TEXT NOT NULL,
  role TEXT DEFAULT 'user', -- 'user', 'premium', 'admin'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider ON users(auth_provider, auth_provider_id);

-- User sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);

-- ========================================
-- COLLEGE BASEBALL
-- ========================================

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  school TEXT NOT NULL,
  conference TEXT,
  division TEXT, -- 'D1', 'D2', 'D3'
  logo_url TEXT,
  colors TEXT, -- JSON array of hex colors
  venue_name TEXT,
  venue_capacity INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_teams_conference ON teams(conference);
CREATE INDEX idx_teams_division ON teams(division);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number INTEGER,
  position TEXT, -- 'P', 'C', '1B', 'OF', etc.
  year TEXT, -- 'FR', 'SO', 'JR', 'SR'
  height_inches INTEGER,
  weight_lbs INTEGER,
  bats TEXT, -- 'L', 'R', 'S'
  throws TEXT, -- 'L', 'R'
  hometown TEXT,
  high_school TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_players_position ON players(position);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  home_team_id TEXT NOT NULL REFERENCES teams(id),
  away_team_id TEXT NOT NULL REFERENCES teams(id),
  game_date INTEGER NOT NULL, -- Unix timestamp
  venue TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'final', 'postponed'
  inning INTEGER,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  attendance INTEGER,
  weather TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (home_team_id) REFERENCES teams(id),
  FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_teams ON games(home_team_id, away_team_id);

-- Box scores (batting)
CREATE TABLE IF NOT EXISTS batting_stats (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  player_id TEXT NOT NULL REFERENCES players(id),
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
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_batting_stats_game ON batting_stats(game_id);
CREATE INDEX idx_batting_stats_player ON batting_stats(player_id);

-- Box scores (pitching)
CREATE TABLE IF NOT EXISTS pitching_stats (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id),
  player_id TEXT NOT NULL REFERENCES players(id),
  innings_pitched REAL DEFAULT 0.0,
  hits INTEGER DEFAULT 0,
  runs INTEGER DEFAULT 0,
  earned_runs INTEGER DEFAULT 0,
  walks INTEGER DEFAULT 0,
  strikeouts INTEGER DEFAULT 0,
  home_runs_allowed INTEGER DEFAULT 0,
  pitch_count INTEGER DEFAULT 0,
  win BOOLEAN DEFAULT FALSE,
  loss BOOLEAN DEFAULT FALSE,
  save BOOLEAN DEFAULT FALSE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX idx_pitching_stats_game ON pitching_stats(game_id);
CREATE INDEX idx_pitching_stats_player ON pitching_stats(player_id);

-- ========================================
-- RANKINGS & STANDINGS
-- ========================================

-- D1Baseball rankings
CREATE TABLE IF NOT EXISTS rankings (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  poll_date INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  previous_rank INTEGER,
  record TEXT, -- e.g., '25-5'
  points INTEGER,
  first_place_votes INTEGER DEFAULT 0,
  source TEXT DEFAULT 'D1Baseball',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_rankings_date ON rankings(poll_date);
CREATE INDEX idx_rankings_team ON rankings(team_id);

-- Conference standings
CREATE TABLE IF NOT EXISTS standings (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  season INTEGER NOT NULL,
  conference TEXT NOT NULL,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  runs_scored INTEGER DEFAULT 0,
  runs_allowed INTEGER DEFAULT 0,
  home_record TEXT,
  away_record TEXT,
  streak TEXT, -- e.g., 'W5', 'L2'
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE INDEX idx_standings_season ON standings(season);
CREATE INDEX idx_standings_conference ON standings(conference);
CREATE UNIQUE INDEX idx_standings_team_season ON standings(team_id, season);

-- ========================================
-- MLB INTEGRATION
-- ========================================

-- MLB teams (lightweight reference)
CREATE TABLE IF NOT EXISTS mlb_teams (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  league TEXT, -- 'AL', 'NL'
  division TEXT, -- 'East', 'Central', 'West'
  colors TEXT,
  logo_url TEXT
);

-- MLB game cache
CREATE TABLE IF NOT EXISTS mlb_games_cache (
  game_pk INTEGER PRIMARY KEY,
  game_date TEXT NOT NULL,
  home_team_id INTEGER NOT NULL,
  away_team_id INTEGER NOT NULL,
  game_data TEXT NOT NULL, -- JSON blob
  cached_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL
);

CREATE INDEX idx_mlb_games_date ON mlb_games_cache(game_date);

-- ========================================
-- USER PREFERENCES & FAVORITES
-- ========================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'team', 'player'
  entity_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_favorites_user ON user_favorites(user_id);
CREATE UNIQUE INDEX idx_user_favorites_unique ON user_favorites(user_id, entity_type, entity_id);

-- ========================================
-- ANALYTICS & METRICS
-- ========================================

CREATE TABLE IF NOT EXISTS api_metrics (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  user_id TEXT,
  timestamp INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_api_metrics_endpoint ON api_metrics(endpoint);
CREATE INDEX idx_api_metrics_timestamp ON api_metrics(timestamp);
