-- ============================================================================
-- Blaze Trends Monitoring Dashboard Queries
-- ============================================================================
-- Useful SQL queries for monitoring and analyzing Blaze Trends data
-- Run with: wrangler d1 execute blaze-trends-db --file=scripts/dashboard-queries.sql
-- Or individual queries with: wrangler d1 execute blaze-trends-db --command="QUERY"
-- ============================================================================

-- ----------------------------------------------------------------------------
-- OVERVIEW STATISTICS
-- ----------------------------------------------------------------------------

-- Total counts
SELECT
    'Total Trends' as metric,
    COUNT(*) as value
FROM trends
UNION ALL
SELECT
    'Total Articles' as metric,
    COUNT(*) as value
FROM news_articles
UNION ALL
SELECT
    'Total Monitoring Events' as metric,
    COUNT(*) as value
FROM monitoring_logs;

-- ----------------------------------------------------------------------------
-- TRENDS ANALYSIS
-- ----------------------------------------------------------------------------

-- Trends by sport (last 7 days)
SELECT
    sport,
    COUNT(*) as trend_count,
    ROUND(AVG(viral_score), 2) as avg_viral_score,
    MAX(viral_score) as max_viral_score
FROM trends
WHERE created_at >= datetime('now', '-7 days')
GROUP BY sport
ORDER BY trend_count DESC;

-- Top 10 trending stories (all time)
SELECT
    sport,
    title,
    viral_score,
    datetime(created_at) as created,
    datetime(updated_at) as updated
FROM trends
ORDER BY viral_score DESC, created_at DESC
LIMIT 10;

-- Recent trends (last 24 hours)
SELECT
    sport,
    title,
    viral_score,
    datetime(created_at) as created,
    ROUND((julianday('now') - julianday(created_at)) * 24, 1) as hours_ago
FROM trends
WHERE created_at >= datetime('now', '-1 day')
ORDER BY created_at DESC;

-- Trends with most sources
SELECT
    sport,
    title,
    viral_score,
    json_array_length(sources) as source_count,
    datetime(created_at) as created
FROM trends
WHERE json_array_length(sources) > 0
ORDER BY source_count DESC
LIMIT 20;

-- Trends by team mentions
SELECT
    sport,
    title,
    json_array_length(team_ids) as team_count,
    team_ids,
    viral_score
FROM trends
WHERE json_array_length(team_ids) > 0
ORDER BY team_count DESC, viral_score DESC
LIMIT 20;

-- Trends by player mentions
SELECT
    sport,
    title,
    json_array_length(key_players) as player_count,
    key_players,
    viral_score
FROM trends
WHERE json_array_length(key_players) > 0
ORDER BY player_count DESC, viral_score DESC
LIMIT 20;

-- ----------------------------------------------------------------------------
-- ARTICLES ANALYSIS
-- ----------------------------------------------------------------------------

-- Articles by sport
SELECT
    sport,
    COUNT(*) as total_articles,
    SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) as processed,
    SUM(CASE WHEN processed = 0 THEN 1 ELSE 0 END) as unprocessed,
    ROUND(100.0 * SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as processed_percent
FROM news_articles
GROUP BY sport
ORDER BY total_articles DESC;

-- Recent articles (last 24 hours)
SELECT
    sport,
    title,
    source_name,
    datetime(published_at) as published,
    CASE WHEN processed = 1 THEN 'Yes' ELSE 'No' END as processed,
    datetime(created_at) as fetched
FROM news_articles
WHERE created_at >= datetime('now', '-1 day')
ORDER BY created_at DESC
LIMIT 50;

-- Top article sources
SELECT
    source_name,
    COUNT(*) as article_count,
    COUNT(DISTINCT sport) as sports_covered
FROM news_articles
GROUP BY source_name
ORDER BY article_count DESC
LIMIT 20;

-- Articles by day (last 30 days)
SELECT
    DATE(created_at) as date,
    sport,
    COUNT(*) as articles
FROM news_articles
WHERE created_at >= datetime('now', '-30 days')
GROUP BY DATE(created_at), sport
ORDER BY date DESC, articles DESC;

-- Duplicate content detection (articles with same content hash)
SELECT
    content_hash,
    COUNT(*) as duplicate_count,
    GROUP_CONCAT(title, ' | ') as titles
FROM news_articles
GROUP BY content_hash
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- ----------------------------------------------------------------------------
-- MONITORING & PERFORMANCE
-- ----------------------------------------------------------------------------

-- Monitoring events summary
SELECT
    event_type,
    COUNT(*) as event_count,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
    ROUND(100.0 * SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate,
    ROUND(AVG(duration_ms), 0) as avg_duration_ms,
    ROUND(MAX(duration_ms), 0) as max_duration_ms
FROM monitoring_logs
GROUP BY event_type
ORDER BY event_count DESC;

-- Recent monitoring events (last 50)
SELECT
    datetime(timestamp) as time,
    event_type,
    sport,
    duration_ms,
    CASE WHEN success = 1 THEN 'Success' ELSE 'Failed' END as status,
    SUBSTR(details, 1, 100) as details_preview
FROM monitoring_logs
ORDER BY timestamp DESC
LIMIT 50;

-- Error events (last 7 days)
SELECT
    datetime(timestamp) as time,
    event_type,
    sport,
    details
FROM monitoring_logs
WHERE success = 0
AND timestamp >= datetime('now', '-7 days')
ORDER BY timestamp DESC
LIMIT 50;

-- Success rate by day (last 30 days)
SELECT
    DATE(timestamp) as date,
    COUNT(*) as total_events,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
    ROUND(100.0 * SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM monitoring_logs
WHERE timestamp >= datetime('now', '-30 days')
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Performance trends (average duration by hour)
SELECT
    strftime('%Y-%m-%d %H:00', timestamp) as hour,
    COUNT(*) as events,
    ROUND(AVG(duration_ms), 0) as avg_duration_ms,
    ROUND(MIN(duration_ms), 0) as min_duration_ms,
    ROUND(MAX(duration_ms), 0) as max_duration_ms
FROM monitoring_logs
WHERE timestamp >= datetime('now', '-24 hours')
AND duration_ms IS NOT NULL
GROUP BY hour
ORDER BY hour DESC;

-- Monitoring events by sport
SELECT
    sport,
    COUNT(*) as events,
    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
    ROUND(AVG(duration_ms), 0) as avg_duration_ms
FROM monitoring_logs
WHERE sport IS NOT NULL
GROUP BY sport
ORDER BY events DESC;

-- ----------------------------------------------------------------------------
-- DATA QUALITY
-- ----------------------------------------------------------------------------

-- Trends without sources
SELECT
    id,
    sport,
    title,
    viral_score,
    datetime(created_at) as created
FROM trends
WHERE json_array_length(sources) = 0
ORDER BY created_at DESC
LIMIT 20;

-- Trends without key players or teams
SELECT
    id,
    sport,
    title,
    viral_score,
    CASE
        WHEN json_array_length(key_players) = 0 THEN 'No players'
        ELSE 'Has players'
    END as player_status,
    CASE
        WHEN json_array_length(team_ids) = 0 THEN 'No teams'
        ELSE 'Has teams'
    END as team_status,
    datetime(created_at) as created
FROM trends
WHERE json_array_length(key_players) = 0
   OR json_array_length(team_ids) = 0
ORDER BY created_at DESC
LIMIT 20;

-- Unprocessed articles (need to be analyzed)
SELECT
    sport,
    COUNT(*) as unprocessed_count
FROM news_articles
WHERE processed = 0
GROUP BY sport
ORDER BY unprocessed_count DESC;

-- Old unprocessed articles (>48 hours)
SELECT
    sport,
    title,
    source_name,
    datetime(created_at) as fetched,
    ROUND((julianday('now') - julianday(created_at)) * 24, 1) as hours_old
FROM news_articles
WHERE processed = 0
AND created_at < datetime('now', '-48 hours')
ORDER BY created_at
LIMIT 20;

-- ----------------------------------------------------------------------------
-- GROWTH METRICS
-- ----------------------------------------------------------------------------

-- Daily trend creation (last 30 days)
SELECT
    DATE(created_at) as date,
    COUNT(*) as trends_created,
    ROUND(AVG(viral_score), 2) as avg_viral_score
FROM trends
WHERE created_at >= datetime('now', '-30 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Weekly article collection (last 12 weeks)
SELECT
    strftime('%Y-W%W', created_at) as week,
    COUNT(*) as articles_collected,
    COUNT(DISTINCT sport) as sports_covered
FROM news_articles
WHERE created_at >= datetime('now', '-12 weeks')
GROUP BY week
ORDER BY week DESC;

-- Sport coverage over time (last 30 days)
SELECT
    DATE(created_at) as date,
    sport,
    COUNT(*) as trends
FROM trends
WHERE created_at >= datetime('now', '-30 days')
GROUP BY DATE(created_at), sport
ORDER BY date DESC, trends DESC;

-- ----------------------------------------------------------------------------
-- CLEANUP CANDIDATES
-- ----------------------------------------------------------------------------

-- Old articles (>90 days)
SELECT
    COUNT(*) as old_articles,
    ROUND(SUM(LENGTH(title) + LENGTH(description)) / 1024.0 / 1024.0, 2) as est_mb
FROM news_articles
WHERE created_at < datetime('now', '-90 days');

-- Old trends (>90 days)
SELECT
    COUNT(*) as old_trends,
    ROUND(SUM(LENGTH(title) + LENGTH(summary) + LENGTH(sources)) / 1024.0 / 1024.0, 2) as est_mb
FROM trends
WHERE created_at < datetime('now', '-90 days');

-- Old monitoring logs (>90 days)
SELECT
    COUNT(*) as old_logs,
    ROUND(SUM(LENGTH(details)) / 1024.0 / 1024.0, 2) as est_mb
FROM monitoring_logs
WHERE timestamp < datetime('now', '-90 days');

-- ============================================================================
-- END OF DASHBOARD QUERIES
-- ============================================================================
