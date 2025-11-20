import { NextRequest, NextResponse } from 'next/server';
import { createSportsCache } from '@bsi/api/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sports/youth-sports/perfect-game/tournaments
 * Perfect Game Baseball Tournament Data
 *
 * Query params:
 * - state: State abbreviation (default: TX)
 * - ageGroup: 18U, 17U, 16U, 15U, 14U, 13U, 12U (default: 14U)
 * - status: upcoming, live, completed (default: upcoming)
 *
 * Data source: Perfect Game (demo data - integration pending)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || 'TX';
    const ageGroup = searchParams.get('ageGroup') || '14U';
    const status = searchParams.get('status') || 'upcoming';

    // Create cache instance (Node.js runtime uses in-memory cache)
    const cache = createSportsCache();

    // Wrap data generation with caching (longer TTL for tournament schedules)
    const demoTournaments = await cache.wrap(
      async () => generateDemoTournaments(state, ageGroup, status),
      {
        sport: 'youth_sports',
        endpoint: 'perfect_game_tournaments',
        params: {
          state: state || 'TX',
          ageGroup: ageGroup || '14U',
          status: status || 'upcoming',
        },
        ttl: 600, // 10 minutes
      }
    );

    const response = {
      success: true,
      data: demoTournaments,
      meta: {
        state,
        ageGroup,
        status,
        dataSource: 'Demo Data (Perfect Game API integration pending)',
        disclaimer:
          'Demo data for development. Real Perfect Game integration requires API access.',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=1200', // 10-20 min cache
      },
    });
  } catch (error) {
    console.error('[Perfect Game Tournaments API] Error:', error);
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

function generateDemoTournaments(state: string, ageGroup: string, status: string) {
  const tournaments = [];

  const venues = [
    { name: 'Nolan Ryan Center', location: 'Round Rock, TX' },
    { name: 'Dell Diamond', location: 'Round Rock, TX' },
    { name: 'Grand Park', location: 'Westfield, IN' },
    { name: 'LakePoint Sports Complex', location: 'Cartersville, GA' },
    { name: 'Big League Dreams', location: 'Deer Park, TX' },
  ];

  const tournamentTypes = [
    'WWBA (World Wood Bat Association)',
    'BCS Finals',
    'Super25',
    'National Showcase',
    'Regional Championship',
  ];

  const dates = getUpcomingDates();

  for (let i = 0; i < 6; i++) {
    const venue = venues[i % venues.length];
    const tournamentType = tournamentTypes[i % tournamentTypes.length];
    const date = dates[i];

    tournaments.push({
      id: `pg-${ageGroup}-${i + 1}`,
      name: `${tournamentType} ${ageGroup}`,
      ageGroup,
      type: tournamentType.split(' ')[0],
      status: i === 0 ? 'live' : i < 3 ? 'upcoming' : 'completed',
      dates: {
        start: date.start.toISOString(),
        end: date.end.toISOString(),
      },
      venue: venue.name,
      location: venue.location,
      teams: {
        total: Math.floor(Math.random() * 40) + 60,
        registered: Math.floor(Math.random() * 20) + 80,
      },
      divisions: [`${ageGroup} Premier`, `${ageGroup} Select`, `${ageGroup} Open`],
      format: 'Pool Play → Bracket',
      registration: {
        deadline: date.registrationDeadline.toISOString(),
        fee: `$${Math.floor(Math.random() * 500) + 1000}`,
        status: i < 3 ? 'Open' : 'Closed',
      },
      topProspects: generateTopProspects(ageGroup),
      champions:
        i >= 3
          ? {
              premier: generateTeamName(),
              select: generateTeamName(),
              open: generateTeamName(),
            }
          : null,
      links: {
        schedule: `https://www.perfectgame.org/Schedule/Default.aspx?TournamentID=PG${i + 1}`,
        standings: `https://www.perfectgame.org/Standings/Default.aspx?TournamentID=PG${i + 1}`,
        stats: `https://www.perfectgame.org/Stats/Default.aspx?TournamentID=PG${i + 1}`,
      },
    });
  }

  return {
    state,
    ageGroup,
    tournaments: tournaments.sort(
      (a, b) => new Date(a.dates.start).getTime() - new Date(b.dates.start).getTime()
    ),
  };
}

function getUpcomingDates() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 6; i++) {
    const start = new Date(today);
    start.setDate(today.getDate() + i * 14); // Every 2 weeks
    start.setHours(8, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 3); // 3-day tournaments
    end.setHours(18, 0, 0, 0);

    const registrationDeadline = new Date(start);
    registrationDeadline.setDate(start.getDate() - 14); // 2 weeks before

    dates.push({ start, end, registrationDeadline });
  }

  return dates;
}

function generateTopProspects(ageGroup: string) {
  const positions = ['RHP', 'LHP', 'C', 'SS', 'OF', '3B', '1B', '2B'];
  const prospects = [];

  for (let i = 0; i < 5; i++) {
    const position = positions[i % positions.length];
    const gradYear = parseInt(ageGroup) + 2025;

    prospects.push({
      name: getRandomName(),
      position,
      bats: Math.random() > 0.5 ? 'R' : 'L',
      throws: Math.random() > 0.5 ? 'R' : 'L',
      height: `${Math.floor(Math.random() * 8) + 68}"`, // 5'8" - 6'4"
      weight: `${Math.floor(Math.random() * 50) + 160} lbs`,
      gradYear,
      commitment: Math.random() > 0.5 ? getRandomCollege() : 'Uncommitted',
      stats: position.includes('HP')
        ? {
            velocity: `${Math.floor(Math.random() * 10) + 85} mph`,
            era: (Math.random() * 2 + 1).toFixed(2),
            strikeouts: Math.floor(Math.random() * 30) + 40,
          }
        : {
            avg: (Math.random() * 0.2 + 0.3).toFixed(3),
            hr: Math.floor(Math.random() * 10) + 5,
            rbi: Math.floor(Math.random() * 20) + 25,
          },
      pgRanking: i < 3 ? Math.floor(Math.random() * 100) + 1 : null,
    });
  }

  return prospects;
}

function getRandomName(): string {
  const firstNames = ['Jake', 'Tyler', 'Mason', 'Caden', 'Austin', 'Dylan', 'Hunter', 'Chase'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function getRandomCollege(): string {
  const colleges = [
    'Texas',
    'Texas A&M',
    'LSU',
    'Ole Miss',
    'Arkansas',
    'Vanderbilt',
    'Mississippi State',
    'TCU',
    'Texas Tech',
    'Baylor',
  ];
  return colleges[Math.floor(Math.random() * colleges.length)];
}

function generateTeamName(): string {
  const locations = ['Dallas', 'Houston', 'Austin', 'San Antonio', 'Atlanta', 'Memphis'];
  const names = ['Mustangs', 'Heat', 'Bombers', 'Bandits', 'Thunder', 'Warriors'];
  return `${locations[Math.floor(Math.random() * locations.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
}
