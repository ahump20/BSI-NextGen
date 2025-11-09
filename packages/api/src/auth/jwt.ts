import { SignJWT, jwtVerify, importSPKI } from 'jose';
import type { AuthUser, JWTPayload } from '@bsi/shared';

export interface JWTConfig {
  secret: string;
  issuer: string;
  audience: string;
  expiresIn?: string; // e.g., '7d', '24h'
}

/**
 * Create a JWT token for an authenticated user
 */
export async function createJWT(
  user: AuthUser,
  config: JWTConfig
): Promise<string> {
  const secret = new TextEncoder().encode(config.secret);

  const token = await new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(config.issuer)
    .setAudience(config.audience)
    .setExpirationTime(config.expiresIn || '7d')
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyJWT(
  token: string,
  config: Omit<JWTConfig, 'expiresIn'>
): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(config.secret);

    const { payload } = await jwtVerify(token, secret, {
      issuer: config.issuer,
      audience: config.audience,
    });

    if (!payload.sub || !payload.email || !payload.role) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email as string,
      role: payload.role as AuthUser['role'],
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Verify RS256 JWT from Auth0 (public key verification)
 */
export async function verifyAuth0JWT(
  token: string,
  publicKey: string,
  config: Omit<JWTConfig, 'secret' | 'expiresIn'>
): Promise<AuthUser | null> {
  try {
    const key = await importSPKI(publicKey, 'RS256');

    const { payload } = await jwtVerify(token, key, {
      issuer: config.issuer,
      audience: config.audience,
    });

    if (!payload.sub || !payload.email) {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email as string,
      role: (payload.role as AuthUser['role']) || 'user',
    };
  } catch (error) {
    console.error('Auth0 JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract JWT from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
