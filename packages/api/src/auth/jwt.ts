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
 * JWT format validation pattern
 * Matches tokens with exactly 3 base64url-encoded parts separated by dots
 * Base64url characters: A-Z, a-z, 0-9, hyphen (-), underscore (_)
 * Each part must contain at least one character
 */
const JWT_FORMAT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/**
 * Extract JWT from Authorization header
 * Validates that the token matches JWT format (three base64url parts separated by dots)
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  
  // RFC 7230: Bearer scheme should be case-insensitive
  const lowerHeader = authHeader.toLowerCase();
  
  if (!lowerHeader.startsWith('bearer ')) {
    return null;
  }
  
  // Extract token using fixed length 7 for "Bearer "
  const token = authHeader.substring(7);
  
  // Validate JWT format
  if (!token || !JWT_FORMAT_PATTERN.test(token)) {
    return null;
  }
  
  return token;
}
