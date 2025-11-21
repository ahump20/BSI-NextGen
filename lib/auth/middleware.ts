/**
 * Authentication Middleware
 * Validates JWT tokens and protects API endpoints
 *
 * Uses Auth0 for OAuth authentication
 * Stores session tokens in D1 database
 */

import { jwtVerify, importSPKI } from 'jose';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'premium' | 'admin';
}

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

/**
 * Extract and verify JWT token from Authorization header
 */
export async function verifyToken(
  authorization: string | null,
  jwtSecret: string
): Promise<AuthUser | null> {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.substring(7); // Remove 'Bearer ' prefix

  try {
    // Import public key for verification
    const publicKey = await importSPKI(jwtSecret, 'RS256');

    // Verify JWT
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: 'https://blazesportsintel.com',
      audience: 'blazesportsintel-api',
    });

    // Extract user info from payload
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string | undefined,
      avatar: payload.picture as string | undefined,
      role: (payload.role as AuthUser['role']) || 'user',
    };
  } catch (error) {
    console.error('[Auth] Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: Request,
  env: any
): Promise<{ user: AuthUser } | Response> {
  const authorization = request.headers.get('Authorization');

  const user = await verifyToken(authorization, env.JWT_SECRET);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer',
        },
      }
    );
  }

  return { user };
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  request: Request,
  env: any,
  requiredRole: 'premium' | 'admin'
): Promise<{ user: AuthUser } | Response> {
  const authResult = await requireAuth(request, env);

  if (authResult instanceof Response) {
    return authResult;
  }

  const { user } = authResult;

  // Check role hierarchy: admin > premium > user
  const roleHierarchy = { user: 0, premium: 1, admin: 2 };
  const userRoleLevel = roleHierarchy[user.role];
  const requiredRoleLevel = roleHierarchy[requiredRole];

  if (userRoleLevel < requiredRoleLevel) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: `${requiredRole} role required`,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { user };
}

/**
 * Optionally get authenticated user (doesn't fail if not authenticated)
 */
export async function getOptionalUser(
  request: Request,
  env: any
): Promise<AuthUser | null> {
  const authorization = request.headers.get('Authorization');
  return verifyToken(authorization, env.JWT_SECRET);
}

/**
 * Create session token and store in database
 */
export async function createSession(
  db: D1Database,
  user: AuthUser,
  expiresIn: number = 604800 // 7 days in seconds
): Promise<string> {
  const sessionId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES (?, ?, ?, ?, unixepoch())`
    )
    .bind(sessionId, user.id, token, expiresAt)
    .run();

  return token;
}

/**
 * Validate session token from database
 */
export async function validateSession(
  db: D1Database,
  token: string
): Promise<AuthUser | null> {
  const result = await db
    .prepare(
      `SELECT s.*, u.id as user_id, u.email, u.display_name, u.avatar_url, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > unixepoch()`
    )
    .bind(token)
    .first();

  if (!result) {
    return null;
  }

  return {
    id: result.user_id as string,
    email: result.email as string,
    name: result.display_name as string | undefined,
    avatar: result.avatar_url as string | undefined,
    role: (result.role as AuthUser['role']) || 'user',
  };
}

/**
 * Delete session (logout)
 */
export async function deleteSession(
  db: D1Database,
  token: string
): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db
    .prepare('DELETE FROM sessions WHERE expires_at <= unixepoch()')
    .run();
}
