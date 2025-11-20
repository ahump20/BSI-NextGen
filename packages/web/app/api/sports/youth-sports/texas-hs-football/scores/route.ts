import { NextRequest, NextResponse } from 'next/server';
import { createSportsCache } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sports/youth-sports/texas-hs-football/scores
 * Texas High School Football Live Scores and Recent Games
 *
 * Query params:
 * - week: Week number or 'current' (default: 'current')
 * - classification: 6A, 5A, 4A, 3A, 2A, 1A (default: 6A)
 * - district: District number (optional)
 *
 * Data source: MaxPreps (demo data - integration pending)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const week = searchParams.get('week') || 'current';
    const classification = searchParams.get('classification') || '6A';
    const district = searchParams.get('district');

    // Create cache instance (Node.js runtime uses in-memory cache)
    const cache = createSportsCache();

    // Wrap data generation with caching (shorter TTL for live scores)
    const demoScores = await cache.wrap(
      async () => generateDemoScores(week, classification, district),
      {
        sport: 'youth_sports',
        endpoint: 'txhsfb_scores',
        params: {
          week: week || 'current',
          classification: classification || '6A',
          ...(district && { district }),
        },
        ttl: 60, // 1 minute for live scores
      }
    );

    const response = {
      success: true,
      data: demoScores,
      meta: {
        week,
        classification,
        district,
        dataSource: 'Demo Data (MaxPreps integration pending)',
        disclaimer:
          'Demo data for development. Real MaxPreps integration requires API access.',
        lastUpdated: new Date().toISOString(),
        timezone: 'America/Chicago',
      },
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=120', // 1-2 min cache for live scores
      },
    });
  } catch (error) {
    console.error('[Texas HS Football Scores API] Error:', error);
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

function generateDemoScores(
  week: string,
  classification: string | null,
  district: string | null
) {
  const games = [];
  const gameCount = 8;

  const teams = [
    { name: 'Brandeis Broncos', mascot: 'Broncos' },
    { name: 'Brennan Bears', mascot: 'Bears' },
    { name: 'Clark Cougars', mascot: 'Cougars' },
    { name: 'Harlan Hawks', mascot: 'Hawks' },
    { name: 'Holmes Huskies', mascot: 'Huskies' },
    { name: 'Marshall Rams', mascot: 'Rams' },
    { name: "O'Connor Panthers", mascot: 'Panthers' },
    { name: 'Taft Raiders', mascot: 'Raiders' },
    { name: 'Reagan Rattlers', mascot: 'Rattlers' },
    { name: 'Madison Mavericks', mascot: 'Mavericks' },
    { name: 'Johnson Jaguars', mascot: 'Jaguars' },
    { name: 'Churchill Chargers', mascot: 'Chargers' },
  ];

  // Generate Friday night games
  const lastFriday = new Date();
  lastFriday.setDate(lastFriday.getDate() - ((lastFriday.getDay() + 2) % 7));
  lastFriday.setHours(19, 30, 0, 0); // 7:30 PM

  for (let i = 0; i < gameCount; i++) {
    // Fixed: Use modulo to wrap around teams array
    const homeTeam = teams[(i * 2) % teams.length];
    const awayTeam = teams[(i * 2 + 1) % teams.length];

    const homeScore = Math.floor(Math.random() * 35) + 14;
    const awayScore = Math.floor(Math.random() * 28) + 7;

    games.push({
      id: `txhsfb-${week}-${i + 1}`,
      status: 'final',
      date: lastFriday.toISOString(),
      time: '7:30 PM',
      venue: `${homeTeam.name.split(' ')[0]} Stadium`,
      homeTeam: {
        name: homeTeam.name,
        mascot: homeTeam.mascot,
        score: homeScore,
        record: generateRecord(),
      },
      awayTeam: {
        name: awayTeam.name,
        mascot: awayTeam.mascot,
        score: awayScore,
        record: generateRecord(),
      },
      quarter: 'Final',
      broadcast: i < 3 ? 'Texan Live' : null,
      highlights:
        i < 2
          ? {
              available: true,
              url: `https://maxpreps.com/highlights/game-${i + 1}`,
            }
          : null,
      stats: {
        attendance: Math.floor(Math.random() * 3000) + 1000,
        weather: generateWeather(),
      },
    });
  }

  return {
    week: week === 'current' ? 11 : parseInt(week),
    season: 2025,
    classification,
    district,
    games: games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}

function generateRecord(): string {
  const wins = Math.floor(Math.random() * 6) + 4;
  const losses = 10 - wins;
  return `${wins}-${losses}`;
}

function generateWeather() {
  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
  const temp = Math.floor(Math.random() * 20) + 65; // 65-85°F
  return {
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    temperature: `${temp}°F`,
    humidity: `${Math.floor(Math.random() * 30) + 40}%`,
  };
}
