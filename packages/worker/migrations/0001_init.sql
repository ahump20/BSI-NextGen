CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,
  league TEXT NOT NULL,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  venue TEXT NOT NULL,
  start_time TEXT NOT NULL,
  status TEXT NOT NULL,
  score_home REAL DEFAULT 0,
  score_away REAL DEFAULT 0,
  pace REAL DEFAULT 0,
  win_probability REAL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  record TEXT NOT NULL,
  offensive_rating REAL,
  defensive_rating REAL,
  net_rating REAL,
  streak TEXT,
  trend TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS narratives (
  id TEXT PRIMARY KEY,
  headline TEXT NOT NULL,
  body TEXT NOT NULL,
  impact TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  team TEXT NOT NULL,
  position TEXT NOT NULL,
  efficiency REAL,
  usage REAL,
  true_shooting REAL
);
