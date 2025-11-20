import { NextRequest, NextResponse } from 'next/server';
import type { ApiResponse, Game } from '@bsi/shared';
import { getSportsDataService, resolveSport } from '../utils';

export async function GET(request: NextRequest, { params }: { params: { sport: string } }) {
  const awaitedParams = await params;
  const sport = resolveSport(awaitedParams.sport);

  if (!sport) {
    return NextResponse.json(
      { error: `Unsupported sport: ${awaitedParams.sport}` },
      { status: 400 }
    );
  }

  let service;
  try {
    service = getSportsDataService();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize sports service';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const options: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (value) {
      options[key] = value;
    }
  }

  try {
    const result: ApiResponse<Game[]> = await service.getGames(sport, options);
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error fetching games';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
