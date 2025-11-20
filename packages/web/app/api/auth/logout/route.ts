import { NextRequest, NextResponse } from 'next/server';
import { createAuth0Client } from '@bsi/api';

// Configure for Cloudflare Edge Runtime
export const runtime = 'edge';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/logout
 * Logs out the user and clears session
 *
 * Query params:
 * - returnTo: URL to return to after logout (optional, defaults to home)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const returnTo = searchParams.get('returnTo') || '/';

    // Create Auth0 client
    const auth0 = createAuth0Client({
      domain: process.env.AUTH0_DOMAIN!,
      clientId: process.env.AUTH0_CLIENT_ID!,
      clientSecret: process.env.AUTH0_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
    });

    // Get Auth0 logout URL
    const logoutUrl = auth0.getLogoutUrl(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnTo}`
    );

    // Create redirect response
    const response = NextResponse.redirect(logoutUrl);

    // Clear session cookie
    response.cookies.delete('bsi_session');

    return response;
  } catch (error) {
    console.error('[Auth Logout] Error:', error);

    // Even if Auth0 logout fails, clear local session
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/`
    );
    response.cookies.delete('bsi_session');

    return response;
  }
}
