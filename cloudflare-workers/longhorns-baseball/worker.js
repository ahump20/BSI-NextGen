/**
 * Texas Longhorns Baseball Stats - Cloudflare Worker
 * Production-ready RESTful API for real-time baseball statistics
 * Endpoints: POST /api/update, GET /api/stats, GET /api/analytics, GET /
 */

import { scrapeAllStats } from './scraper.js';

// Timezone for Central Time (America/Chicago)
const TIMEZONE = 'America/Chicago';

/**
 * Format timestamp in Central Time
 */
function getCentralTime() {
  return new Date().toLocaleString('en-US', { timeZone: TIMEZONE });
}

/**
 * CORS headers for API responses
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * Store stats in D1 database (Updated for game-by-game data)
 */
async function storeStats(db, stats) {
  const insertedCount = { batting: 0, pitching: 0 };
  const errors = [];

  for (const stat of stats) {
    try {
      // Common fields for both batting and pitching
      const baseQuery = `
        INSERT OR REPLACE INTO player_stats (
          player_name, player_espn_id, stat_type, team_id, season,
          game_date, opponent, opponent_id, home_away, game_result,
      `;

      const query = stat.stat_type === 'batting'
        ? baseQuery + `
            at_bats, runs, hits, doubles, triples, home_runs, rbi,
            walks, strikeouts, stolen_bases, caught_stealing, hit_by_pitch,
            sacrifice_flies, source_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
        : baseQuery + `
            innings_pitched, hits_allowed, runs_allowed, earned_runs,
            walks_allowed, strikeouts_pitched, home_runs_allowed, source_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

      // Get team_id from teams table (default to 1 for Texas Longhorns)
      const teamResult = await db.prepare(
        'SELECT id FROM teams WHERE espn_team_id = ? LIMIT 1'
      ).bind(stat.team_id || '251').first();

      const teamId = teamResult?.id || 1;

      const params = stat.stat_type === 'batting'
        ? [
            stat.player_name,
            stat.player_espn_id || null,
            stat.stat_type,
            teamId,
            stat.season || new Date().getFullYear(),
            stat.game_date,
            stat.opponent || 'Unknown',
            stat.opponent_id || null,
            stat.home_away || 'neutral',
            stat.game_result || null,
            stat.at_bats || 0,
            stat.runs || 0,
            stat.hits || 0,
            stat.doubles || 0,
            stat.triples || 0,
            stat.home_runs || 0,
            stat.rbi || 0,
            stat.walks || 0,
            stat.strikeouts || 0,
            stat.stolen_bases || 0,
            stat.caught_stealing || 0,
            stat.hit_by_pitch || 0,
            stat.sacrifice_flies || 0,
            stat.source_url || `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball`,
          ]
        : [
            stat.player_name,
            stat.player_espn_id || null,
            stat.stat_type,
            teamId,
            stat.season || new Date().getFullYear(),
            stat.game_date,
            stat.opponent || 'Unknown',
            stat.opponent_id || null,
            stat.home_away || 'neutral',
            stat.game_result || null,
            stat.innings_pitched || 0,
            stat.hits_allowed || 0,
            stat.runs_allowed || 0,
            stat.earned_runs || 0,
            stat.walks_allowed || 0,
            stat.strikeouts_pitched || 0,
            stat.home_runs_allowed || 0,
            stat.source_url || `https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball`,
          ];

      await db.prepare(query).bind(...params).run();

      insertedCount[stat.stat_type]++;
    } catch (error) {
      errors.push({ player: stat.player_name, error: error.message });
    }
  }

  return { insertedCount, errors };
}

/**
 * GET /api/stats - Query player statistics
 * Query params: player (optional), stat_type (optional)
 */
async function handleGetStats(request, env) {
  const url = new URL(request.url);
  const player = url.searchParams.get('player');
  const statType = url.searchParams.get('stat_type');

  let query = 'SELECT * FROM player_stats WHERE 1=1';
  const params = [];

  if (player) {
    query += ' AND player_name LIKE ?';
    params.push(`%${player}%`);
  }

  if (statType) {
    query += ' AND stat_type = ?';
    params.push(statType);
  }

  query += ' ORDER BY game_date DESC, player_name ASC LIMIT 100';

  try {
    const stmt = env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    return jsonResponse({
      success: true,
      count: results.length,
      data: results,
      metadata: {
        timestamp: getCentralTime(),
        timezone: TIMEZONE,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
}

/**
 * GET /api/analytics - Advanced analytics and rankings
 */
async function handleGetAnalytics(request, env) {
  try {
    // Top 10 hitters by OPS
    const topHitters = await env.DB.prepare(`
      SELECT player_name, at_bats, hits, walks, ops, batting_avg, on_base_pct, slugging_pct
      FROM player_stats
      WHERE stat_type = 'batting' AND at_bats >= 10
      ORDER BY ops DESC
      LIMIT 10
    `).all();

    // Top 10 pitchers by ERA
    const topPitchers = await env.DB.prepare(`
      SELECT player_name, innings_pitched, earned_runs, era, whip, k_per_9, bb_per_9
      FROM player_stats
      WHERE stat_type = 'pitching' AND innings_pitched >= 5
      ORDER BY era ASC
      LIMIT 10
    `).all();

    // Season aggregates
    const seasonStats = await env.DB.prepare(`
      SELECT
        COUNT(DISTINCT player_name) as total_players,
        COUNT(*) as total_records,
        SUM(CASE WHEN stat_type = 'batting' THEN 1 ELSE 0 END) as batting_records,
        SUM(CASE WHEN stat_type = 'pitching' THEN 1 ELSE 0 END) as pitching_records,
        MAX(scraped_at) as last_update
      FROM player_stats
    `).first();

    return jsonResponse({
      success: true,
      analytics: {
        topHitters: topHitters.results || [],
        topPitchers: topPitchers.results || [],
        seasonStats,
      },
      metadata: {
        timestamp: getCentralTime(),
        timezone: TIMEZONE,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
}

/**
 * POST /api/update - Trigger scrape and database update
 */
async function handleUpdate(request, env) {
  try {
    // Scrape latest stats
    const scrapeResult = await scrapeAllStats();

    if (!scrapeResult.success) {
      return jsonResponse(
        {
          success: false,
          error: scrapeResult.error,
          metadata: scrapeResult.metadata,
        },
        500
      );
    }

    // Store in database
    const storeResult = await storeStats(env.DB, scrapeResult.data);

    return jsonResponse({
      success: true,
      scrape: scrapeResult.metadata,
      storage: storeResult,
      metadata: {
        timestamp: getCentralTime(),
        timezone: TIMEZONE,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        success: false,
        error: error.message,
      },
      500
    );
  }
}

/**
 * GET / - Serve dashboard
 */
async function handleDashboard(request, env) {
  // Dashboard HTML will be imported from dashboard.html
  const dashboardHTML = await import('./dashboard.html');
  return new Response(dashboardHTML.default, {
    headers: {
      'Content-Type': 'text/html',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Route requests
    if (url.pathname === '/api/update' && request.method === 'POST') {
      return handleUpdate(request, env);
    }

    if (url.pathname === '/api/stats' && request.method === 'GET') {
      return handleGetStats(request, env);
    }

    if (url.pathname === '/api/analytics' && request.method === 'GET') {
      return handleGetAnalytics(request, env);
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return handleDashboard(request, env);
    }

    // 404 for unknown routes
    return jsonResponse(
      {
        success: false,
        error: 'Not found',
        availableEndpoints: [
          'POST /api/update',
          'GET /api/stats?player=&stat_type=',
          'GET /api/analytics',
          'GET /',
        ],
      },
      404
    );
  },

  // Scheduled trigger (runs daily at 6 AM CT)
  async scheduled(event, env, ctx) {
    try {
      const scrapeResult = await scrapeAllStats();
      if (scrapeResult.success) {
        await storeStats(env.DB, scrapeResult.data);
        console.log(`Scheduled update completed: ${scrapeResult.metadata.playerCount} players`);
      }
    } catch (error) {
      console.error('Scheduled update failed:', error);
    }
  },
};
