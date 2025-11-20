/**
 * Blaze Monitor Worker - Database Performance Monitoring
 *
 * Monitors D1 databases and tracks:
 * - Query performance
 * - Database size
 * - Growth rates
 * - Error rates
 * - Cache hit rates
 */

interface Env {
  DB: D1Database;
  BLAZE_MONITOR_CACHE: KVNamespace;
  DATABASE_URLS?: string;  // JSON array of database connection info
}

interface DatabaseMetrics {
  database_name: string;
  total_tables: number;
  total_rows: number;
  database_size_kb: number;
  growth_rate_mb_per_day: number;
  avg_query_time_ms: number;
  error_count: number;
  timestamp: string;
}

interface PerformanceMetrics {
  worker_name: string;
  cache_hit_rate: number;
  avg_query_time_ms: number;
  total_queries: number;
  cache_hits: number;
  cache_misses: number;
  error_rate: number;
  timestamp: string;
}

interface AlertConfig {
  database_size_threshold_gb: number;
  growth_rate_threshold_mb_per_day: number;
  error_rate_threshold: number;
  query_time_threshold_ms: number;
}

const ALERT_CONFIG: AlertConfig = {
  database_size_threshold_gb: 50,
  growth_rate_threshold_mb_per_day: 1000,
  error_rate_threshold: 0.05, // 5%
  query_time_threshold_ms: 500,
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Health check
    if (url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        service: 'blaze-monitor',
        timestamp: new Date().toISOString()
      });
    }

    // Get metrics
    if (url.pathname === '/metrics' && request.method === 'GET') {
      return await handleGetMetrics(request, env);
    }

    // Get database stats
    if (url.pathname === '/databases' && request.method === 'GET') {
      return await handleGetDatabases(request, env);
    }

    // Get alerts
    if (url.pathname === '/alerts' && request.method === 'GET') {
      return await handleGetAlerts(request, env);
    }

    // Trigger manual monitoring
    if (url.pathname === '/monitor' && request.method === 'POST') {
      await runMonitoring(env);
      return jsonResponse({ success: true, message: 'Monitoring completed' });
    }

    return jsonResponse({ error: 'Not Found' }, 404);
  },

  /**
   * Scheduled monitoring (runs every 5 minutes via cron)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    console.log('Running scheduled monitoring...');
    await runMonitoring(env);
  },
};

/**
 * Main monitoring function
 */
async function runMonitoring(env: Env): Promise<void> {
  try {
    // Collect database metrics
    const dbMetrics = await collectDatabaseMetrics(env);

    // Store metrics
    await storeDatabaseMetrics(env, dbMetrics);

    // Check for alerts
    const alerts = checkForAlerts(dbMetrics);

    if (alerts.length > 0) {
      await storeAlerts(env, alerts);
      // In production, send notifications here
      console.log('Alerts generated:', alerts);
    }

    console.log('Monitoring completed successfully');
  } catch (error) {
    console.error('Monitoring error:', error);
    // Log error to database
    await logError(env, error);
  }
}

/**
 * Collect metrics from all databases
 */
async function collectDatabaseMetrics(env: Env): Promise<DatabaseMetrics[]> {
  const metrics: DatabaseMetrics[] = [];

  // Monitor the monitoring database itself
  const selfMetrics = await collectDatabaseStats(env, env.DB, 'blaze-monitor-db');
  metrics.push(selfMetrics);

  // TODO: Add logic to monitor other databases
  // This would require binding to multiple databases in wrangler.toml

  return metrics;
}

/**
 * Collect statistics for a single database
 */
async function collectDatabaseStats(
  env: Env,
  db: D1Database,
  dbName: string
): Promise<DatabaseMetrics> {
  // Get table count
  const tables = await db.prepare(`
    SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
  `).first<{ count: number }>();

  // Get total rows (approximate)
  const tablesQuery = await db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table'
  `).all<{ name: string }>();

  let totalRows = 0;
  for (const table of tablesQuery.results) {
    const rowCount = await db.prepare(
      `SELECT COUNT(*) as count FROM ${table.name}`
    ).first<{ count: number }>();
    totalRows += rowCount?.count || 0;
  }

  // Get database size (approximate)
  const sizeQuery = await db.prepare(`
    SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()
  `).first<{ size: number }>();

  const databaseSizeKb = (sizeQuery?.size || 0) / 1024;

  // Calculate growth rate (compare with yesterday's metrics)
  const growthRate = await calculateGrowthRate(env, dbName, databaseSizeKb);

  // Get average query time from recent metrics
  const avgQueryTime = await getAverageQueryTime(env, dbName);

  // Get error count from last period
  const errorCount = await getErrorCount(env, dbName);

  return {
    database_name: dbName,
    total_tables: tables?.count || 0,
    total_rows: totalRows,
    database_size_kb: databaseSizeKb,
    growth_rate_mb_per_day: growthRate,
    avg_query_time_ms: avgQueryTime,
    error_count: errorCount,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate database growth rate
 */
async function calculateGrowthRate(
  env: Env,
  dbName: string,
  currentSize: number
): Promise<number> {
  // Get yesterday's size
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const previousMetrics = await env.DB.prepare(`
    SELECT database_size_kb FROM database_metrics
    WHERE database_name = ? AND timestamp >= ?
    ORDER BY timestamp DESC LIMIT 1
  `).bind(dbName, yesterday.toISOString()).first<{ database_size_kb: number }>();

  if (!previousMetrics) {
    return 0;
  }

  const growthKb = currentSize - previousMetrics.database_size_kb;
  const growthMb = growthKb / 1024;

  return growthMb;
}

/**
 * Get average query time
 */
async function getAverageQueryTime(env: Env, dbName: string): Promise<number> {
  const metrics = await env.DB.prepare(`
    SELECT AVG(avg_query_time_ms) as avg_time
    FROM performance_metrics
    WHERE worker_name = ? AND timestamp >= datetime('now', '-1 hour')
  `).bind(dbName).first<{ avg_time: number }>();

  return metrics?.avg_time || 0;
}

/**
 * Get error count
 */
async function getErrorCount(env: Env, dbName: string): Promise<number> {
  const errors = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM error_logs
    WHERE database_name = ? AND timestamp >= datetime('now', '-5 minutes')
  `).bind(dbName).first<{ count: number }>();

  return errors?.count || 0;
}

/**
 * Store database metrics
 */
async function storeDatabaseMetrics(
  env: Env,
  metrics: DatabaseMetrics[]
): Promise<void> {
  for (const metric of metrics) {
    await env.DB.prepare(`
      INSERT INTO database_metrics
      (database_name, total_tables, total_rows, database_size_kb,
       growth_rate_mb_per_day, avg_query_time_ms, error_count, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      metric.database_name,
      metric.total_tables,
      metric.total_rows,
      metric.database_size_kb,
      metric.growth_rate_mb_per_day,
      metric.avg_query_time_ms,
      metric.error_count,
      metric.timestamp
    ).run();
  }

  // Also cache latest metrics in KV for fast access
  await env.BLAZE_MONITOR_CACHE.put(
    'latest_metrics',
    JSON.stringify(metrics),
    { expirationTtl: 300 } // 5 minutes
  );
}

/**
 * Check for alerts
 */
function checkForAlerts(metrics: DatabaseMetrics[]): Array<{
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  database: string;
  value: number;
  threshold: number;
}> {
  const alerts: Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
    database: string;
    value: number;
    threshold: number;
  }> = [];

  for (const metric of metrics) {
    // Check database size
    const sizeGb = metric.database_size_kb / 1024 / 1024;
    if (sizeGb > ALERT_CONFIG.database_size_threshold_gb) {
      alerts.push({
        type: 'database_size',
        severity: 'warning',
        message: `Database ${metric.database_name} exceeds size threshold`,
        database: metric.database_name,
        value: sizeGb,
        threshold: ALERT_CONFIG.database_size_threshold_gb
      });
    }

    // Check growth rate
    if (metric.growth_rate_mb_per_day > ALERT_CONFIG.growth_rate_threshold_mb_per_day) {
      alerts.push({
        type: 'growth_rate',
        severity: 'warning',
        message: `Database ${metric.database_name} growing rapidly`,
        database: metric.database_name,
        value: metric.growth_rate_mb_per_day,
        threshold: ALERT_CONFIG.growth_rate_threshold_mb_per_day
      });
    }

    // Check query time
    if (metric.avg_query_time_ms > ALERT_CONFIG.query_time_threshold_ms) {
      alerts.push({
        type: 'query_performance',
        severity: 'critical',
        message: `Slow queries detected in ${metric.database_name}`,
        database: metric.database_name,
        value: metric.avg_query_time_ms,
        threshold: ALERT_CONFIG.query_time_threshold_ms
      });
    }

    // Check errors
    if (metric.error_count > 0) {
      alerts.push({
        type: 'errors',
        severity: 'critical',
        message: `Errors detected in ${metric.database_name}`,
        database: metric.database_name,
        value: metric.error_count,
        threshold: 0
      });
    }
  }

  return alerts;
}

/**
 * Store alerts
 */
async function storeAlerts(env: Env, alerts: any[]): Promise<void> {
  for (const alert of alerts) {
    await env.DB.prepare(`
      INSERT INTO alerts
      (type, severity, message, database_name, value, threshold, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      alert.type,
      alert.severity,
      alert.message,
      alert.database,
      alert.value,
      alert.threshold,
      new Date().toISOString()
    ).run();
  }
}

/**
 * Log error
 */
async function logError(env: Env, error: any): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO error_logs (database_name, error_message, timestamp)
    VALUES (?, ?, ?)
  `).bind(
    'blaze-monitor',
    error instanceof Error ? error.message : String(error),
    new Date().toISOString()
  ).run();
}

/**
 * Get metrics endpoint handler
 */
async function handleGetMetrics(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const database = url.searchParams.get('database');
  const limit = parseInt(url.searchParams.get('limit') || '100');

  let query = `
    SELECT * FROM database_metrics
    ${database ? 'WHERE database_name = ?' : ''}
    ORDER BY timestamp DESC LIMIT ?
  `;

  const params = database ? [database, limit] : [limit];
  const result = await env.DB.prepare(query).bind(...params).all();

  return jsonResponse(result.results);
}

/**
 * Get databases endpoint handler
 */
async function handleGetDatabases(request: Request, env: Env): Promise<Response> {
  // Get latest metrics for all databases
  const cached = await env.BLAZE_MONITOR_CACHE.get('latest_metrics', 'json');

  if (cached) {
    return jsonResponse(cached);
  }

  // Fallback to database query
  const result = await env.DB.prepare(`
    SELECT DISTINCT database_name,
      (SELECT database_size_kb FROM database_metrics m2
       WHERE m2.database_name = m1.database_name
       ORDER BY timestamp DESC LIMIT 1) as size_kb
    FROM database_metrics m1
  `).all();

  return jsonResponse(result.results);
}

/**
 * Get alerts endpoint handler
 */
async function handleGetAlerts(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const severity = url.searchParams.get('severity');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  let query = `
    SELECT * FROM alerts
    ${severity ? 'WHERE severity = ?' : ''}
    ORDER BY timestamp DESC LIMIT ?
  `;

  const params = severity ? [severity, limit] : [limit];
  const result = await env.DB.prepare(query).bind(...params).all();

  return jsonResponse(result.results);
}

function handleCORS(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function jsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
