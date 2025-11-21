/**
 * Auth0 OAuth Integration
 * Handles OAuth login flow with Auth0
 */

export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  audience: string;
}

export interface Auth0TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface Auth0UserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  picture?: string;
  updated_at?: string;
}

export class Auth0Client {
  constructor(private config: Auth0Config) {}

  /**
   * Generate authorization URL for OAuth login
   */
  getAuthorizationUrl(state: string, scope: string = 'openid profile email'): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope,
      state,
      audience: this.config.audience,
    });

    return `https://${this.config.domain}/authorize?${params}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<Auth0TokenResponse> {
    const response = await fetch(`https://${this.config.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Get user info from Auth0
   */
  async getUserInfo(accessToken: string): Promise<Auth0UserInfo> {
    const response = await fetch(`https://${this.config.domain}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<Auth0TokenResponse> {
    const response = await fetch(`https://${this.config.domain}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeToken(token: string): Promise<void> {
    await fetch(`https://${this.config.domain}/oauth/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        token,
      }),
    });
  }

  /**
   * Get logout URL
   */
  getLogoutUrl(returnTo: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      returnTo,
    });

    return `https://${this.config.domain}/v2/logout?${params}`;
  }
}

/**
 * Factory function to create Auth0 client
 */
export function createAuth0Client(config: Auth0Config): Auth0Client {
  return new Auth0Client(config);
}
