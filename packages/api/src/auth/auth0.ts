import type { Auth0TokenResponse, Auth0UserInfo } from '@bsi/shared';

export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  audience?: string;
}

export class Auth0Client {
  constructor(private config: Auth0Config) {}

  /**
   * Get the Auth0 authorization URL for OAuth login
   */
  getAuthorizationUrl(state: string, scope: string = 'openid profile email'): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope,
      state,
      ...(this.config.audience && { audience: this.config.audience }),
    });

    return `https://${this.config.domain}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForTokens(code: string): Promise<Auth0TokenResponse> {
    const response = await fetch(`https://${this.config.domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: string; error_description?: string };
      throw new Error(`Token exchange failed: ${error.error_description || error.error || 'Unknown error'}`);
    }

    return response.json() as Promise<Auth0TokenResponse>;
  }

  /**
   * Get user information using access token
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

    return response.json() as Promise<Auth0UserInfo>;
  }

  /**
   * Revoke a refresh token
   */
  async revokeToken(token: string): Promise<void> {
    const response = await fetch(`https://${this.config.domain}/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        token,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Get Auth0 logout URL
   */
  getLogoutUrl(returnTo: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      returnTo,
    });

    return `https://${this.config.domain}/v2/logout?${params.toString()}`;
  }
}

/**
 * Factory function to create Auth0 client
 */
export function createAuth0Client(config: Auth0Config): Auth0Client {
  return new Auth0Client(config);
}
