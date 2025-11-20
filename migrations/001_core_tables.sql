-- Migration 001: Core Tables
-- Created: January 2025
-- Description: Core schema for multi-sport data storage

-- leagues: Sports leagues (MLB, NFL, NBA, NCAA Football, etc.)
CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  sport TEXT NOT NULL, -- 'baseball', 'football', 'basketball'
  level TEXT NOT NULL, -- 'professional', 'college', 'high_school'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_leagues_sport ON leagues(sport);
CREATE INDEX idx_leagues_level ON leagues(level);

-- seasons: Seasons by league (2024, 2025, etc.)
CREATE TABLE IF NOT EXISTS seasons (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  start_date TEXT NOT NULL, -- ISO 8601 date
  end_date TEXT, -- NULL if ongoing
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

CREATE INDEX idx_seasons_league ON seasons(league_id);
CREATE INDEX idx_seasons_year ON seasons(year);
CREATE UNIQUE INDEX idx_seasons_league_year ON seasons(league_id, year);

-- teams: All teams across all leagues
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  league_id TEXT NOT NULL,
  external_id TEXT NOT NULL, -- API provider's team ID
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  city TEXT,
  state TEXT,
  venue_name TEXT,
  conference TEXT, -- For college sports
  division TEXT, -- For pro sports
  logo_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
);

CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_external_id ON teams(external_id);
CREATE INDEX idx_teams_conference ON teams(conference);
CREATE INDEX idx_teams_division ON teams(division);
CREATE UNIQUE INDEX idx_teams_league_external ON teams(league_id, external_id);

-- games: All games across all sports
CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  season_id TEXT NOT NULL,
  external_id TEXT NOT NULL, -- API provider's game ID
  home_team_id TEXT NOT NULL,
  away_team_id TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL, -- Unix timestamp (UTC)
  status TEXT NOT NULL, -- 'scheduled', 'live', 'final', 'postponed', 'cancelled'
  home_score INTEGER,
  away_score INTEGER,
  venue_name TEXT,
  attendance INTEGER,
  weather_condition TEXT,
  weather_temp INTEGER,
  broadcast_network TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_games_season ON games(season_id);
CREATE INDEX idx_games_scheduled_at ON games(scheduled_at);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_home_team ON games(home_team_id);
CREATE INDEX idx_games_away_team ON games(away_team_id);
CREATE UNIQUE INDEX idx_games_season_external ON games(season_id, external_id);

-- game_stats: Aggregated stats per game
CREATE TABLE IF NOT EXISTS game_stats (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  stats_json TEXT NOT NULL, -- JSON blob for sport-specific stats
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

CREATE INDEX idx_game_stats_game ON game_stats(game_id);
CREATE INDEX idx_game_stats_team ON game_stats(team_id);
CREATE UNIQUE INDEX idx_game_stats_game_team ON game_stats(game_id, team_id);

-- team_stats: Season-long team statistics
CREATE TABLE IF NOT EXISTS team_stats (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  season_id TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points_for INTEGER NOT NULL DEFAULT 0,
  points_against INTEGER NOT NULL DEFAULT 0,
  streak TEXT, -- 'W3', 'L2', etc.
  stats_json TEXT, -- JSON blob for sport-specific stats
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);

CREATE INDEX idx_team_stats_team ON team_stats(team_id);
CREATE INDEX idx_team_stats_season ON team_stats(season_id);
CREATE INDEX idx_team_stats_wins ON team_stats(wins DESC);
CREATE UNIQUE INDEX idx_team_stats_team_season ON team_stats(team_id, season_id);

-- Insert default leagues
INSERT OR IGNORE INTO leagues (id, name, abbreviation, sport, level)
VALUES
  ('mlb', 'Major League Baseball', 'MLB', 'baseball', 'professional'),
  ('nfl', 'National Football League', 'NFL', 'football', 'professional'),
  ('nba', 'National Basketball Association', 'NBA', 'basketball', 'professional'),
  ('ncaa-fb', 'NCAA Football', 'NCAA', 'football', 'college'),
  ('ncaa-bb', 'NCAA Baseball', 'NCAA', 'baseball', 'college'),
  ('ncaa-bk', 'NCAA Basketball', 'NCAA', 'basketball', 'college');

-- Insert current seasons (2025)
INSERT OR IGNORE INTO seasons (id, league_id, year, start_date, end_date)
VALUES
  ('mlb-2025', 'mlb', 2025, '2025-03-20', NULL),
  ('nfl-2025', 'nfl', 2025, '2025-09-04', NULL),
  ('nba-2025', 'nba', 2025, '2024-10-22', NULL),
  ('ncaa-fb-2025', 'ncaa-fb', 2025, '2025-08-30', NULL),
  ('ncaa-bb-2025', 'ncaa-bb', 2025, '2025-02-14', NULL),
  ('ncaa-bk-2025', 'ncaa-bk', 2025, '2024-11-04', NULL);
