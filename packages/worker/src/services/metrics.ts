import { z } from 'zod';
import type { Env } from '../bindings';

const gameSchema = z.object({
  id: z.string(),
  league: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  venue: z.string(),
  startTime: z.string(),
  status: z.enum(['scheduled', 'live', 'final']),
  scoreHome: z.number(),
  scoreAway: z.number(),
  pace: z.number(),
  winProbability: z.number()
});

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  record: z.string(),
  offensiveRating: z.number(),
  defensiveRating: z.number(),
  netRating: z.number(),
  streak: z.string(),
  trend: z.array(z.number())
});

const narrativeSchema = z.object({
  id: z.string(),
  headline: z.string(),
  body: z.string(),
  impact: z.enum(['high', 'medium', 'low'])
});

const spotlightSchema = z.object({
  id: z.string(),
  name: z.string(),
  team: z.string(),
  position: z.string(),
  efficiency: z.number(),
  usage: z.number(),
  trueShooting: z.number()
});

export type DashboardDTO = {
  games: z.infer<typeof gameSchema>[];
  teams: z.infer<typeof teamSchema>[];
  narratives: z.infer<typeof narrativeSchema>[];
  spotlights: z.infer<typeof spotlightSchema>[];
};

export async function getDashboard(env: Env): Promise<DashboardDTO> {
  const cacheKey = 'dashboard:seed';
  const cached = await env.BSI_CACHE.get(cacheKey, 'json');
  if (cached) {
    return cached as DashboardDTO;
  }

  const [games, teams, narratives, spotlights] = await Promise.all([
    queryGames(env),
    queryTeams(env),
    queryNarratives(env),
    querySpotlights(env)
  ]);

  const payload: DashboardDTO = {
    games: games.map((game) => ({
      id: game.id,
      league: game.league,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      venue: game.venue,
      startTime: game.startTime,
      status: game.status,
      scoreHome: game.scoreHome,
      scoreAway: game.scoreAway,
      pace: game.pace,
      winProbability: game.winProbability
    })),
    teams,
    narratives,
    spotlights
  };

  await env.BSI_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: 30 });
  return payload;
}

async function queryGames(env: Env) {
  const leagues = env.PRIMARY_LEAGUES.split(',').map((league) => league.trim()).filter(Boolean);
  if (leagues.length === 0) {
    return [] as z.infer<typeof gameSchema>[];
  }
  const placeholders = leagues.map(() => '?').join(',');
  const result = await env.BSI_DB.prepare(
    `SELECT id, league, home_team as homeTeam, away_team as awayTeam, venue, start_time as startTime, status,
            score_home as scoreHome, score_away as scoreAway, pace, win_probability as winProbability
     FROM games
     WHERE league IN (${placeholders})
     ORDER BY start_time ASC
     LIMIT 4`
  )
    .bind(...leagues)
    .all();

  return result.results?.map((row) => gameSchema.parse(row)) ?? [];
}

async function queryTeams(env: Env) {
  const result = await env.BSI_DB.prepare(
    `SELECT id, name, record, offensive_rating as offensiveRating, defensive_rating as defensiveRating,
            net_rating as netRating, streak, trend
     FROM teams
     ORDER BY net_rating DESC
     LIMIT 6`
  ).all();

  return (
    result.results?.map((row) => {
      const parsed = teamSchema.parse({ ...row, trend: safeJsonArray(row.trend) });
      return { ...parsed, trend: parsed.trend as number[] };
    }) ?? []
  );
}

async function queryNarratives(env: Env) {
  const result = await env.BSI_DB.prepare(
    `SELECT id, headline, body, impact
     FROM narratives
     ORDER BY created_at DESC
     LIMIT 6`
  ).all();

  return result.results?.map((row) => narrativeSchema.parse(row)) ?? [];
}

async function querySpotlights(env: Env) {
  const result = await env.BSI_DB.prepare(
    `SELECT id, name, team, position, efficiency, usage, true_shooting as trueShooting
     FROM players
     ORDER BY efficiency DESC
     LIMIT 4`
  ).all();

  return result.results?.map((row) => spotlightSchema.parse(row)) ?? [];
}

function safeJsonArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[BSI] Failed to parse trend JSON', error);
      return [];
    }
  }

  return [];
}
