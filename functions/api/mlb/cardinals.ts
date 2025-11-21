/**
 * Cardinals Data API Endpoint
 *
 * Cloudflare Function providing St. Louis Cardinals team data
 * Uses MLB Stats API adapter with caching
 *
 * Endpoints:
 * - GET /api/mlb/cardinals - Team info, roster, standings
 * - GET /api/mlb/cardinals?type=roster - Active roster only
 * - GET /api/mlb/cardinals?type=standings - Standings only
 * - GET /api/mlb/cardinals?type=stats - Team stats summary
 *
 * @author Austin Humphrey - Blaze Intelligence
 */

import { MlbStatsAdapter, CARDINALS_TEAM_ID, StandingsRecord } from '../../../lib/api/mlb-stats-adapter';
import type { TeamInfo, RosterEntry } from '../../../lib/api/mlb-stats-adapter';

interface Env {
  KV: KVNamespace;
}

interface CardinalsDataResponse {
  team: TeamInfo;
  roster: RosterEntry[];
  standings: StandingsRecord | null;
  season: number;
  dataSource: string;
  lastUpdated: string;
  cacheStatus: 'hit' | 'miss';
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type') || 'full';
  const season = parseInt(url.searchParams.get('season') || new Date().getFullYear().toString(), 10);

  try {
    const adapter = new MlbStatsAdapter(context.env.KV);

    // Check what data to fetch based on type parameter
    const fetchTeam = type === 'full' || type === 'team';
    const fetchRoster = type === 'full' || type === 'roster';
    const fetchStandings = type === 'full' || type === 'standings';

    // Parallel fetch all required data
    const [teamInfo, roster, standingsData] = await Promise.allSettled([
      fetchTeam ? adapter.fetchTeamInfo(CARDINALS_TEAM_ID) : Promise.resolve(null),
      fetchRoster ? adapter.fetchActiveRoster(CARDINALS_TEAM_ID, season) : Promise.resolve([]),
      fetchStandings ? adapter.fetchStandingsData(season) : Promise.resolve([])
    ]);

    // Extract successful results
    const team = teamInfo.status === 'fulfilled' ? teamInfo.value : null;
    const rosterEntries = roster.status === 'fulfilled' ? roster.value : [];
    const allStandings = standingsData.status === 'fulfilled' ? standingsData.value : [];

    // Find Cardinals in standings
    const cardinalsStanding = allStandings.find(
      (record: StandingsRecord) => record.team.id === CARDINALS_TEAM_ID
    ) || null;

    // Build response based on type
    let responseData: Partial<CardinalsDataResponse> = {
      season,
      dataSource: 'MLB Stats API',
      lastUpdated: new Date().toISOString(),
      cacheStatus: 'miss' // TODO: Implement proper cache hit tracking
    };

    if (type === 'roster') {
      responseData = {
        ...responseData,
        roster: rosterEntries || []
      };
    } else if (type === 'standings') {
      responseData = {
        ...responseData,
        standings: cardinalsStanding
      };
    } else if (type === 'team') {
      responseData = {
        ...responseData,
        team: team!
      };
    } else {
      // Full data
      responseData = {
        team: team!,
        roster: rosterEntries || [],
        standings: cardinalsStanding,
        season,
        dataSource: 'MLB Stats API',
        lastUpdated: new Date().toISOString(),
        cacheStatus: 'miss'
      };
    }

    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=1800' // 5 min client, 30 min edge
      }
    });
  } catch (error) {
    console.error('Cardinals API error:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch Cardinals data',
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
