/**
 * Auth Callback Endpoint
 * GET /api/auth/callback
 *
 * Handles OAuth callback from Auth0
 * Exchanges authorization code for tokens and creates session
 *
 * Query Parameters:
 * - code: Authorization code from Auth0
 * - state: CSRF protection state token
 */

import { createAuth0Client } from '@/lib/auth/auth0';
import { createSession } from '@/lib/auth/middleware';

export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  AUTH0_DOMAIN: string;
  AUTH0_CLIENT_ID: string;
  AUTH0_CLIENT_SECRET: string;
  AUTH0_CALLBACK_URL: string;
  AUTH0_AUDIENCE: string;
}

export async function onRequestGet(context: any) {
  const env = context.env as Env;
  const url = new URL(context.request.url);

  // Get code and state from query params
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    return new Response(
      `<html><body><h1>Authentication Error</h1><p>${errorDescription || error}</p></body></html>`,
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return new Response(
      '<html><body><h1>Invalid Request</h1><p>Missing code or state</p></body></html>',
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  try {
    // Verify state token (CSRF protection)
    const stateData = await context.env.KV.get(`auth:state:${state}`, 'json');

    if (!stateData) {
      return new Response(
        '<html><body><h1>Invalid State</h1><p>State token expired or invalid</p></body></html>',
        {
          status: 400,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Delete state token (one-time use)
    await context.env.KV.delete(`auth:state:${state}`);

    // Create Auth0 client
    const auth0 = createAuth0Client({
      domain: env.AUTH0_DOMAIN,
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
      redirectUri: env.AUTH0_CALLBACK_URL,
      audience: env.AUTH0_AUDIENCE,
    });

    // Exchange code for tokens
    const tokens = await auth0.exchangeCodeForTokens(code);

    // Get user info
    const userInfo = await auth0.getUserInfo(tokens.access_token);

    // Upsert user in database
    await env.DB.prepare(
      `INSERT INTO users (
        id, email, display_name, avatar_url, auth_provider, auth_provider_id,
        role, created_at, updated_at, last_login_at
      ) VALUES (?, ?, ?, ?, 'auth0', ?, 'user', unixepoch(), unixepoch(), unixepoch())
      ON CONFLICT(id) DO UPDATE SET
        display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = unixepoch(),
        last_login_at = unixepoch()`
    ).bind(
      userInfo.sub,
      userInfo.email,
      userInfo.name || userInfo.nickname || userInfo.email,
      userInfo.picture || null,
      userInfo.sub
    ).run();

    // Create session
    const sessionToken = await createSession(
      env.DB,
      {
        id: userInfo.sub,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        role: 'user', // Default role, can be updated by admin
      },
      604800 // 7 days
    );

    // Get return URL
    const returnTo = (stateData as any).returnTo || '/';

    // Set session cookie and redirect
    return new Response(null, {
      status: 302,
      headers: {
        'Location': returnTo,
        'Set-Cookie': `blaze_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
      },
    });
  } catch (error: any) {
    console.error('[Auth] Callback error:', error);
    return new Response(
      `<html><body><h1>Authentication Error</h1><p>${error.message}</p></body></html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}
