import { NextRequest, NextResponse } from 'next/server';
import { createSportsCache } from '@bsi/api/cache';

export const runtime = 'edge';

type TeamInfo = {
  id: string;
  uid: string;
  displayName: string;
  abbreviation: string;
  location: string;
  name: string;
  logos: { href: string }[];
};

type StandingsRow = {
  team: string;
  scope: string;
  summary: string | null;
  wins: number;
  losses: number;
  ties: number;
  pct: string | null;
  gamesPlayed: number;
};

type Analytics = {
  pythagorean: {
    expectedWins: number | null;
    winPercentage: string | null;
    inputs: {
      pointsFor: number | null;
      pointsAgainst: number | null;
      exponent: number;
    };
  } | null;
  efficiency: {
    averageFor: number | null;
    averageAgainst: number | null;
    differential: number | null;
  } | null;
  momentum: {
    streak: string | null;
    streakValue: number | null;
  } | null;
  dataSource: string;
};

type NCAAResponse = {
  sport: string;
  team: TeamInfo;
  standings: StandingsRow[];
  analytics: Analytics;
  dataSource: string;
  timestamp: string;
};

// Pythagorean exponents by sport
const PYTHAGOREAN_EXPONENTS = {
  football: 2.37,
  basketball: 10.25,
  baseball: 1.83
} as const;

function calculatePythagorean(
  pointsFor: number,
  pointsAgainst: number,
  gamesPlayed: number,
  sport: 'football' | 'basketball' | 'baseball'
) {
  if (pointsFor === 0 && pointsAgainst === 0) {
    return {
      expectedWins: null,
      winPercentage: null,
      inputs: {
        pointsFor: null,
        pointsAgainst: null,
        exponent: PYTHAGOREAN_EXPONENTS[sport]
      }
    };
  }

  const exponent = PYTHAGOREAN_EXPONENTS[sport];
  const pythagPercentage =
    Math.pow(pointsFor, exponent) /
    (Math.pow(pointsFor, exponent) + Math.pow(pointsAgainst, exponent));
  const expectedWins = pythagPercentage * gamesPlayed;

  return {
    expectedWins: Math.round(expectedWins * 10) / 10,
    winPercentage: pythagPercentage.toFixed(3),
    inputs: {
      pointsFor,
      pointsAgainst,
      exponent
    }
  };
}

function calculateEfficiency(
  pointsFor: number,
  pointsAgainst: number,
  gamesPlayed: number
) {
  const averageFor = gamesPlayed > 0 ? pointsFor / gamesPlayed : null;
  const averageAgainst = gamesPlayed > 0 ? pointsAgainst / gamesPlayed : null;
  const differential =
    averageFor !== null && averageAgainst !== null
      ? averageFor - averageAgainst
      : null;

  return {
    averageFor: averageFor ? Math.round(averageFor * 10) / 10 : null,
    averageAgainst: averageAgainst
      ? Math.round(averageAgainst * 10) / 10
      : null,
    differential: differential ? Math.round(differential * 10) / 10 : null
  };
}

function calculateMomentum(recentResults: string[]): {
  streak: string | null;
  streakValue: number | null;
} {
  if (!recentResults || recentResults.length === 0) {
    return { streak: null, streakValue: null };
  }

  const lastResult = recentResults[recentResults.length - 1];
  const isWin = lastResult === 'W';
  let streakCount = 0;

  for (let i = recentResults.length - 1; i >= 0; i--) {
    if (recentResults[i] === (isWin ? 'W' : 'L')) {
      streakCount++;
    } else {
      break;
    }
  }

  return {
    streak: `${isWin ? 'W' : 'L'}${streakCount}`,
    streakValue: streakCount * (isWin ? 1 : -1)
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sport: string; teamId: string } }
) {
  const { sport, teamId } = params;
  const allowedSports = ['football', 'basketball', 'baseball'];

  if (!allowedSports.includes(sport.toLowerCase())) {
    return NextResponse.json(
      {
        error: `Invalid sport "${sport}". Allowed: ${allowedSports.join(', ')}`
      },
      { status: 400 }
    );
  }

  try {
    // Create cache instance (uses KV in production, memory in dev)
    const cache = createSportsCache(
      typeof process !== 'undefined' ? (process.env.SPORTS_CACHE as any) : undefined
    );

    // Wrap data fetching with caching
    const response = await cache.wrap<NCAAResponse>(
      async () => {
        return await fetchNCAATeamData(sport, teamId);
      },
      {
        sport: `ncaa_${sport.toLowerCase()}`,
        endpoint: 'team',
        params: { teamId },
        ttl: 300, // 5 minutes
      }
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('[NCAA API] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch NCAA data'
      },
      { status: 500 }
    );
  }
}

// Extract data fetching logic into separate function
async function fetchNCAATeamData(
  sport: string,
  teamId: string
): Promise<NCAAResponse> {
  // ESPN API base URLs by sport
  const ESPN_BASE_URLS = {
    football:
      'https://site.api.espn.com/apis/site/v2/sports/football/college-football',
    basketball:
      'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball',
    baseball:
      'https://site.api.espn.com/apis/site/v2/sports/baseball/college-baseball'
  };

  const baseUrl =
    ESPN_BASE_URLS[sport.toLowerCase() as keyof typeof ESPN_BASE_URLS];

  // Fetch team data
  const teamUrl = `${baseUrl}/teams/${teamId}`;
  const teamRes = await fetch(teamUrl, {
    headers: {
      'User-Agent': 'BlazeSportsIntel/1.0',
      Accept: 'application/json'
    }
  });

  if (!teamRes.ok) {
    throw new Error(`Failed to fetch team data: ${teamRes.status}`);
  }

  const teamData = await teamRes.json();
  const team = teamData.team;

    // Extract team info
    const teamInfo: TeamInfo = {
      id: team.id,
      uid: team.uid,
      displayName: team.displayName,
      abbreviation: team.abbreviation,
      location: team.location,
      name: team.name,
      logos: team.logos || []
    };

    // Extract standings from record
    const record = team.record?.items?.[0];
    const stats = record?.stats || [];

    const wins =
      stats.find((s: any) => s.name === 'wins')?.value ||
      record?.summary?.split('-')[0] ||
      0;
    const losses =
      stats.find((s: any) => s.name === 'losses')?.value ||
      record?.summary?.split('-')[1] ||
      0;
    const ties =
      stats.find((s: any) => s.name === 'ties')?.value ||
      record?.summary?.split('-')[2] ||
      0;
    const gamesPlayed =
      stats.find((s: any) => s.name === 'gamesPlayed')?.value ||
      Number(wins) + Number(losses) + Number(ties);

    const winPct =
      gamesPlayed > 0
        ? (Number(wins) / gamesPlayed).toFixed(3)
        : null;

    // Build standings rows
    const standings: StandingsRow[] = [];

    // Overall record
    standings.push({
      team: team.displayName,
      scope: 'Overall',
      summary: record?.summary || `${wins}-${losses}${ties ? `-${ties}` : ''}`,
      wins: Number(wins),
      losses: Number(losses),
      ties: Number(ties),
      pct: winPct,
      gamesPlayed: Number(gamesPlayed)
    });

    // Conference record if available
    const confStats = stats.filter((s: any) =>
      s.name.toLowerCase().includes('conf')
    );
    if (confStats.length > 0) {
      const confWins =
        confStats.find((s: any) => s.name.includes('Win'))?.value || 0;
      const confLosses =
        confStats.find((s: any) => s.name.includes('Loss'))?.value || 0;
      const confGames = Number(confWins) + Number(confLosses);
      const confPct =
        confGames > 0 ? (Number(confWins) / confGames).toFixed(3) : null;

      standings.push({
        team: team.displayName,
        scope: 'Conference',
        summary: `${confWins}-${confLosses}`,
        wins: Number(confWins),
        losses: Number(confLosses),
        ties: 0,
        pct: confPct,
        gamesPlayed: confGames
      });
    }

    // Calculate analytics
    const pointsFor =
      stats.find((s: any) => s.name === 'pointsFor')?.value || 0;
    const pointsAgainst =
      stats.find((s: any) => s.name === 'pointsAgainst')?.value || 0;

    const pythagorean = calculatePythagorean(
      Number(pointsFor),
      Number(pointsAgainst),
      Number(gamesPlayed),
      sport.toLowerCase() as 'football' | 'basketball' | 'baseball'
    );

    const efficiency = calculateEfficiency(
      Number(pointsFor),
      Number(pointsAgainst),
      Number(gamesPlayed)
    );

    // Get recent results for momentum
    const recentResults: string[] = [];
    const streakStat = stats.find((s: any) => s.name === 'streak');
    const momentum = streakStat
      ? {
          streak: streakStat.displayValue,
          streakValue: streakStat.value
        }
      : calculateMomentum(recentResults);

    const analytics: Analytics = {
      pythagorean,
      efficiency,
      momentum,
      dataSource: 'ESPN'
    };

  const response: NCAAResponse = {
    sport,
    team: teamInfo,
    standings,
    analytics,
    dataSource: 'ESPN College Sports API',
    timestamp: new Date().toISOString()
  };

  return response;
}
