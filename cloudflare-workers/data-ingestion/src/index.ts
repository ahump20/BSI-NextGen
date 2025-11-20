/**
 * Blaze Sports Intel - Data Ingestion Worker
 *
 * Purpose: Periodic ingestion of sports data from live APIs into D1 for historical tracking
 * Schedule: Runs every 15 minutes via Cloudflare Cron Triggers
 * Storage: Cloudflare D1 database
 */

export interface Env {
  DB: D1Database;
  WEB_APP_ORIGIN: string; // e.g., https://blazesportsintel.com
  SPORTSDATAIO_API_KEY?: string;
}

type IngestResult = {
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
};

/**
 * Main worker entry point
 */
export default {
  /**
   * Scheduled trigger (cron)
   * Runs every 15 minutes to ingest latest data
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('[Ingestion] Scheduled run started:', new Date().toISOString());

    const startTime = Date.now();
    const jobId = crypto.randomUUID();

    try {
      // Run ingestion for all sports in parallel
      const results = await Promise.allSettled([
        ingestMLBGames(env),
        ingestNFLGames(env),
        ingestNBAGames(env),
        ingestNCAAFootballGames(env),
        ingestNCAABasketballGames(env),
        ingestCollegeBaseballGames(env),
      ]);

      // Log results
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const sportNames = ['MLB', 'NFL', 'NBA', 'NCAA Football', 'NCAA Basketball', 'College Baseball'];

        if (result.status === 'fulfilled') {
          await logIngestion(env, {
            jobType: 'games',
            sport: sportNames[i],
            status: 'success',
            ...result.value,
            startedAt: new Date(startTime).toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime,
          });
        } else {
          await logIngestion(env, {
            jobType: 'games',
            sport: sportNames[i],
            status: 'failed',
            recordsProcessed: 0,
            recordsInserted: 0,
            recordsUpdated: 0,
            recordsFailed: 0,
            errorMessage: result.reason?.message || 'Unknown error',
            startedAt: new Date(startTime).toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime,
          });
        }
      }

      console.log('[Ingestion] Scheduled run completed in', Date.now() - startTime, 'ms');
    } catch (error) {
      console.error('[Ingestion] Scheduled run failed:', error);
    }
  },

  /**
   * HTTP trigger for manual ingestion
   * GET /ingest?sport=mlb
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Manual ingestion trigger
    if (url.pathname === '/ingest') {
      const sport = url.searchParams.get('sport');
      const startTime = Date.now();

      try {
        let result: IngestResult;

        switch (sport?.toLowerCase()) {
          case 'mlb':
            result = await ingestMLBGames(env);
            break;
          case 'nfl':
            result = await ingestNFLGames(env);
            break;
          case 'nba':
            result = await ingestNBAGames(env);
            break;
          case 'ncaa-football':
            result = await ingestNCAAFootballGames(env);
            break;
          case 'ncaa-basketball':
            result = await ingestNCAABasketballGames(env);
            break;
          case 'college-baseball':
            result = await ingestCollegeBaseballGames(env);
            break;
          case 'all':
            // Run all sports
            const results = await Promise.allSettled([
              ingestMLBGames(env),
              ingestNFLGames(env),
              ingestNBAGames(env),
              ingestNCAAFootballGames(env),
              ingestNCAABasketballGames(env),
              ingestCollegeBaseballGames(env),
            ]);

            const aggregated = results.reduce(
              (acc, r) => {
                if (r.status === 'fulfilled') {
                  acc.recordsProcessed += r.value.recordsProcessed;
                  acc.recordsInserted += r.value.recordsInserted;
                  acc.recordsUpdated += r.value.recordsUpdated;
                  acc.recordsFailed += r.value.recordsFailed;
                  acc.errors.push(...r.value.errors);
                }
                return acc;
              },
              { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] as string[] }
            );

            return new Response(
              JSON.stringify({
                success: true,
                sport: 'all',
                durationMs: Date.now() - startTime,
                ...aggregated,
              }),
              {
                headers: { 'Content-Type': 'application/json' },
              }
            );
          default:
            return new Response(
              JSON.stringify({
                error: 'Invalid sport. Use: mlb, nfl, nba, ncaa-football, ncaa-basketball, college-baseball, or all',
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            );
        }

        await logIngestion(env, {
          jobType: 'games',
          sport: sport || 'unknown',
          status: 'success',
          ...result,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        });

        return new Response(
          JSON.stringify({
            success: true,
            sport,
            durationMs: Date.now() - startTime,
            ...result,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (error) {
        console.error('[Ingestion] Manual trigger failed:', error);

        return new Response(
          JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

/**
 * Ingest MLB games
 */
async function ingestMLBGames(env: Env): Promise<IngestResult> {
  const result: IngestResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${env.WEB_APP_ORIGIN}/api/sports/mlb/games?date=${today}`);

    if (!response.ok) {
      throw new Error(`MLB API returned ${response.status}`);
    }

    const apiData = await response.json();
    const games = apiData.data || [];

    result.recordsProcessed = games.length;

    for (const game of games) {
      try {
        await upsertGame(env, {
          id: `mlb-${game.id}`,
          sport: 'MLB',
          league: 'Major League Baseball',
          gameDate: game.date.split('T')[0],
          gameTime: game.date,
          season: new Date(game.date).getFullYear(),
          homeTeamId: `mlb-${game.homeTeam.id}`,
          awayTeamId: `mlb-${game.awayTeam.id}`,
          homeScore: game.homeScore || 0,
          awayScore: game.awayScore || 0,
          status: game.status,
          period: game.period,
          venueName: game.venue,
          metadata: JSON.stringify({
            linescore: game.linescore,
            probablePitchers: game.probablePitchers,
          }),
        });

        // Upsert teams
        await upsertTeam(env, { ...game.homeTeam, sport: 'MLB' });
        await upsertTeam(env, { ...game.awayTeam, sport: 'MLB' });

        result.recordsInserted++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`MLB game ${game.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.errors.push(`MLB ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Ingest NFL games
 */
async function ingestNFLGames(env: Env): Promise<IngestResult> {
  const result: IngestResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };

  try {
    const currentWeek = 1; // TODO: Calculate current week
    const season = new Date().getFullYear();
    const response = await fetch(`${env.WEB_APP_ORIGIN}/api/sports/nfl/games?season=${season}&week=${currentWeek}`);

    if (!response.ok) {
      throw new Error(`NFL API returned ${response.status}`);
    }

    const apiData = await response.json();
    const games = apiData.data || [];

    result.recordsProcessed = games.length;

    for (const game of games) {
      try {
        await upsertGame(env, {
          id: `nfl-${game.id}`,
          sport: 'NFL',
          league: 'National Football League',
          gameDate: game.date.split('T')[0],
          gameTime: game.date,
          season,
          week: currentWeek,
          homeTeamId: `nfl-${game.homeTeam.id}`,
          awayTeamId: `nfl-${game.awayTeam.id}`,
          homeScore: game.homeScore || 0,
          awayScore: game.awayScore || 0,
          status: game.status,
          period: game.period,
          venueName: game.venue,
          metadata: JSON.stringify({}),
        });

        await upsertTeam(env, { ...game.homeTeam, sport: 'NFL' });
        await upsertTeam(env, { ...game.awayTeam, sport: 'NFL' });

        result.recordsInserted++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`NFL game ${game.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.errors.push(`NFL ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Ingest NBA games
 */
async function ingestNBAGames(env: Env): Promise<IngestResult> {
  const result: IngestResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };

  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`${env.WEB_APP_ORIGIN}/api/sports/nba/games?date=${today}`);

    if (!response.ok) {
      throw new Error(`NBA API returned ${response.status}`);
    }

    const apiData = await response.json();
    const games = apiData.data || [];

    result.recordsProcessed = games.length;

    for (const game of games) {
      try {
        await upsertGame(env, {
          id: `nba-${game.id}`,
          sport: 'NBA',
          league: 'National Basketball Association',
          gameDate: game.date.split('T')[0],
          gameTime: game.date,
          season: new Date(game.date).getFullYear(),
          homeTeamId: `nba-${game.homeTeam.id}`,
          awayTeamId: `nba-${game.awayTeam.id}`,
          homeScore: game.homeScore || 0,
          awayScore: game.awayScore || 0,
          status: game.status,
          period: game.period,
          venueName: game.venue,
          metadata: JSON.stringify({}),
        });

        await upsertTeam(env, { ...game.homeTeam, sport: 'NBA' });
        await upsertTeam(env, { ...game.awayTeam, sport: 'NBA' });

        result.recordsInserted++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`NBA game ${game.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.errors.push(`NBA ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Ingest NCAA Football games from ESPN
 */
async function ingestNCAAFootballGames(env: Env): Promise<IngestResult> {
  const result: IngestResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };

  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard');

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    const games = data.events || [];

    result.recordsProcessed = games.length;

    for (const event of games) {
      try {
        const homeTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');

        if (!homeTeam || !awayTeam) continue;

        await upsertGame(env, {
          id: `ncaa-football-${event.id}`,
          sport: 'NCAA_FOOTBALL',
          league: 'College Football',
          gameDate: event.date.split('T')[0],
          gameTime: event.date,
          season: parseInt(event.season?.year || new Date().getFullYear()),
          homeTeamId: `ncaa-football-${homeTeam.team.id}`,
          awayTeamId: `ncaa-football-${awayTeam.team.id}`,
          homeScore: parseInt(homeTeam.score || '0'),
          awayScore: parseInt(awayTeam.score || '0'),
          status: event.status.type.state,
          period: event.status.type.shortDetail,
          venueName: event.competitions?.[0]?.venue?.fullName,
          metadata: JSON.stringify({ week: event.week }),
        });

        result.recordsInserted++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`NCAA Football game ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.errors.push(`NCAA Football ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Ingest NCAA Basketball games from ESPN
 */
async function ingestNCAABasketballGames(env: Env): Promise<IngestResult> {
  const result: IngestResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };

  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard');

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    const games = data.events || [];

    result.recordsProcessed = games.length;

    for (const event of games) {
      try {
        const homeTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');

        if (!homeTeam || !awayTeam) continue;

        await upsertGame(env, {
          id: `ncaa-basketball-${event.id}`,
          sport: 'NCAA_BASKETBALL',
          league: 'College Basketball',
          gameDate: event.date.split('T')[0],
          gameTime: event.date,
          season: parseInt(event.season?.year || new Date().getFullYear()),
          homeTeamId: `ncaa-basketball-${homeTeam.team.id}`,
          awayTeamId: `ncaa-basketball-${awayTeam.team.id}`,
          homeScore: parseInt(homeTeam.score || '0'),
          awayScore: parseInt(awayTeam.score || '0'),
          status: event.status.type.state,
          period: event.status.type.shortDetail,
          venueName: event.competitions?.[0]?.venue?.fullName,
          metadata: JSON.stringify({}),
        });

        result.recordsInserted++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`NCAA Basketball game ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.errors.push(`NCAA Basketball ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Ingest College Baseball games from ESPN
 */
async function ingestCollegeBaseballGames(env: Env): Promise<IngestResult> {
  const result: IngestResult = { recordsProcessed: 0, recordsInserted: 0, recordsUpdated: 0, recordsFailed: 0, errors: [] };

  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball/scoreboard');

    if (!response.ok) {
      throw new Error(`ESPN API returned ${response.status}`);
    }

    const data = await response.json();
    const games = data.events || [];

    result.recordsProcessed = games.length;

    for (const event of games) {
      try {
        const homeTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = event.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away');

        if (!homeTeam || !awayTeam) continue;

        await upsertGame(env, {
          id: `college-baseball-${event.id}`,
          sport: 'COLLEGE_BASEBALL',
          league: 'NCAA Baseball',
          gameDate: event.date.split('T')[0],
          gameTime: event.date,
          season: parseInt(event.season?.year || new Date().getFullYear()),
          homeTeamId: `college-baseball-${homeTeam.team.id}`,
          awayTeamId: `college-baseball-${awayTeam.team.id}`,
          homeScore: parseInt(homeTeam.score || '0'),
          awayScore: parseInt(awayTeam.score || '0'),
          status: event.status.type.state,
          period: event.status.type.shortDetail,
          venueName: event.competitions?.[0]?.venue?.fullName,
          metadata: JSON.stringify({}),
        });

        result.recordsInserted++;
      } catch (error) {
        result.recordsFailed++;
        result.errors.push(`College Baseball game ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    result.errors.push(`College Baseball ingestion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Helper: Upsert a game record
 */
async function upsertGame(env: Env, game: any): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO games (
      id, sport, league, game_date, game_time, season, week,
      home_team_id, away_team_id, home_score, away_score,
      status, period, venue_name, metadata, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      home_score = excluded.home_score,
      away_score = excluded.away_score,
      status = excluded.status,
      period = excluded.period,
      metadata = excluded.metadata,
      updated_at = datetime('now')
  `)
    .bind(
      game.id,
      game.sport,
      game.league,
      game.gameDate,
      game.gameTime,
      game.season,
      game.week || null,
      game.homeTeamId,
      game.awayTeamId,
      game.homeScore,
      game.awayScore,
      game.status,
      game.period || null,
      game.venueName || null,
      game.metadata
    )
    .run();
}

/**
 * Helper: Upsert a team record
 */
async function upsertTeam(env: Env, team: any): Promise<void> {
  const teamId = `${team.sport?.toLowerCase()}-${team.id}`;

  await env.DB.prepare(`
    INSERT INTO teams (id, sport, name, display_name, abbreviation, city, logo_url, conference, division, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      display_name = excluded.display_name,
      abbreviation = excluded.abbreviation,
      logo_url = excluded.logo_url,
      updated_at = datetime('now')
  `)
    .bind(
      teamId,
      team.sport,
      team.name,
      team.name,
      team.abbreviation,
      team.city || null,
      team.logo || null,
      team.conference || null,
      team.division || null
    )
    .run();
}

/**
 * Helper: Log ingestion run
 */
async function logIngestion(
  env: Env,
  log: {
    jobType: string;
    sport: string;
    status: string;
    recordsProcessed: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsFailed: number;
    errorMessage?: string;
    startedAt: string;
    completedAt: string;
    durationMs: number;
  }
): Promise<void> {
  await env.DB.prepare(`
    INSERT INTO ingestion_log (
      job_type, sport, status, records_processed, records_inserted,
      records_updated, records_failed, error_message,
      started_at, completed_at, duration_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      log.jobType,
      log.sport,
      log.status,
      log.recordsProcessed,
      log.recordsInserted,
      log.recordsUpdated,
      log.recordsFailed,
      log.errorMessage || null,
      log.startedAt,
      log.completedAt,
      log.durationMs
    )
    .run();
}
