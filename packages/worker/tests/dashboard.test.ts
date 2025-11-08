import { describe, it, expect, vi, beforeEach } from 'vitest';
import handler from '../src/index';
import type { Env } from '../src/bindings';

const mockEnv = (): Env => ({
  PRIMARY_LEAGUES: 'NBA,WNBA',
  BSI_DB: {
    prepare: () => ({
      bind: () => ({
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn()
      }),
      all: vi.fn().mockResolvedValue({ results: [] }),
      first: vi.fn()
    })
  } as unknown as D1Database,
  BSI_CACHE: {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ keys: [] })
  } as unknown as KVNamespace,
  BSI_ASSETS: {} as R2Bucket
});

describe('dashboard endpoint', () => {
  let env: Env;

  beforeEach(() => {
    env = mockEnv();
  });

  it('returns a JSON response', async () => {
    const request = new Request('https://example.com/api/v1/dashboard');
    const response = await handler.fetch(request, env, {} as ExecutionContext);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
  });
});
