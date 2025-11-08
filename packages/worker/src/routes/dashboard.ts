import type { Env } from '../bindings';
import { getDashboard } from '../services/metrics';

export function createDashboardHandler() {
  return async (_request: Request, env: Env) => {
    const payload = await getDashboard(env);

    const formatted = payload.games.map((game) => ({
      id: game.id,
      league: game.league,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      venue: game.venue,
      startTime: game.startTime,
      status: game.status,
      score: {
        home: game.scoreHome,
        away: game.scoreAway
      },
      pace: game.pace,
      winProbability: game.winProbability,
      lastUpdated: new Date().toISOString()
    }));

    return new Response(
      JSON.stringify({
        games: formatted,
        teams: payload.teams,
        narratives: payload.narratives,
        spotlights: payload.spotlights
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10'
        }
      }
    );
  };
}
