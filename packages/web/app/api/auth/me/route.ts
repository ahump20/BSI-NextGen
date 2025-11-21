import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/me
 * Returns the currently authenticated user
 *
 * Requires: Valid session cookie
 * Returns: AuthUser object or 401 if not authenticated
 */
export async function GET(request: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = request.cookies.get('bsi_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated', code: 'NO_SESSION' },
        { status: 401, headers: { 'x-session-expired': '1' } }
      );
    }

    // Verify JWT token
    const user = await verifyJWT(sessionToken, {
      secret: process.env.JWT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_APP_URL!,
      audience: 'bsi-web',
    });

    if (!user) {
      // Invalid or expired token
      const response = NextResponse.json(
        { error: 'Invalid session', code: 'SESSION_EXPIRED' },
        { status: 401, headers: { 'x-session-expired': '1' } }
      );

      // Clear invalid session cookie
      response.cookies.delete('bsi_session');

      return response;
    }

    // Return user data
    return NextResponse.json(
      {
        user,
        authenticated: true,
      },
      {
        headers: {
          ...(user.sessionExpiresAt
            ? { 'x-session-expires-at': user.sessionExpiresAt.toString() }
            : {}),
        },
      }
    );
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
