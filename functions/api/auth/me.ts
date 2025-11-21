/**
 * Auth Me Endpoint
 * GET /api/auth/me
 *
 * Returns current authenticated user information
 * Requires session cookie or Authorization header with Bearer token
 */

import { validateSession, getOptionalUser } from '@/lib/auth/middleware';
import { jsonResponse, errorResponse, handleOptions } from '../../stats/_utils';

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export async function onRequestOptions(context: any) {
  return handleOptions(context.request);
}

export async function onRequestGet(context: any) {
  const env = context.env as Env;
  const origin = context.request.headers.get('Origin');

  try {
    // Try session cookie first
    const cookies = context.request.headers.get('Cookie') || '';
    const sessionMatch = cookies.match(/blaze_session=([^;]+)/);
    const sessionToken = sessionMatch ? sessionMatch[1] : null;

    let user = null;

    if (sessionToken) {
      // Validate session token
      user = await validateSession(env.DB, sessionToken);
    } else {
      // Try JWT from Authorization header
      user = await getOptionalUser(context.request, env);
    }

    if (!user) {
      return errorResponse('Not authenticated', 401, origin);
    }

    // Return user info
    return jsonResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
        meta: {
          authenticated: true,
          timestamp: new Date().toISOString(),
          timezone: 'America/Chicago',
        },
      },
      { origin }
    );
  } catch (error: any) {
    console.error('[Auth] Me endpoint error:', error);
    return errorResponse(
      `Failed to get user: ${error.message || 'Unknown error'}`,
      500,
      origin
    );
  }
}
