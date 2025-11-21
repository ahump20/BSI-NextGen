import type { ApiResponse, Game, Sport, NCAAGame } from '@bsi/shared';

type EdgeFeedGame = Game | NCAAGame;

export interface EdgeClientOptions {
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export interface EdgeFetchParams {
  date?: string;
  etag?: string;
}

export interface EdgeFeedResponse<T> extends ApiResponse<T> {
  etag?: string;
  fromCache?: boolean;
}

const DEFAULT_BASE =
  typeof process !== 'undefined'
    ? process.env.BLAZE_EDGE_FEEDS_URL || process.env.FEEDS_WORKER_URL || 'https://blaze-feeds.workers.dev'
    : 'https://blaze-feeds.workers.dev';

export function createEdgeClient(options: EdgeClientOptions = {}) {
  const baseUrl = (options.baseUrl || DEFAULT_BASE).replace(/\/$/, '');
  const fetcher = options.fetchFn || fetch;

  return {
    async fetchGames<T = EdgeFeedGame[]>(sport: Sport, params: EdgeFetchParams = {}): Promise<EdgeFeedResponse<T>> {
      const url = new URL(`/feeds/${sport.toLowerCase()}`, baseUrl);
      if (params.date) {
        url.searchParams.set('date', params.date);
      }

      const response = await fetcher(url.toString(), {
        headers: {
          ...(params.etag ? { 'If-None-Match': params.etag } : {}),
        },
      });

      if (response.status === 304) {
        return {
          data: [] as T,
          source: {
            provider: 'edge-cache',
            timestamp: new Date().toISOString(),
            confidence: 0.5,
          },
          etag: params.etag,
          fromCache: true,
        };
      }

      if (!response.ok) {
        throw new Error(`Edge feed request failed with status ${response.status}`);
      }

      const body = (await response.json()) as ApiResponse<T>;
      const etag = response.headers.get('etag') || undefined;

      return {
        ...body,
        etag,
        fromCache: false,
      };
    },
  };
}

export type EdgeClient = ReturnType<typeof createEdgeClient>;
export type { EdgeFeedGame };
