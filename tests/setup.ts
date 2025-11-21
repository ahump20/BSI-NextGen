/**
 * Vitest Test Setup
 * Global configuration and mocks for unit testing
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_APP_VERSION: '1.0.0-test',
  VITE_BLAZE_API_URL: 'http://localhost:8788',
  MODE: 'test',
  DEV: false,
  PROD: false,
}));

// Mock Cloudflare Workers global types
global.Request = class MockRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
} as typeof Request;

global.Response = class MockResponse extends Response {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
  }
} as typeof Response;

// Mock D1 Database
const createMockD1 = () => ({
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    run: vi.fn().mockResolvedValue({ success: true }),
    all: vi.fn().mockResolvedValue({ success: true, results: [] }),
    first: vi.fn().mockResolvedValue(null),
  }),
  batch: vi.fn().mockResolvedValue([]),
  exec: vi.fn().mockResolvedValue({ count: 0, duration: 0 }),
});

// Mock KV Namespace
const createMockKV = () => ({
  get: vi.fn().mockResolvedValue(null),
  put: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue({ keys: [], list_complete: true }),
});

// Export mocks for use in tests
export const mockEnv = {
  DB: createMockD1(),
  KV: createMockKV(),
};

// Custom matchers
expect.extend({
  toBeValidTimestamp(received: unknown) {
    const isValid = typeof received === 'number' && received > 0 && !isNaN(received);
    return {
      pass: isValid,
      message: () =>
        `expected ${received} to be a valid Unix timestamp (positive number)`,
    };
  },
});

// Augment vitest matchers
declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeValidTimestamp(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidTimestamp(): unknown;
  }
}
