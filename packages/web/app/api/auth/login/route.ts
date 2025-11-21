import { NextRequest, NextResponse } from 'next/server';
import { createAuth0Client } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/login
 * Initiates OAuth 2.0 authorization code flow with Auth0
 *
 * Query params:
 * - returnTo: URL to return to after login (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get('returnTo') || '/';

    // Generate CSRF state token using Web Crypto API
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const state = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    // Create Auth0 client
    const auth0 = createAuth0Client({
      domain: process.env.AUTH0_DOMAIN!,
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      audience: process.env.AUTH0_AUDIENCE,
    });

    // Request enriched scopes so Auth0 returns roles/entitlements + refresh support
    const authUrl = auth0.getAuthorizationUrl(
      state,
      'openid profile email offline_access read:current_user'
    );

    // Create response with redirect
    const response = NextResponse.redirect(authUrl);

    // Store state and returnTo in cookies for verification in callback
    response.cookies.set('auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    response.cookies.set('auth_return_to', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Auth Login] Error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate login' },
      { status: 500 }
    );
  }
}
