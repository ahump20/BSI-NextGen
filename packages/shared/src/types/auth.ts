/**
 * Authentication Types
 * OAuth 2.0 with Auth0 + JWT tokens
 */

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  role: 'user' | 'premium' | 'admin';
  emailVerified?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  refresh_token?: string;
}

export interface Auth0UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  nickname?: string;
  picture?: string;
  updated_at?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: AuthUser['role'];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface AuthError {
  code: string;
  message: string;
  statusCode: number;
}

export type AuthState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'authenticated'; user: AuthUser; error: null }
  | { status: 'unauthenticated'; user: null; error: null }
  | { status: 'error'; user: null; error: AuthError };
