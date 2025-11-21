/**
 * Tests for Health Check API Route
 * Critical for production monitoring
 */

import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock global fetch
global.fetch = jest.fn();

describe('/api/health', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    // Reset env vars
    process.env = { ...originalEnv };
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Healthy State', () => {
    it('should return 200 when all checks pass', async () => {
      // Mock successful MLB API check
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.checks.external_apis).toBe('healthy');
      expect(data.checks.environment).toBe('healthy');
      expect(data.checks.database).toBe('not_configured');
      expect(data.timezone).toBe('America/Chicago');
      expect(data.version).toBe('1.0.0');
    });

    it('should include response time', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.response_time_ms).toBeGreaterThanOrEqual(0);
      expect(typeof data.response_time_ms).toBe('number');
    });

    it('should include ISO timestamp', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });

    it('should set correct cache headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('X-Service-Status')).toBe('healthy');
    });
  });

  describe('Degraded State', () => {
    it('should return 503 when external API check fails', async () => {
      // Mock failed MLB API check
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('degraded');
      expect(data.checks.external_apis).toBe('degraded');
    });

    it('should handle external API network errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.status).toBe('degraded');
      expect(data.checks.external_apis).toBe('degraded');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Health Check] External API check failed:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should handle external API timeout', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock timeout error
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: false,
              status: 504,
            } as Response);
          }, 5000); // Longer than 3s timeout
        });
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.checks.external_apis).toBe('degraded');

      consoleSpy.mockRestore();
    }, 10000); // Increase test timeout

    it('should set X-Service-Status header to degraded', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.headers.get('X-Service-Status')).toBe('degraded');
    });
  });

  describe('Environment Configuration Check', () => {
    it('should be healthy with NODE_ENV set', async () => {
      process.env.NODE_ENV = 'production';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.environment).toBe('healthy');
    });

    it('should be degraded without required environment variables', async () => {
      delete process.env.NODE_ENV;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.environment).toBe('degraded');
      expect(response.status).toBe(503);
    });

    it('should still be healthy without optional SPORTSDATAIO_API_KEY', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SPORTSDATAIO_API_KEY;

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.environment).toBe('healthy');
    });
  });

  describe('External API Check', () => {
    it('should check MLB Stats API endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      await GET(request);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://statsapi.mlb.com/api/v1/schedule?sportId=1',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
          headers: {
            'User-Agent': 'BSI-NextGen/1.0',
          },
        })
      );
    });

    it('should timeout after 3 seconds', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let abortSignal: AbortSignal | null = null;
      mockFetch.mockImplementation((url, options) => {
        abortSignal = (options as any)?.signal;
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
            } as Response);
          }, 5000);

          if (abortSignal) {
            abortSignal.addEventListener('abort', () => {
              clearTimeout(timeout);
              reject(new Error('Aborted'));
            });
          }
        });
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      // Should be degraded due to timeout/abort
      expect(data.checks.external_apis).toBe('degraded');

      consoleSpy.mockRestore();
    }, 4000);

    it('should return degraded on non-200 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.checks.external_apis).toBe('degraded');
    });
  });

  describe('Response Structure', () => {
    it('should include all required fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('timezone');
      expect(data).toHaveProperty('response_time_ms');
      expect(data).toHaveProperty('checks');
      expect(data).toHaveProperty('version');

      expect(data.checks).toHaveProperty('database');
      expect(data.checks).toHaveProperty('external_apis');
      expect(data.checks).toHaveProperty('environment');
    });

    it('should have correct status values', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(['healthy', 'degraded']).toContain(data.status);
      expect(['healthy', 'degraded', 'unhealthy', 'not_configured']).toContain(data.checks.external_apis);
      expect(['healthy', 'degraded']).toContain(data.checks.environment);
    });
  });

  describe('Edge Runtime', () => {
    it('should be configured for edge runtime', () => {
      // This is a compile-time configuration, so we can't test it directly
      // But we can verify the endpoint works
      expect(GET).toBeDefined();
      expect(typeof GET).toBe('function');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/health');
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      const data = await response.json();

      const actualTime = endTime - startTime;
      expect(actualTime).toBeLessThan(5000); // Should respond within 5 seconds
      expect(data.response_time_ms).toBeLessThan(5000);
    });

    it('should track response time accurately', async () => {
      mockFetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              status: 200,
            } as Response);
          }, 100);
        });
      });

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);
      const data = await response.json();

      expect(data.response_time_ms).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Multiple Concurrent Requests', () => {
    it('should handle concurrent health checks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
      } as Response);

      const request1 = new NextRequest('http://localhost:3000/api/health');
      const request2 = new NextRequest('http://localhost:3000/api/health');
      const request3 = new NextRequest('http://localhost:3000/api/health');

      const [response1, response2, response3] = await Promise.all([
        GET(request1),
        GET(request2),
        GET(request3),
      ]);

      const [data1, data2, data3] = await Promise.all([
        response1.json(),
        response2.json(),
        response3.json(),
      ]);

      expect(data1.status).toBe('healthy');
      expect(data2.status).toBe('healthy');
      expect(data3.status).toBe('healthy');
    });
  });
});
