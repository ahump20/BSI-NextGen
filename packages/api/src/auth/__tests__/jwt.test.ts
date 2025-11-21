/**
 * Tests for JWT Utilities
 * SECURITY CRITICAL - Token generation and validation
 */

import { createJWT, verifyJWT, verifyAuth0JWT, extractBearerToken, JWTConfig } from '../jwt';
import * as jose from 'jose';
import type { AuthUser } from '@bsi/shared';

// Mock jose library
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setIssuer: jest.fn().mockReturnThis(),
    setAudience: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn(),
  importSPKI: jest.fn(),
}));

describe('JWT Utilities', () => {
  const mockConfig: JWTConfig = {
    secret: 'test-secret-key',
    issuer: 'https://test.auth.com',
    audience: 'https://api.test.com',
    expiresIn: '7d',
  };

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'user',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createJWT', () => {
    it('should create a valid JWT token', async () => {
      const token = await createJWT(mockUser, mockConfig);

      expect(token).toBe('mock-jwt-token');
      expect(jose.SignJWT).toHaveBeenCalledWith({
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      });
    });

    it('should set correct JWT headers and claims', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('token'),
      };

      (jose.SignJWT as jest.Mock).mockReturnValue(mockSignJWT);

      await createJWT(mockUser, mockConfig);

      expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
      expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();
      expect(mockSignJWT.setIssuer).toHaveBeenCalledWith('https://test.auth.com');
      expect(mockSignJWT.setAudience).toHaveBeenCalledWith('https://api.test.com');
      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith('7d');
    });

    it('should use default expiration when not provided', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('token'),
      };

      (jose.SignJWT as jest.Mock).mockReturnValue(mockSignJWT);

      const configWithoutExpiry = { ...mockConfig };
      delete configWithoutExpiry.expiresIn;

      await createJWT(mockUser, configWithoutExpiry);

      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith('7d');
    });

    it('should handle different user roles', async () => {
      const adminUser: AuthUser = {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      };

      await createJWT(adminUser, mockConfig);

      expect(jose.SignJWT).toHaveBeenCalledWith({
        sub: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
      });
    });

    it('should handle custom expiration times', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('token'),
      };

      (jose.SignJWT as jest.Mock).mockReturnValue(mockSignJWT);

      await createJWT(mockUser, { ...mockConfig, expiresIn: '24h' });

      expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith('24h');
    });
  });

  describe('verifyJWT', () => {
    it('should verify and decode valid JWT', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
        iat: Date.now(),
        exp: Date.now() + 3600000,
      };

      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'HS256' },
      });

      const result = await verifyJWT('valid-token', mockConfig);

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      });

      expect(jose.jwtVerify).toHaveBeenCalledWith(
        'valid-token',
        expect.any(Uint8Array),
        {
          issuer: 'https://test.auth.com',
          audience: 'https://api.test.com',
        }
      );
    });

    it('should return null for invalid JWT', async () => {
      (jose.jwtVerify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await verifyJWT('invalid-token', mockConfig);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'JWT verification failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return null when payload is missing required fields', async () => {
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          sub: 'user-123',
          // Missing email and role
        },
        protectedHeader: { alg: 'HS256' },
      });

      const result = await verifyJWT('token-without-email', mockConfig);

      expect(result).toBeNull();
    });

    it('should return null when sub is missing', async () => {
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          email: 'test@example.com',
          role: 'user',
        },
        protectedHeader: { alg: 'HS256' },
      });

      const result = await verifyJWT('token-without-sub', mockConfig);

      expect(result).toBeNull();
    });

    it('should return null when email is missing', async () => {
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          sub: 'user-123',
          role: 'user',
        },
        protectedHeader: { alg: 'HS256' },
      });

      const result = await verifyJWT('token-without-email', mockConfig);

      expect(result).toBeNull();
    });

    it('should return null when role is missing', async () => {
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: {
          sub: 'user-123',
          email: 'test@example.com',
        },
        protectedHeader: { alg: 'HS256' },
      });

      const result = await verifyJWT('token-without-role', mockConfig);

      expect(result).toBeNull();
    });

    it('should handle expired tokens', async () => {
      (jose.jwtVerify as jest.Mock).mockRejectedValue(
        new Error('JWT expired')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await verifyJWT('expired-token', mockConfig);

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should verify issuer and audience', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'HS256' },
      });

      await verifyJWT('token', mockConfig);

      const verifyCall = (jose.jwtVerify as jest.Mock).mock.calls[0];
      expect(verifyCall[2]).toEqual({
        issuer: 'https://test.auth.com',
        audience: 'https://api.test.com',
      });
    });
  });

  describe('verifyAuth0JWT', () => {
    const mockPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA
-----END PUBLIC KEY-----`;

    it('should verify Auth0 JWT with public key', async () => {
      const mockPayload = {
        sub: 'auth0|user123',
        email: 'test@example.com',
        role: 'user',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('mock-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      });

      const result = await verifyAuth0JWT('auth0-token', mockPublicKey, {
        issuer: 'https://test.auth0.com',
        audience: 'https://api.test.com',
      });

      expect(result).toEqual({
        id: 'auth0|user123',
        email: 'test@example.com',
        role: 'user',
      });

      expect(jose.importSPKI).toHaveBeenCalledWith(mockPublicKey, 'RS256');
    });

    it('should use default user role when not provided', async () => {
      const mockPayload = {
        sub: 'auth0|user123',
        email: 'test@example.com',
        // No role in payload
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('mock-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      });

      const result = await verifyAuth0JWT('auth0-token', mockPublicKey, {
        issuer: 'https://test.auth0.com',
        audience: 'https://api.test.com',
      });

      expect(result?.role).toBe('user');
    });

    it('should return null for invalid Auth0 JWT', async () => {
      (jose.importSPKI as jest.Mock).mockRejectedValue(
        new Error('Invalid public key')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await verifyAuth0JWT('invalid-token', mockPublicKey, {
        issuer: 'https://test.auth0.com',
        audience: 'https://api.test.com',
      });

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Auth0 JWT verification failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should return null when sub is missing', async () => {
      const mockPayload = {
        email: 'test@example.com',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('mock-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      });

      const result = await verifyAuth0JWT('token', mockPublicKey, {
        issuer: 'https://test.auth0.com',
        audience: 'https://api.test.com',
      });

      expect(result).toBeNull();
    });

    it('should return null when email is missing', async () => {
      const mockPayload = {
        sub: 'auth0|user123',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('mock-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      });

      const result = await verifyAuth0JWT('token', mockPublicKey, {
        issuer: 'https://test.auth0.com',
        audience: 'https://api.test.com',
      });

      expect(result).toBeNull();
    });

    it('should handle admin role from Auth0', async () => {
      const mockPayload = {
        sub: 'auth0|admin123',
        email: 'admin@example.com',
        role: 'admin',
      };

      (jose.importSPKI as jest.Mock).mockResolvedValue('mock-key');
      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'RS256' },
      });

      const result = await verifyAuth0JWT('token', mockPublicKey, {
        issuer: 'https://test.auth0.com',
        audience: 'https://api.test.com',
      });

      expect(result?.role).toBe('admin');
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      const token = extractBearerToken('Bearer mock-jwt-token');

      expect(token).toBe('mock-jwt-token');
    });

    it('should return null for null header', () => {
      const token = extractBearerToken(null);

      expect(token).toBeNull();
    });

    it('should return null for empty header', () => {
      const token = extractBearerToken('');

      expect(token).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const token = extractBearerToken('mock-jwt-token');

      expect(token).toBeNull();
    });

    it('should return null for malformed Bearer header', () => {
      const token = extractBearerToken('Bear mock-jwt-token');

      expect(token).toBeNull();
    });

    it('should handle Bearer with different casing', () => {
      // The "Bearer" prefix should be matched case-insensitively (RFC 7230)
      const token = extractBearerToken('bearer mock-jwt-token');

      expect(token).toBe('mock-jwt-token');
    });

    it('should extract token with spaces in it', () => {
      // Though not typical, some systems might have spaces
      const token = extractBearerToken('Bearer token with spaces');

      expect(token).toBe('token with spaces');
    });

    it('should handle empty token after Bearer', () => {
      const token = extractBearerToken('Bearer ');

      expect(token).toBe('');
    });

    it('should handle very long tokens', () => {
      const longToken = 'x'.repeat(1000);
      const token = extractBearerToken(`Bearer ${longToken}`);

      expect(token).toBe(longToken);
    });
  });

  describe('Security Considerations', () => {
    it('should use HS256 algorithm for token signing', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockResolvedValue('token'),
      };

      (jose.SignJWT as jest.Mock).mockReturnValue(mockSignJWT);

      await createJWT(mockUser, mockConfig);

      expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({ alg: 'HS256' });
    });

    it('should encode secret as Uint8Array', async () => {
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      (jose.jwtVerify as jest.Mock).mockResolvedValue({
        payload: mockPayload,
        protectedHeader: { alg: 'HS256' },
      });

      await verifyJWT('token', mockConfig);

      const verifyCall = (jose.jwtVerify as jest.Mock).mock.calls[0];
      expect(verifyCall[1]).toBeInstanceOf(Uint8Array);
    });

    it('should not log sensitive data', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await createJWT(mockUser, mockConfig);

      // Should not log secret
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining(mockConfig.secret)
      );

      consoleSpy.mockRestore();
    });

    it('should handle token tampering attempts', async () => {
      (jose.jwtVerify as jest.Mock).mockRejectedValue(
        new Error('Signature verification failed')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await verifyJWT('tampered-token', mockConfig);

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle jose library errors gracefully', async () => {
      const mockSignJWT = {
        setProtectedHeader: jest.fn().mockReturnThis(),
        setIssuedAt: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setAudience: jest.fn().mockReturnThis(),
        setExpirationTime: jest.fn().mockReturnThis(),
        sign: jest.fn().mockRejectedValue(new Error('Signing failed')),
      };

      (jose.SignJWT as jest.Mock).mockReturnValue(mockSignJWT);

      await expect(createJWT(mockUser, mockConfig)).rejects.toThrow('Signing failed');
    });

    it('should handle malformed tokens', async () => {
      (jose.jwtVerify as jest.Mock).mockRejectedValue(
        new Error('Malformed token')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await verifyJWT('malformed', mockConfig);

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle invalid public key format', async () => {
      (jose.importSPKI as jest.Mock).mockRejectedValue(
        new Error('Invalid key format')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await verifyAuth0JWT('token', 'invalid-key', {
        issuer: 'https://test.auth0.com',
        audience: 'https://api.test.com',
      });

      expect(result).toBeNull();

      consoleSpy.mockRestore();
    });
  });
});
