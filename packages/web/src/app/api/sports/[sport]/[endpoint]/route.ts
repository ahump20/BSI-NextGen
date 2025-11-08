import { NextRequest, NextResponse } from 'next/server';
import { SportsDataService } from '@bsi/api';
import type { Sport } from '@bsi/shared';

const sportsService = new SportsDataService();

export async function GET(
  request: NextRequest,
  { params }: { params: { sport: string; endpoint: string } }
) {
  try {
    const { sport, endpoint } = params;
    const searchParams = request.nextUrl.searchParams;

    // Map URL sport to Sport type
    const sportMap: Record<string, Sport> = {
      'mlb': 'MLB',
      'nfl': 'NFL',
      'nba': 'NBA',
      'ncaa_football': 'NCAA_FOOTBALL',
      'college_baseball': 'COLLEGE_BASEBALL',
    };

    const sportType = sportMap[sport];

    if (!sportType) {
      return NextResponse.json(
        { error: `Unsupported sport: ${sport}` },
        { status: 400 }
      );
    }

    // Handle different endpoints
    switch (endpoint) {
      case 'games': {
        const date = searchParams.get('date') || undefined;
        const week = searchParams.get('week') ? parseInt(searchParams.get('week')!) : undefined;
        const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined;

        const result = await sportsService.getGames(sportType, { date, week, season });

        return NextResponse.json(result, {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          },
        });
      }

      case 'standings': {
        const divisionId = searchParams.get('divisionId') || undefined;
        const conference = searchParams.get('conference') || undefined;
        const season = searchParams.get('season') ? parseInt(searchParams.get('season')!) : undefined;

        const result = await sportsService.getStandings(sportType, {
          divisionId,
          conference,
          season,
        });

        return NextResponse.json(result, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        });
      }

      case 'teams': {
        const result = await sportsService.getTeams(sportType);

        return NextResponse.json(result, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unsupported endpoint: ${endpoint}` },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('API Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
