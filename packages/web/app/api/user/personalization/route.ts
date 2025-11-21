import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@bsi/api';
import type { AuthUser } from '@bsi/shared';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface AlertPreference {
  id: string;
  label: string;
  channel: 'email' | 'sms' | 'in-app';
}

interface PersonalizationPayload {
  favorites: string[];
  watchlist: string[];
  alerts: AlertPreference[];
}

function decodeState(raw?: string): PersonalizationPayload | null {
  if (!raw) return null;
  try {
    const json = atob(raw);
    return JSON.parse(json) as PersonalizationPayload;
  } catch (error) {
    console.warn('[Personalization] Failed to decode state', error);
    return null;
  }
}

function encodeState(state: PersonalizationPayload): string {
  return btoa(JSON.stringify(state));
}

function defaultState(user: AuthUser): PersonalizationPayload {
  return {
    favorites: [user.email, 'College Baseball Command Center'],
    watchlist: ['Unified Command Center', 'Pitch Tunnel Simulator'],
    alerts: [
      {
        id: 'session-expiry',
        label: 'Session health + login alerts',
        channel: 'in-app',
      },
    ],
  };
}

async function getUser(request: NextRequest): Promise<AuthUser | null> {
  const sessionToken = request.cookies.get('bsi_session')?.value;
  if (!sessionToken) return null;

  return verifyJWT(sessionToken, {
    secret: process.env.JWT_SECRET!,
    issuer: process.env.NEXT_PUBLIC_APP_URL!,
    audience: 'bsi-web',
  });
}

function guardFeatureAccess(user: AuthUser | null) {
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'SESSION_EXPIRED' },
      { status: 401 }
    );
  }

  if (!user.featureFlags?.includes('personalization-dashboard')) {
    return NextResponse.json(
      { error: 'Personalization not enabled for this account' },
      { status: 403 }
    );
  }

  return null;
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  const blocked = guardFeatureAccess(user);
  if (blocked) return blocked;

  const stored = decodeState(request.cookies.get('bsi_personalization')?.value);
  const personalization = stored || defaultState(user!);

  return NextResponse.json({ personalization, user });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  const blocked = guardFeatureAccess(user);
  if (blocked) return blocked;

  try {
    const body = (await request.json()) as Partial<PersonalizationPayload>;
    const sanitized: PersonalizationPayload = {
      favorites: Array.isArray(body.favorites)
        ? body.favorites.map((entry) => String(entry)).slice(0, 20)
        : [],
      watchlist: Array.isArray(body.watchlist)
        ? body.watchlist.map((entry) => String(entry)).slice(0, 20)
        : [],
      alerts: Array.isArray(body.alerts)
        ? body.alerts
            .map((alert) => ({
              id: String(alert.id ?? crypto.randomUUID()),
              label: String(alert.label ?? 'Alert'),
              channel:
                alert.channel === 'email'
                  ? 'email'
                  : alert.channel === 'sms'
                  ? 'sms'
                  : 'in-app',
            }))
            .slice(0, 20)
        : [],
    };

    const response = NextResponse.json({
      personalization: sanitized,
      user,
      saved: true,
    });

    response.cookies.set('bsi_personalization', encodeState(sanitized), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Personalization] Failed to persist preferences', error);
    return NextResponse.json(
      { error: 'Could not save personalization preferences' },
      { status: 500 }
    );
  }
}
