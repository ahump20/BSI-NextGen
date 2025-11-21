/**
 * Auth Logout Endpoint
 * POST /api/auth/logout
 *
 * Destroys session and redirects to Auth0 logout
 */

import { deleteSession, validateSession } from '@/lib/auth/middleware';
import { createAuth0Client } from '@/lib/auth/auth0';

export interface Env {
  DB: D1Database;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  AUTH0_CALLBACK_URL: string;
  AUTH0_AUDIENCE: string;
}

export async function onRequestPost(context: any) {
  const env = context.env as Env;

  // Get session token from cookie
  const cookies = context.request.headers.get('Cookie') || '';
  const sessionMatch = cookies.match(/blaze_session=([^;]+)/);
  const sessionToken = sessionMatch ? sessionMatch[1] : null;

  // Delete session from database
  if (sessionToken) {
    try {
      await deleteSession(env.DB, sessionToken);
    } catch (error) {
      console.error('[Auth] Failed to delete session:', error);
    }
  }

  // Create Auth0 client
  const auth0 = createAuth0Client({
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
    redirectUri: env.AUTH0_CALLBACK_URL,
    audience: env.AUTH0_AUDIENCE,
  });

  // Get logout URL
  const logoutUrl = auth0.getLogoutUrl('https://blazesportsintel.com');

  // Clear session cookie and redirect to Auth0 logout
  return new Response(null, {
    status: 302,
    headers: {
      'Location': logoutUrl,
      'Set-Cookie': 'blaze_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}
