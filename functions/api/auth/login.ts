/**
 * Auth Login Endpoint
 * GET /api/auth/login
 *
 * Redirects to Auth0 for OAuth authentication
 *
 * Query Parameters:
 * - returnTo: URL to redirect to after successful login (default: /)
 */

import { createAuth0Client } from '@/lib/auth/auth0';

export interface Env {
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  AUTH0_CALLBACK_URL: string;
  AUTH0_AUDIENCE: string;
}

export async function onRequestGet(context: any) {
  const env = context.env as Env;
  const url = new URL(context.request.url);

  // Get return URL from query params
  const returnTo = url.searchParams.get('returnTo') || '/';

  // Create Auth0 client
  const auth0 = createAuth0Client({
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
    redirectUri: env.AUTH0_CALLBACK_URL,
    audience: env.AUTH0_AUDIENCE,
  });

  // Generate state token for CSRF protection
  const state = crypto.randomUUID();

  // Store state and returnTo in temporary KV storage (expires in 10 minutes)
  try {
    await context.env.KV.put(
      `auth:state:${state}`,
      JSON.stringify({ returnTo }),
      { expirationTtl: 600 }
    );
  } catch (error) {
    console.error('[Auth] Failed to store state:', error);
  }

  // Get authorization URL
  const authUrl = auth0.getAuthorizationUrl(state);

  // Redirect to Auth0
  return Response.redirect(authUrl, 302);
}
