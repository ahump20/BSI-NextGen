export type GameSummary = {
  id: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'final';
  score: {
    home: number;
    away: number;
  };
  pace: number;
  winProbability: number;
  lastUpdated: string;
};

export type TeamMetric = {
  id: string;
  name: string;
  record: string;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  streak: string;
  trend: number[];
};

export type NarrativeInsight = {
  id: string;
  headline: string;
  body: string;
  impact: 'high' | 'medium' | 'low';
};

export type PlayerSpotlight = {
  id: string;
  name: string;
  team: string;
  position: string;
  efficiency: number;
  usage: number;
  trueShooting: number;
};

export type DashboardPayload = {
  games: GameSummary[];
  teams: TeamMetric[];
  narratives: NarrativeInsight[];
  spotlights: PlayerSpotlight[];
};

const FALLBACK_ENDPOINT = 'https://bsi-worker-preview.pages.dev/api/v1';

export async function fetchDashboardData(): Promise<DashboardPayload> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? FALLBACK_ENDPOINT;
  try {
    const response = await fetch(`${baseUrl}/dashboard`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.status}`);
    }

    return (await response.json()) as DashboardPayload;
  } catch (error) {
    console.warn('[BlazeSportsIntel] Falling back to mock dashboard payload.', error);
    return getMockDashboard();
  }
}

export function getMockDashboard(): DashboardPayload {
  const now = new Date();
  return {
    games: [
      {
        id: 'bsi-001',
        league: 'WNBA',
        homeTeam: 'Atlanta Blaze',
        awayTeam: 'Chicago Charge',
        venue: 'Gateway Arena',
        startTime: new Date(now.getTime() + 5 * 60 * 1000).toISOString(),
        status: 'live',
        score: { home: 68, away: 65 },
        pace: 102.6,
        winProbability: 0.62,
        lastUpdated: now.toISOString()
      },
      {
        id: 'bsi-002',
        league: 'NBA',
        homeTeam: 'Phoenix Elevate',
        awayTeam: 'Seattle Reign',
        venue: 'Footprint Center',
        startTime: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
        status: 'scheduled',
        score: { home: 0, away: 0 },
        pace: 99.4,
        winProbability: 0.48,
        lastUpdated: now.toISOString()
      }
    ],
    teams: [
      {
        id: 'atl',
        name: 'Atlanta Blaze',
        record: '12-3',
        offensiveRating: 115.7,
        defensiveRating: 100.4,
        netRating: 15.3,
        streak: 'W5',
        trend: [8, 12, 14, 17, 21, 19, 24]
      },
      {
        id: 'chi',
        name: 'Chicago Charge',
        record: '9-6',
        offensiveRating: 109.2,
        defensiveRating: 104.8,
        netRating: 4.4,
        streak: 'L1',
        trend: [5, 7, 9, 12, 11, 13, 10]
      },
      {
        id: 'ny',
        name: 'New York Momentum',
        record: '10-5',
        offensiveRating: 112.1,
        defensiveRating: 101.3,
        netRating: 10.8,
        streak: 'W2',
        trend: [14, 16, 18, 19, 17, 20, 22]
      }
    ],
    narratives: [
      {
        id: 'n-1',
        headline: 'Blaze picking apart drop coverage',
        body: 'Atlanta is scoring 1.35 PPP when the Charge retreat into drop coverage thanks to rapid guard-to-wing skip passes.',
        impact: 'high'
      },
      {
        id: 'n-2',
        headline: 'Charge bench stabilizes pace',
        body: 'Chicago’s second unit slowed the game to 95 possessions per 48, cutting transition chances in half.',
        impact: 'medium'
      },
      {
        id: 'n-3',
        headline: 'Reign scouting focus',
        body: 'Seattle is keying on Elevate corner threes, overloading the strong side to bait skip turnovers.',
        impact: 'low'
      }
    ],
    spotlights: [
      {
        id: 'p-1',
        name: 'Imani Fields',
        team: 'Atlanta Blaze',
        position: 'G',
        efficiency: 28.6,
        usage: 25.3,
        trueShooting: 63.4
      },
      {
        id: 'p-2',
        name: 'Nova Chen',
        team: 'Chicago Charge',
        position: 'F',
        efficiency: 22.1,
        usage: 21.7,
        trueShooting: 59.8
      }
    ]
  };
}
