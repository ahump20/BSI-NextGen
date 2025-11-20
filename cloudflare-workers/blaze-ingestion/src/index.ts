/**
 * Blaze Sports Ingestion Worker
 *
 * Scheduled worker that ingests sports data from external APIs
 * into Cloudflare D1 database for persistence and historical queries.
 *
 * Runs every 15 minutes via Cron Trigger
 */

import { MLBIngestor } from './ingestors/mlb-ingestor';
import { NFLIngestor } from './ingestors/nfl-ingestor';
import { NBAIngestor } from './ingestors/nba-ingestor';
import { NCAAIngestor } from './ingestors/ncaa-ingestor';

export interface Env {
  BLAZE_DB: D1Database;
  SPORTS_CACHE: KVNamespace;
  SPORTSDATAIO_API_KEY: string;
}

export interface IngestionSummary {
  mlb: { success: boolean; records: number; error: string | null };
  nfl: { success: boolean; records: number; error: string | null };
  nba: { success: boolean; records: number; error: string | null };
  ncaa: { success: boolean; records: number; error: string | null };
}

export default {
  /**
   * Cron Trigger Handler
   * Runs every 15 minutes: */15 * * * *
   */
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log('[Ingestion] Starting scheduled ingestion job', {
      scheduledTime: new Date(event.scheduledTime).toISOString(),
      cron: event.cron,
    });

    const startTime = Date.now();
    const results: IngestionSummary = {
      mlb: { success: false, records: 0, error: null },
      nfl: { success: false, records: 0, error: null },
      nba: { success: false, records: 0, error: null },
      ncaa: { success: false, records: 0, error: null },
    };

    // Ingest MLB games
    try {
      const mlbIngestor = new MLBIngestor(env);
      const mlbResult = await mlbIngestor.ingestTodaysGames();
      results.mlb.success = true;
      results.mlb.records = mlbResult.inserted + mlbResult.updated;

      console.log('[Ingestion] MLB ingestion complete', {
        inserted: mlbResult.inserted,
        updated: mlbResult.updated,
        failed: mlbResult.failed,
      });
    } catch (error) {
      results.mlb.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Ingestion] MLB ingestion failed:', error);
    }

    // Ingest NFL games
    try {
      const nflIngestor = new NFLIngestor(env);
      const nflResult = await nflIngestor.ingestCurrentWeek();
      results.nfl.success = true;
      results.nfl.records = nflResult.inserted + nflResult.updated;

      console.log('[Ingestion] NFL ingestion complete', {
        inserted: nflResult.inserted,
        updated: nflResult.updated,
        failed: nflResult.failed,
      });
    } catch (error) {
      results.nfl.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Ingestion] NFL ingestion failed:', error);
    }

    // Ingest NBA games
    try {
      const nbaIngestor = new NBAIngestor(env);
      const nbaResult = await nbaIngestor.ingestTodaysGames();
      results.nba.success = true;
      results.nba.records = nbaResult.inserted + nbaResult.updated;

      console.log('[Ingestion] NBA ingestion complete', {
        inserted: nbaResult.inserted,
        updated: nbaResult.updated,
        failed: nbaResult.failed,
      });
    } catch (error) {
      results.nba.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Ingestion] NBA ingestion failed:', error);
    }

    // Ingest NCAA Football games
    try {
      const ncaaIngestor = new NCAAIngestor(env);
      const ncaaResult = await ncaaIngestor.ingestCurrentWeek();
      results.ncaa.success = true;
      results.ncaa.records = ncaaResult.inserted + ncaaResult.updated;

      console.log('[Ingestion] NCAA ingestion complete', {
        inserted: ncaaResult.inserted,
        updated: ncaaResult.updated,
        failed: ncaaResult.failed,
      });
    } catch (error) {
      results.ncaa.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Ingestion] NCAA ingestion failed:', error);
    }

    const duration = Date.now() - startTime;
    const totalRecords = Object.values(results).reduce((sum, r) => sum + r.records, 0);

    console.log('[Ingestion] Completed scheduled job', {
      duration: `${duration}ms`,
      totalRecords,
      successCount: Object.values(results).filter(r => r.success).length,
      failureCount: Object.values(results).filter(r => !r.success).length,
    });

    // Log to ingestion_logs table
    await logIngestionRun(env.BLAZE_DB, {
      startTime,
      duration,
      results,
    });
  },

  /**
   * HTTP Handler for Manual Triggers and Health Checks
   */
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Manual ingestion trigger
    if (url.pathname === '/ingest' && request.method === 'POST') {
      // Trigger ingestion manually
      ctx.waitUntil(
        this.scheduled(
          {
            scheduledTime: Date.now(),
            cron: 'manual',
          } as ScheduledEvent,
          env,
          ctx
        )
      );

      return new Response(
        JSON.stringify({
          message: 'Ingestion job started',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get recent ingestion logs
    if (url.pathname === '/logs' && request.method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '10');

      const logs = await env.BLAZE_DB.prepare(
        `SELECT * FROM ingestion_logs
         ORDER BY started_at DESC
         LIMIT ?`
      )
        .bind(limit)
        .all();

      return new Response(JSON.stringify(logs.results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Log ingestion run to database
 */
async function logIngestionRun(
  db: D1Database,
  data: {
    startTime: number;
    duration: number;
    results: IngestionSummary;
  }
): Promise<void> {
  for (const [league, result] of Object.entries(data.results)) {
    await db
      .prepare(
        `INSERT INTO ingestion_logs
         (id, league_id, ingestion_type, records_processed, records_inserted,
          started_at, completed_at, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        league,
        'games',
        result.records,
        result.success ? result.records : 0,
        Math.floor(data.startTime / 1000), // Convert to Unix timestamp (seconds)
        Math.floor((data.startTime + data.duration) / 1000),
        result.error
      )
      .run();
  }
}
