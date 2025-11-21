import { NextRequest, NextResponse } from 'next/server';
import { createJWT, verifyJWT } from '@bsi/api';
import type { AuthUser } from '@bsi/shared';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function unauthorizedResponse() {
  const response = NextResponse.json(
    { error: 'Session expired', code: 'SESSION_EXPIRED' },
    { status: 401 }
  );
  response.cookies.delete('bsi_session');
  return response;
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('bsi_session')?.value;

    if (!sessionToken) {
      return unauthorizedResponse();
    }

    const user = await verifyJWT(sessionToken, {
      secret: process.env.JWT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_APP_URL!,
      audience: 'bsi-web',
    });

    if (!user) {
      return unauthorizedResponse();
    }

    const refreshedUser: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      picture: user.picture,
      emailVerified: user.emailVerified,
      entitlements: user.entitlements,
      featureFlags: user.featureFlags,
      sessionExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    const refreshedToken = await createJWT(refreshedUser, {
      secret: process.env.JWT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_APP_URL!,
      audience: 'bsi-web',
      expiresIn: '7d',
    });

    const response = NextResponse.json(
      { refreshed: true, user: refreshedUser },
      {
        headers: {
          'x-session-expires-at': refreshedUser.sessionExpiresAt?.toString() || '',
        },
      }
    );

    response.cookies.set('bsi_session', refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Auth Refresh] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh session', code: 'REFRESH_FAILED' },
      { status: 500 }
    );
  }
}
