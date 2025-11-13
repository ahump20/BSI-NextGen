import { NextRequest, NextResponse } from 'next/server';
import { createAuth0Client, createJWT } from '@bsi/api';
import type { AuthUser } from '@bsi/shared';
import { createLogger } from '@bsi/shared';

const logger = createLogger('Auth-Callback-API');

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/auth/callback
 * Handles OAuth 2.0 callback from Auth0
 *
 * Query params:
 * - code: Authorization code from Auth0
 * - state: CSRF protection token
 * - error: Error code (if authorization failed)
 * - error_description: Error description
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check for OAuth errors
    if (error) {
      logger.error('[Auth Callback] OAuth error:', error, errorDescription);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.json(
        { error: 'Missing code or state parameter' },
        { status: 400 }
      );
    }

    // Verify CSRF state token
    const storedState = request.cookies.get('auth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Get return URL
    const returnTo = request.cookies.get('auth_return_to')?.value || '/';

    // Create Auth0 client
    const auth0 = createAuth0Client({
      domain: process.env.AUTH0_DOMAIN!,
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      audience: process.env.AUTH0_AUDIENCE,
    });

    // Exchange authorization code for tokens
    const tokens = await auth0.exchangeCodeForTokens(code);

    // Get user information
    const userInfo = await auth0.getUserInfo(tokens.access_token);

    // Create user object
    const user: AuthUser = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      role: 'user', // Default role
      emailVerified: userInfo.email_verified,
    };

    // Create JWT session token
    const sessionToken = await createJWT(user, {
      secret: process.env.JWT_SECRET!,
      issuer: process.env.NEXT_PUBLIC_APP_URL!,
      audience: 'bsi-web',
      expiresIn: '7d',
    });

    // Create redirect response
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnTo}`
    );

    // Set session cookie
    response.cookies.set('bsi_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Clear temporary cookies
    response.cookies.delete('auth_state');
    response.cookies.delete('auth_return_to');

    return response;
  } catch (error) {
    logger.error('Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=authentication_failed`
    );
  }
}
