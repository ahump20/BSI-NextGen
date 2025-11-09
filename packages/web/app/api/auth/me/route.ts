import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@bsi/api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
        { error: 'Not authenticated' },
        { status: 401 }
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
        { error: 'Invalid session' },
        { status: 401 }
      );

      // Clear invalid session cookie
      response.cookies.delete('bsi_session');

      return response;
    }

    // Return user data
    return NextResponse.json({
      user,
      authenticated: true,
    });
  } catch (error) {
    console.error('[Auth Me] Error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
