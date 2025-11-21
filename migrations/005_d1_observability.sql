-- Cloudflare D1 observability tables for Blaze Sports Gateway

CREATE TABLE IF NOT EXISTS session_logs (
  session_id TEXT PRIMARY KEY,
  route TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  first_seen DATETIME DEFAULT (datetime('now')),
  last_seen DATETIME DEFAULT (datetime('now')),
  last_game_state TEXT,
  last_event_date TEXT
);

CREATE TABLE IF NOT EXISTS event_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  route TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  cache_status TEXT NOT NULL,
  game_state TEXT,
  event_date TEXT,
  occurred_at DATETIME DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES session_logs(session_id)
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  usage_date TEXT NOT NULL,
  route TEXT NOT NULL,
  total_requests INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  last_game_state TEXT,
  PRIMARY KEY (usage_date, route)
);

CREATE INDEX IF NOT EXISTS idx_event_logs_date_state ON event_logs(event_date, game_state);
CREATE INDEX IF NOT EXISTS idx_session_last_seen ON session_logs(last_seen);
