/**
 * Tests for Auth0 Integration
 * SECURITY CRITICAL - Authentication and authorization
 */

import { Auth0Client, createAuth0Client, Auth0Config } from '../auth0';

// Mock global fetch
global.fetch = jest.fn();

describe('Auth0Client', () => {
  let client: Auth0Client;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  const mockConfig: Auth0Config = {
    domain: 'test.auth0.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/api/auth/callback',
    audience: 'https://api.example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    client = new Auth0Client(mockConfig);
  });

  describe('getAuthorizationUrl', () => {
    it('should generate correct authorization URL with all parameters', () => {
      const state = 'random-state-123';
      const scope = 'openid profile email';

      const url = client.getAuthorizationUrl(state, scope);

      expect(url).toContain('https://test.auth0.com/authorize');
      expect(url).toContain('response_type=code');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback');
      expect(url).toContain('scope=openid+profile+email');
      expect(url).toContain('state=random-state-123');
      expect(url).toContain('audience=https%3A%2F%2Fapi.example.com');
    });

    it('should use default scope when not provided', () => {
      const state = 'random-state-123';

      const url = client.getAuthorizationUrl(state);

      expect(url).toContain('scope=openid+profile+email');
    });

    it('should support custom scopes', () => {
      const state = 'random-state-123';
      const customScope = 'openid profile email offline_access';

      const url = client.getAuthorizationUrl(state, customScope);

      expect(url).toContain('scope=openid+profile+email+offline_access');
    });

    it('should omit audience when not configured', () => {
      const clientWithoutAudience = new Auth0Client({
        ...mockConfig,
        audience: undefined,
      });

      const url = clientWithoutAudience.getAuthorizationUrl('state-123');

      expect(url).not.toContain('audience=');
    });

    it('should properly encode special characters in state', () => {
      const state = 'state-with-special-chars!@#$%';

      const url = client.getAuthorizationUrl(state);

      expect(url).toContain('state=');
      // State should be URL encoded
      expect(url).toContain(encodeURIComponent(state));
    });

    it('should handle empty state', () => {
      const url = client.getAuthorizationUrl('');

      expect(url).toContain('state=');
    });
  });

  describe('exchangeCodeForTokens', () => {
    const mockTokenResponse = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      id_token: 'mock-id-token',
      token_type: 'Bearer',
      expires_in: 3600,
    };

    it('should exchange authorization code for tokens successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockTokenResponse,
      } as Response);

      const result = await client.exchangeCodeForTokens('auth-code-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.auth0.com/oauth/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            code: 'auth-code-123',
            redirect_uri: 'http://localhost:3000/api/auth/callback',
          }),
        }
      );

      expect(result).toEqual(mockTokenResponse);
    });

    it('should handle token exchange failure with error description', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code',
        }),
      } as Response);

      await expect(client.exchangeCodeForTokens('invalid-code')).rejects.toThrow(
        'Token exchange failed: Invalid authorization code'
      );
    });

    it('should handle token exchange failure with error only', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'invalid_request',
        }),
      } as Response);

      await expect(client.exchangeCodeForTokens('invalid-code')).rejects.toThrow(
        'Token exchange failed: invalid_request'
      );
    });

    it('should handle token exchange failure without error details', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(client.exchangeCodeForTokens('invalid-code')).rejects.toThrow(
        'Token exchange failed: Unknown error'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.exchangeCodeForTokens('auth-code-123')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(client.exchangeCodeForTokens('auth-code-123')).rejects.toThrow(
        'Invalid JSON'
      );
    });
  });

  describe('getUserInfo', () => {
    const mockUserInfo = {
      sub: 'auth0|123456',
      name: 'John Doe',
      email: 'john@example.com',
      email_verified: true,
      picture: 'https://example.com/photo.jpg',
    };

    it('should fetch user info successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUserInfo,
      } as Response);

      const result = await client.getUserInfo('mock-access-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.auth0.com/userinfo',
        {
          headers: {
            Authorization: 'Bearer mock-access-token',
          },
        }
      );

      expect(result).toEqual(mockUserInfo);
    });

    it('should handle user info fetch failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await expect(client.getUserInfo('invalid-token')).rejects.toThrow(
        'Failed to fetch user info'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.getUserInfo('mock-access-token')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle expired token', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      } as Response);

      await expect(client.getUserInfo('expired-token')).rejects.toThrow(
        'Failed to fetch user info'
      );
    });

    it('should include Bearer prefix in Authorization header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUserInfo,
      } as Response);

      await client.getUserInfo('test-token');

      const fetchCall = mockFetch.mock.calls[0];
      const headers = (fetchCall[1] as any).headers;
      expect(headers.Authorization).toBe('Bearer test-token');
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      } as Response);

      await client.revokeToken('refresh-token-123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.auth0.com/oauth/revoke',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            token: 'refresh-token-123',
          }),
        }
      );
    });

    it('should handle token revocation failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
      } as Response);

      await expect(client.revokeToken('invalid-token')).rejects.toThrow(
        'Failed to revoke token'
      );
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.revokeToken('token-123')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle already revoked tokens', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
      } as Response);

      await expect(client.revokeToken('already-revoked')).rejects.toThrow(
        'Failed to revoke token'
      );
    });
  });

  describe('getLogoutUrl', () => {
    it('should generate correct logout URL', () => {
      const returnTo = 'http://localhost:3000';

      const url = client.getLogoutUrl(returnTo);

      expect(url).toBe(
        'https://test.auth0.com/v2/logout?client_id=test-client-id&returnTo=http%3A%2F%2Flocalhost%3A3000'
      );
    });

    it('should properly encode return URL', () => {
      const returnTo = 'http://localhost:3000/path?query=value';

      const url = client.getLogoutUrl(returnTo);

      expect(url).toContain('returnTo=');
      expect(url).toContain(encodeURIComponent(returnTo));
    });

    it('should handle special characters in return URL', () => {
      const returnTo = 'http://localhost:3000/path?key=value&other=data';

      const url = client.getLogoutUrl(returnTo);

      expect(url).toContain('https://test.auth0.com/v2/logout');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('returnTo=');
    });

    it('should handle empty return URL', () => {
      const url = client.getLogoutUrl('');

      expect(url).toContain('returnTo=');
    });
  });

  describe('createAuth0Client factory', () => {
    it('should create Auth0Client instance', () => {
      const client = createAuth0Client(mockConfig);

      expect(client).toBeInstanceOf(Auth0Client);
    });

    it('should pass config to client', () => {
      const client = createAuth0Client(mockConfig);

      const url = client.getAuthorizationUrl('test-state');

      expect(url).toContain('test.auth0.com');
      expect(url).toContain('test-client-id');
    });
  });

  describe('Security Considerations', () => {
    it('should not expose client secret in authorization URL', () => {
      const url = client.getAuthorizationUrl('state-123');

      expect(url).not.toContain('test-client-secret');
      expect(url).not.toContain('client_secret');
    });

    it('should use HTTPS for all Auth0 endpoints', () => {
      const authUrl = client.getAuthorizationUrl('state');
      const logoutUrl = client.getLogoutUrl('http://localhost:3000');

      expect(authUrl).toMatch(/^https:\/\//);
      expect(logoutUrl).toMatch(/^https:\/\//);
    });

    it('should include client credentials only in secure backend calls', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'token' }),
      } as Response);

      await client.exchangeCodeForTokens('code-123');

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse((fetchCall[1] as any).body);

      expect(body.client_secret).toBe('test-client-secret');
    });

    it('should not log sensitive data', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      client.getAuthorizationUrl('state-123');

      // Should not log client secret
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('client-secret')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Validation', () => {
    it('should work with minimal config (no audience)', () => {
      const minimalClient = new Auth0Client({
        domain: 'test.auth0.com',
        clientId: 'test-id',
        clientSecret: 'test-secret',
        redirectUri: 'http://localhost:3000/callback',
      });

      const url = minimalClient.getAuthorizationUrl('state');

      expect(url).toContain('test.auth0.com');
      expect(url).not.toContain('audience=');
    });

    it('should handle different domain formats', () => {
      const customDomainClient = new Auth0Client({
        ...mockConfig,
        domain: 'auth.example.com',
      });

      const url = customDomainClient.getAuthorizationUrl('state');

      expect(url).toContain('https://auth.example.com/authorize');
    });

    it('should handle different redirect URIs', () => {
      const prodClient = new Auth0Client({
        ...mockConfig,
        redirectUri: 'https://example.com/auth/callback',
      });

      const url = prodClient.getAuthorizationUrl('state');

      expect(url).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fauth%2Fcallback');
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle timeout errors', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      await expect(client.getUserInfo('token')).rejects.toThrow('Request timeout');
    });

    it('should handle malformed token responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'response' }),
      } as Response);

      const result = await client.exchangeCodeForTokens('code');

      // Should return the response even if fields are missing
      expect(result).toEqual({ invalid: 'response' });
    });

    it('should handle empty error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => null,
      } as Response);

      await expect(client.exchangeCodeForTokens('code')).rejects.toThrow(
        'Token exchange failed: Unknown error'
      );
    });
  });
});
