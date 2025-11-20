-- Blaze Storage Database Schema
-- Media files tracking table for R2 storage

-- Media files table
CREATE TABLE IF NOT EXISTS media_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  original_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  uploaded_at TEXT NOT NULL,
  uploaded_by TEXT,
  tags TEXT,
  metadata TEXT,
  last_accessed_at TEXT,
  access_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_media_key ON media_files(key);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_at ON media_files(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_content_type ON media_files(content_type);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_last_accessed ON media_files(last_accessed_at DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_media_timestamp
AFTER UPDATE ON media_files
BEGIN
  UPDATE media_files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Storage statistics table (for monitoring)
CREATE TABLE IF NOT EXISTS storage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  total_files INTEGER NOT NULL,
  total_size_bytes INTEGER NOT NULL,
  total_uploads_today INTEGER NOT NULL,
  total_downloads_today INTEGER NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for stats queries
CREATE INDEX IF NOT EXISTS idx_storage_stats_date ON storage_stats(recorded_at DESC);
