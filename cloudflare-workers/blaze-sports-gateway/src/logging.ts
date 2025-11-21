import { Env, GameState } from './types';

function isoDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export async function logSession(env: Env, sessionId: string, route: string, state: GameState, eventDate: string | null, ip?: string, userAgent?: string) {
  await env.OBS_DB.prepare(
    `INSERT INTO session_logs (session_id, route, ip_address, user_agent, last_game_state, last_event_date)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT(session_id) DO UPDATE SET
       route = excluded.route,
       ip_address = excluded.ip_address,
       user_agent = excluded.user_agent,
       last_seen = datetime('now'),
       last_game_state = excluded.last_game_state,
       last_event_date = excluded.last_event_date`
  ).run(sessionId, route, ip || null, userAgent || null, state, eventDate);
}

export async function logEvent(env: Env, sessionId: string, route: string, statusCode: number, cacheStatus: string, state: GameState, eventDate: string | null) {
  await env.OBS_DB.prepare(
    `INSERT INTO event_logs (session_id, route, status_code, cache_status, game_state, event_date)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`
  ).run(sessionId, route, statusCode, cacheStatus, state, eventDate);
}

export async function logUsage(env: Env, route: string, cacheStatus: string, state: GameState) {
  const today = isoDate();
  await env.OBS_DB.prepare(
    `INSERT INTO usage_metrics (usage_date, route, total_requests, cache_hits, last_game_state)
     VALUES (?1, ?2, 1, ?3, ?4)
     ON CONFLICT(usage_date, route) DO UPDATE SET
       total_requests = usage_metrics.total_requests + 1,
       cache_hits = usage_metrics.cache_hits + ?3,
       last_game_state = excluded.last_game_state`
  ).run(today, route, cacheStatus === 'HIT' ? 1 : 0, state);
}
