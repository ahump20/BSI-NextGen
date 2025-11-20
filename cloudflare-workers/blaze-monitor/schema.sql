-- Blaze Monitor Database Schema
-- Stores database performance metrics and alerts

-- Database metrics table
CREATE TABLE IF NOT EXISTS database_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_name TEXT NOT NULL,
  total_tables INTEGER NOT NULL,
  total_rows INTEGER NOT NULL,
  database_size_kb REAL NOT NULL,
  growth_rate_mb_per_day REAL NOT NULL,
  avg_query_time_ms REAL NOT NULL,
  error_count INTEGER NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_metrics_database ON database_metrics(database_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON database_metrics(timestamp DESC);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_name TEXT NOT NULL,
  cache_hit_rate REAL NOT NULL,
  avg_query_time_ms REAL NOT NULL,
  total_queries INTEGER NOT NULL,
  cache_hits INTEGER NOT NULL,
  cache_misses INTEGER NOT NULL,
  error_rate REAL NOT NULL,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_perf_worker ON performance_metrics(worker_name);
CREATE INDEX IF NOT EXISTS idx_perf_timestamp ON performance_metrics(timestamp DESC);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('warning', 'critical')),
  message TEXT NOT NULL,
  database_name TEXT NOT NULL,
  value REAL NOT NULL,
  threshold REAL NOT NULL,
  acknowledged BOOLEAN DEFAULT 0,
  acknowledged_at TEXT,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_database ON alerts(database_name);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);

-- Error logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  database_name TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  timestamp TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_errors_database ON error_logs(database_name);
CREATE INDEX IF NOT EXISTS idx_errors_timestamp ON error_logs(timestamp DESC);

-- Cleanup triggers (delete old data after 30 days)
CREATE TRIGGER IF NOT EXISTS cleanup_old_metrics
AFTER INSERT ON database_metrics
BEGIN
  DELETE FROM database_metrics
  WHERE created_at < datetime('now', '-30 days');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_performance
AFTER INSERT ON performance_metrics
BEGIN
  DELETE FROM performance_metrics
  WHERE created_at < datetime('now', '-30 days');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_errors
AFTER INSERT ON error_logs
BEGIN
  DELETE FROM error_logs
  WHERE created_at < datetime('now', '-7 days');
END;
