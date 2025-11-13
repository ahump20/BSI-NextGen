// packages/web/app/api/edge/ncaa/fusion/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const REAL_API_BASE_URL = process.env.REAL_API_BASE_URL;
const NCAA_API_BASE_URL = process.env.NCAA_API_BASE_URL ?? 'https://ncaa-api.henrygd.me';

type FusionSuccess = {
  success: true;
  sport: string;
  team: {
    id: string;
    uid: string;
    displayName: string;
    abbreviation: string;
    location: string;
    name: string;
    logos: { href: string }[];
  };
  standings: {
    team: string;
    scope: string;
    summary: string | null;
    wins: number;
    losses: number;
    ties: number;
    pct: string | null;
    gamesPlayed: number;
  }[];
  analytics: {
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
  dataSource: string;
  timestamp: string;
  cached?: boolean;
  // Fusion enrichments:
  scoreboard?: any;
  upcomingGame?: any | null;
};

type FusionError = {
  success: false;
  error: string;
};

type FusionResponse = FusionSuccess | FusionError;

function badRequest(message: string) {
  return NextResponse.json<FusionError>(
    { success: false, error: message },
    { status: 400 }
  );
}

export async function GET(req: NextRequest) {
  if (!REAL_API_BASE_URL) {
    return NextResponse.json<FusionError>(
      { success: false, error: 'REAL_API_BASE_URL is not configured' },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const sport = (url.searchParams.get('sport') ?? 'basketball').toLowerCase();
  const teamId = url.searchParams.get('teamId') ?? undefined;

  const allowedSports = ['baseball', 'football', 'basketball'];

  if (!allowedSports.includes(sport)) {
    return badRequest(
      `Unsupported sport "${sport}". Use one of: ${allowedSports.join(', ')}`
    );
  }

  try {
    // 1) NCAA analytics from real API
    const analyticsUrl = new URL(
      `${REAL_API_BASE_URL.replace(/\/$/, '')}/api/ncaa/${sport}${
        teamId ? `/${teamId}` : ''
      }`
    );

    // 2) Scoreboard from ncaa-api (ncaa.com proxy)
    // You can make these date/week parameters configurable via query params later.
    const year = url.searchParams.get('year') ?? '2024';
    const weekOrDay = url.searchParams.get('week') ?? '1';

    const scoreboardPath =
      sport === 'football'
        ? `/scoreboard/football/fbs/${year}/${weekOrDay}/all-conf`
        : sport === 'basketball'
        ? `/scoreboard/basketball/mens-d1/${year}/${weekOrDay}/all-conf`
        : `/scoreboard/baseball/d1/${year}/${weekOrDay}/all-conf`;

    const scoreboardUrl = new URL(
      scoreboardPath,
      NCAA_API_BASE_URL.replace(/\/$/, '')
    );

    const [analyticsRes, scoreboardRes] = await Promise.all([
      fetch(analyticsUrl.toString(), {
        headers: { Accept: 'application/json' }
      }),
      fetch(scoreboardUrl.toString(), {
        headers: { Accept: 'application/json' }
      })
    ]);

    if (!analyticsRes.ok) {
      let detail = `NCAA analytics request failed (${analyticsRes.status})`;
      try {
        const body = await analyticsRes.json();
        if (typeof body?.error === 'string') {
          detail = body.error;
        }
      } catch {
        // ignore
      }
      return NextResponse.json<FusionError>(
        { success: false, error: detail },
        { status: 502 }
      );
    }

    const analyticsJson = (await analyticsRes.json()) as Omit<
      FusionSuccess,
      'success' | 'scoreboard' | 'upcomingGame'
    >;

    let scoreboardJson: any | null = null;
    if (scoreboardRes.ok) {
      scoreboardJson = await scoreboardRes.json();
    }

    // Try to find today's / next game for this team from the scoreboard feed
    const teamAbbr = analyticsJson.team?.abbreviation?.toLowerCase();
    const teamNameSeo =
      analyticsJson.team?.displayName?.toLowerCase().replace(/\s+/g, '-');

    let upcomingGame: any | null = null;

    if (scoreboardJson?.games && Array.isArray(scoreboardJson.games)) {
      for (const wrapper of scoreboardJson.games) {
        const game = wrapper.game ?? wrapper;

        const home = game.home ?? {};
        const away = game.away ?? {};

        const matchesTeam = (side: any) => {
          const names = side.names ?? {};
          const abbr = String(names.char6 ?? names.short ?? '').toLowerCase();
          const seo = String(names.seo ?? '').toLowerCase();

          return (
            (teamAbbr && abbr === teamAbbr) ||
            (teamNameSeo && seo === teamNameSeo)
          );
        };

        if (matchesTeam(home) || matchesTeam(away)) {
          upcomingGame = game;
          break;
        }
      }
    }

    const payload: FusionSuccess = {
      success: true,
      ...analyticsJson,
      scoreboard: scoreboardJson ?? undefined,
      upcomingGame
    };

    return NextResponse.json<FusionResponse>(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected fusion error';
    return NextResponse.json<FusionError>(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
