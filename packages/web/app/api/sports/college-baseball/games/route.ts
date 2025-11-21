import { NextRequest, NextResponse } from 'next/server';
import type { NCAAGame } from '@bsi/shared';
import { createEdgeClient } from '@bsi/edge-client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const edgeClient = createEdgeClient({
  baseUrl: process.env.BLAZE_EDGE_FEEDS_URL || process.env.FEEDS_WORKER_URL,
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || undefined;
  const etag = request.headers.get('if-none-match') || undefined;

  try {
    const feed = await edgeClient.fetchGames<NCAAGame[]>('COLLEGE_BASEBALL', {
      date,
      etag,
    });

    if (feed.fromCache && etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          'Cache-Control': 'public, max-age=30',
        },
      });
    }

    const games = feed.data || [];
    const hasLiveGames = games.some((g) => g.status.type === 'live');
    const cacheTTL = hasLiveGames ? 30 : 300;

    return NextResponse.json(
      {
        games,
        meta: {
          dataSource: feed.source.provider,
          lastUpdated: feed.source.timestamp,
          timezone: 'America/Chicago',
          count: games.length,
        },
      },
      {
        headers: {
          'Cache-Control': `public, max-age=${cacheTTL}, s-maxage=${cacheTTL * 2}`,
          ...(feed.etag ? { ETag: feed.etag } : {}),
        },
      }
    );
  } catch (error) {
    console.error('[NCAA Games API] Edge feed error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch NCAA games from edge',
        games: [],
      },
      { status: 502 }
    );
  }
}
