import { NextRequest, NextResponse } from 'next/server';
import { createSportsCache } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/youth-sports/texas-hs-football/standings
 * Texas High School Football District Standings
 *
 * Query params:
 * - classification: 6A, 5A, 4A, 3A, 2A, 1A (default: 6A)
 * - district: District number (optional)
 * - region: Region number (optional)
 *
 * Data source: MaxPreps (demo data - integration pending)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const classification = searchParams.get('classification') || '6A';
    const district = searchParams.get('district');
    const region = searchParams.get('region');

    // Create cache instance (Node.js runtime uses in-memory cache)
    const cache = createSportsCache();

    // Wrap data generation with caching
    const demoStandings = await cache.wrap(
      async () => generateDemoStandings(classification, district, region),
      {
        sport: 'youth_sports',
        endpoint: 'txhsfb_standings',
        params: {
          classification: classification || '6A',
          ...(district && { district }),
          ...(region && { region }),
        },
        ttl: 300, // 5 minutes
      }
    );

    const response = {
      success: true,
      data: demoStandings,
      meta: {
        classification,
        district,
        region,
        dataSource: 'Demo Data (MaxPreps integration pending)',
        disclaimer:
          'Demo data for development. Real MaxPreps integration requires API access.',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 5-10 min cache
      },
    });
  } catch (error) {
    console.error('[Texas HS Football Standings API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

function generateDemoStandings(
  classification: string | null,
  district: string | null,
  region: string | null
) {
  // Texas 6A District 26 (San Antonio area) as example
  const teams = [
    { name: 'Brandeis Broncos', school: 'Brandeis HS', city: 'San Antonio' },
    { name: 'Brennan Bears', school: 'Brennan HS', city: 'San Antonio' },
    { name: 'Clark Cougars', school: 'Clark HS', city: 'San Antonio' },
    { name: 'Harlan Hawks', school: 'Harlan HS', city: 'San Antonio' },
    { name: 'Holmes Huskies', school: 'Holmes HS', city: 'San Antonio' },
    { name: 'Marshall Rams', school: 'Marshall HS', city: 'San Antonio' },
    { name: "O'Connor Panthers", school: "O'Connor HS", city: 'San Antonio' },
    { name: 'Taft Raiders', school: 'Taft HS', city: 'San Antonio' },
  ];

  return {
    classification: classification || '6A',
    district: district || '26',
    region: region || 'IV',
    teams: teams.map((team, index) => ({
      rank: index + 1,
      team: team.name,
      school: team.school,
      city: team.city,
      record: {
        overall: generateRecord(),
        district: generateDistrictRecord(),
      },
      stats: {
        pointsFor: Math.floor(Math.random() * 200) + 150,
        pointsAgainst: Math.floor(Math.random() * 150) + 50,
        streak: generateStreak(),
      },
      nextGame: generateNextGame(team.name),
      playoffStatus: index < 4 ? 'Playoff Qualifier' : 'Eliminated',
    })),
    playoffs: {
      qualifiers: 4,
      format: 'Top 4 teams from each district advance to Division I playoffs',
    },
  };
}

function generateRecord(): string {
  const wins = Math.floor(Math.random() * 6) + 4;
  const losses = 10 - wins;
  return `${wins}-${losses}`;
}

function generateDistrictRecord(): string {
  const wins = Math.floor(Math.random() * 4) + 2;
  const losses = 6 - wins;
  return `${wins}-${losses}`;
}

function generateStreak(): string {
  const type = Math.random() > 0.5 ? 'W' : 'L';
  const count = Math.floor(Math.random() * 3) + 1;
  return `${type}${count}`;
}

function generateNextGame(teamName: string) {
  const opponents = [
    'Reagan Rattlers',
    'Madison Mavericks',
    'Johnson Jaguars',
    'Churchill Chargers',
  ];
  const opponent = opponents[Math.floor(Math.random() * opponents.length)];

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7));

  return {
    opponent,
    date: nextFriday.toISOString(),
    time: '7:30 PM',
    location: 'Home',
    venue: `${teamName.split(' ')[0]} Stadium`,
  };
}
