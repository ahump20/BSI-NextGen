import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ApiResponse, Game, Sport, NCAAGame } from '@bsi/shared';

interface Env {
  FEED_CACHE: KVNamespace;
  FEED_DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  UPSTREAM_BASE?: string;
  NETLIFY_FALLBACK_URL?: string;
}

interface CachedFeed<T> {
  etag: string;
  timestamp: number;
  data: ApiResponse<T>['data'];
}

const TICK_TTL_SECONDS = 30;

const SUPPORTED_SPORTS: Sport[] = ['MLB', 'NFL', 'NBA', 'NCAA_FOOTBALL', 'COLLEGE_BASEBALL'];

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

app.get('/health', (c) =>
  c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ttl: TICK_TTL_SECONDS,
    supported: SUPPORTED_SPORTS,
  })
);

app.get('/feeds/:sport', async (c) => {
  const sportParam = c.req.param('sport').toUpperCase();
  const sport = SUPPORTED_SPORTS.find((s) => s === sportParam) as Sport | undefined;

  if (!sport) {
    return c.json({ error: 'Unsupported sport' }, 400);
  }

  const cacheKey = `feed:${sport}`;
  const ifNoneMatch = c.req.header('if-none-match');
  const cached = (await c.env.FEED_CACHE.get(cacheKey, { type: 'json' })) as CachedFeed<Game[] | NCAAGame[]> | null;
  const now = Date.now();

  if (cached && ifNoneMatch && cached.etag === ifNoneMatch && now - cached.timestamp < TICK_TTL_SECONDS * 1000) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: cached.etag,
        'Cache-Control': `public, max-age=${TICK_TTL_SECONDS}`,
      },
    });
  }

  try {
    const payload = await resolveFeed<Game[] | NCAAGame[]>(sport, c.env);
    const etag = generateEtag(payload);

    await persistSnapshot(c.env, cacheKey, etag, payload, sport);

    return c.json(payload, {
      status: 200,
      headers: {
        ETag: etag,
        'Cache-Control': `public, max-age=${TICK_TTL_SECONDS}, s-maxage=${TICK_TTL_SECONDS * 2}`,
      },
    });
  } catch (error) {
    console.error('[blaze-feeds] failed to resolve feed', error);

    if (cached) {
      return c.json(
        {
          data: cached.data,
          source: {
            provider: 'cache',
            timestamp: new Date(cached.timestamp).toISOString(),
            confidence: 0.4,
          },
          error: error instanceof Error ? error.message : 'Unable to resolve feed',
        },
        {
          status: 200,
          headers: {
            ETag: cached.etag,
            'Cache-Control': `public, max-age=${TICK_TTL_SECONDS}`,
          },
        }
      );
    }

    return c.json({
      error: error instanceof Error ? error.message : 'Unable to resolve feed',
    }, 502);
  }
});

async function resolveFeed<T>(sport: Sport, env: Env): Promise<ApiResponse<T>> {
  const upstreamUrl = `${env.UPSTREAM_BASE || ''}`.replace(/\/$/, '');
  const targetUrl = upstreamUrl
    ? `${upstreamUrl}/${sport.toLowerCase()}`
    : undefined;

  const fallbackUrl = env.NETLIFY_FALLBACK_URL
    ? `${env.NETLIFY_FALLBACK_URL.replace(/\/$/, '')}/feeds?sport=${sport.toLowerCase()}`
    : undefined;

  const sources = [targetUrl, fallbackUrl].filter(Boolean) as string[];

  for (const source of sources) {
    try {
      const response = await fetch(source, {
        headers: {
          'User-Agent': 'blaze-feeds-worker',
        },
      });

      if (!response.ok) {
        throw new Error(`Upstream responded with ${response.status}`);
      }

      const json = (await response.json()) as ApiResponse<T>;
      const normalized = normalizePayload<T>(sport, json.data);

      return {
        data: normalized,
        source: {
          provider: json.source?.provider || 'upstream',
          timestamp: new Date().toISOString(),
          confidence: 0.9,
        },
      } as ApiResponse<T>;
    } catch (error) {
      console.warn(`[blaze-feeds] source failed for ${sport}`, error);
      continue;
    }
  }

  const offline = normalizePayload<T>(sport, undefined);

  return {
    data: offline,
    source: {
      provider: 'offline-fallback',
      timestamp: new Date().toISOString(),
      confidence: 0.5,
    },
  } as ApiResponse<T>;
}

function normalizePayload<T>(sport: Sport, payload: unknown): T {
  if (payload && Array.isArray((payload as { games?: unknown[] }).games)) {
    return ((payload as { games: T }).games) as T;
  }

  if (Array.isArray(payload)) {
    return payload as T;
  }

  switch (sport) {
    case 'MLB':
      return [
        {
          id: 'mlb-fallback-1',
          sport: 'MLB',
          date: new Date().toISOString(),
          status: 'scheduled',
          homeTeam: {
            id: 'mlb-hou',
            name: 'Houston Astros',
            abbreviation: 'HOU',
            city: 'Houston',
          },
          awayTeam: {
            id: 'mlb-tex',
            name: 'Texas Rangers',
            abbreviation: 'TEX',
            city: 'Arlington',
          },
          homeScore: 0,
          awayScore: 0,
        },
      ] as T;
    case 'NFL':
      return [
        {
          id: 'nfl-fallback-1',
          sport: 'NFL',
          date: new Date().toISOString(),
          status: 'scheduled',
          homeTeam: {
            id: 'nfl-dal',
            name: 'Dallas Cowboys',
            abbreviation: 'DAL',
            city: 'Dallas',
          },
          awayTeam: {
            id: 'nfl-hou',
            name: 'Houston Texans',
            abbreviation: 'HOU',
            city: 'Houston',
          },
          homeScore: 0,
          awayScore: 0,
        },
      ] as T;
    case 'NBA':
      return [
        {
          id: 'nba-fallback-1',
          sport: 'NBA',
          date: new Date().toISOString(),
          status: 'live',
          homeTeam: {
            id: 'nba-dal',
            name: 'Dallas Mavericks',
            abbreviation: 'DAL',
            city: 'Dallas',
          },
          awayTeam: {
            id: 'nba-hou',
            name: 'Houston Rockets',
            abbreviation: 'HOU',
            city: 'Houston',
          },
          homeScore: 87,
          awayScore: 82,
          period: 'Q4 06:21',
        },
      ] as T;
    case 'NCAA_FOOTBALL':
      return [
        {
          id: 'ncaa-fb-fallback-1',
          sport: 'NCAA_FOOTBALL',
          date: new Date().toISOString(),
          status: 'scheduled',
          homeTeam: {
            id: 'texas',
            name: 'Texas Longhorns',
            abbreviation: 'TEX',
            city: 'Austin',
          },
          awayTeam: {
            id: 'oklahoma',
            name: 'Oklahoma Sooners',
            abbreviation: 'OU',
            city: 'Norman',
          },
          homeScore: 0,
          awayScore: 0,
          venue: 'Cotton Bowl',
        },
      ] as T;
    case 'COLLEGE_BASEBALL':
      return [
        {
          id: 'ncaa-baseball-fallback-1',
          date: new Date().toISOString(),
          name: 'Fallback Matchup',
          shortName: 'Fallback @ Home',
          status: {
            type: 'scheduled',
            detail: 'Scheduled',
            completed: false,
            inning: 0,
            inningHalf: 'top',
          },
          teams: {
            home: {
              id: 'home',
              name: 'Home College',
              abbreviation: 'HOME',
              logo: '',
              score: 0,
              record: '0-0',
              conference: 'Independent',
            },
            away: {
              id: 'away',
              name: 'Away College',
              abbreviation: 'AWAY',
              logo: '',
              score: 0,
              record: '0-0',
              conference: 'Independent',
            },
          },
          venue: {
            name: 'Fallback Park',
            city: 'Austin',
            state: 'TX',
          },
        },
      ] as T;
    default:
      return [] as T;
  }
}

async function persistSnapshot<T>(
  env: Env,
  cacheKey: string,
  etag: string,
  payload: ApiResponse<T>,
  sport: Sport
): Promise<void> {
  const timestamp = Date.now();
  await env.FEED_CACHE.put(
    cacheKey,
    JSON.stringify({ etag, timestamp, data: payload.data }),
    { expirationTtl: TICK_TTL_SECONDS * 3 }
  );

  await env.FEED_DB.prepare(`
    CREATE TABLE IF NOT EXISTS feed_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sport TEXT NOT NULL,
      etag TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `).run();

  await env.FEED_DB.prepare(
    `INSERT INTO feed_snapshots (sport, etag, payload) VALUES (?, ?, ?);`
  )
    .bind(sport, etag, JSON.stringify(payload))
    .run();

  await persistMedia(env, payload.data, etag);
}

async function persistMedia(env: Env, data: ApiResponse<Game[] | NCAAGame[]>['data'], etag: string) {
  const games = Array.isArray(data) ? data : [];

  for (const game of games) {
    const media = (game as Game & { media?: { url: string; type?: string }[] }).media || [];

    for (const asset of media) {
      try {
        const response = await fetch(asset.url);
        if (!response.ok) continue;
        const key = `${etag}/${crypto.randomUUID()}`;
        await env.MEDIA_BUCKET.put(key, await response.arrayBuffer(), {
          httpMetadata: {
            contentType: asset.type || 'application/octet-stream',
          },
        });
      } catch (error) {
        console.warn('[blaze-feeds] unable to persist media', error);
      }
    }
  }
}

function generateEtag(payload: ApiResponse<unknown>): string {
  const fingerprint = typeof payload === 'object' ? JSON.stringify(payload).length : 0;
  const hash = crypto.randomUUID();
  return `W/\"${hash}-${fingerprint}\"`;
}

export default app;
