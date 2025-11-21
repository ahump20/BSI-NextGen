/**
 * Monte Carlo Simulation API Endpoint
 *
 * Cloudflare Function providing statistical simulation for game outcomes
 * Uses Monte Carlo engine from lib/monte-carlo/simulation-engine.ts
 *
 * POST /api/simulations/monte-carlo
 * Body: {
 *   teamStats: TeamStats,
 *   schedule: Schedule[],
 *   simulations?: number (default 10000)
 * }
 *
 * @author Austin Humphrey - Blaze Intelligence
 */

import { monteCarloEngine, TeamStats, Schedule, SimulationResult } from '../../../lib/monte-carlo/simulation-engine';

interface Env {
  KV: KVNamespace;
}

interface SimulationRequest {
  teamStats: TeamStats;
  schedule: Schedule[];
  simulations?: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Parse request body
    const requestBody = await context.request.json() as SimulationRequest;

    // Validate required fields
    if (!requestBody.teamStats || !requestBody.schedule) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          message: 'Request must include teamStats and schedule',
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Check cache first (based on team ID and current wins/losses)
    const cacheKey = `monte-carlo:${requestBody.teamStats.teamId}:${requestBody.teamStats.wins}-${requestBody.teamStats.losses}`;

    const cached = await context.env.KV.get(cacheKey, 'json');
    if (cached) {
      return new Response(
        JSON.stringify({
          ...cached,
          cacheStatus: 'hit',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, s-maxage=1800'
          }
        }
      );
    }

    // Run simulation
    const result: SimulationResult = monteCarloEngine.simulate(
      requestBody.teamStats,
      requestBody.schedule,
      requestBody.simulations || 10000
    );

    // Cache the result for 30 minutes
    await context.env.KV.put(
      cacheKey,
      JSON.stringify(result),
      { expirationTtl: 1800 }
    );

    return new Response(
      JSON.stringify({
        ...result,
        cacheStatus: 'miss',
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=1800'
        }
      }
    );
  } catch (error) {
    console.error('Monte Carlo simulation error:', error);

    return new Response(
      JSON.stringify({
        error: 'Simulation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
};
