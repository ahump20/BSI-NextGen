/**
 * Real-Time Data Hooks
 *
 * WebSocket and Server-Sent Events integration for live updates
 * Implements automatic reconnection, backoff, and error handling
 *
 * @see https://www.sisense.com/blog/data-to-decisions-exploring-power-of-ai-dashboard/
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface RealTimeConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  protocol?: 'websocket' | 'sse' | 'polling';
}

export interface RealTimeState<T> {
  data: T | null;
  isConnected: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  reconnectAttempts: number;
}

/**
 * Hook for real-time data using WebSocket
 */
export function useWebSocket<T>(config: RealTimeConfig): RealTimeState<T> & {
  send: (data: any) => void;
  reconnect: () => void;
} {
  const [state, setState] = useState<RealTimeState<T>>({
    data: null,
    isConnected: false,
    error: null,
    lastUpdate: null,
    reconnectAttempts: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const maxReconnectAttempts = config.maxReconnectAttempts || 5;
  const reconnectInterval = config.reconnectInterval || 3000;

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(config.url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setState(prev => ({
          ...prev,
          isConnected: true,
          error: null,
          reconnectAttempts: 0,
        }));
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as T;
          setState(prev => ({
            ...prev,
            data,
            lastUpdate: new Date(),
          }));
        } catch (error) {
          console.error('[WebSocket] Parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setState(prev => ({
          ...prev,
          error: new Error('WebSocket connection error'),
        }));
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setState(prev => ({
          ...prev,
          isConnected: false,
        }));

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1);

          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);

          setState(prev => ({
            ...prev,
            reconnectAttempts: reconnectAttemptsRef.current,
          }));
        } else {
          setState(prev => ({
            ...prev,
            error: new Error('Max reconnection attempts reached'),
          }));
        }
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setState(prev => ({
        ...prev,
        error: error as Error,
      }));
    }
  }, [config.url, maxReconnectAttempts, reconnectInterval]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send - not connected');
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    ...state,
    send,
    reconnect,
  };
}

/**
 * Hook for Server-Sent Events (SSE)
 */
export function useSSE<T>(config: RealTimeConfig): RealTimeState<T> {
  const [state, setState] = useState<RealTimeState<T>>({
    data: null,
    isConnected: false,
    error: null,
    lastUpdate: null,
    reconnectAttempts: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const maxReconnectAttempts = config.maxReconnectAttempts || 5;
  const reconnectInterval = config.reconnectInterval || 3000;

  useEffect(() => {
    const connect = () => {
      try {
        const eventSource = new EventSource(config.url);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          console.log('[SSE] Connected');
          setState(prev => ({
            ...prev,
            isConnected: true,
            error: null,
            reconnectAttempts: 0,
          }));
          reconnectAttemptsRef.current = 0;
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as T;
            setState(prev => ({
              ...prev,
              data,
              lastUpdate: new Date(),
            }));
          } catch (error) {
            console.error('[SSE] Parse error:', error);
          }
        };

        eventSource.onerror = () => {
          console.error('[SSE] Connection error');
          setState(prev => ({
            ...prev,
            isConnected: false,
            error: new Error('SSE connection error'),
          }));

          eventSource.close();

          // Attempt reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1);

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);

            setState(prev => ({
              ...prev,
              reconnectAttempts: reconnectAttemptsRef.current,
            }));
          }
        };
      } catch (error) {
        console.error('[SSE] Connection error:', error);
        setState(prev => ({
          ...prev,
          error: error as Error,
        }));
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [config.url, maxReconnectAttempts, reconnectInterval]);

  return state;
}

/**
 * Hook for polling-based real-time updates
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number = 30000
): RealTimeState<T> {
  const [state, setState] = useState<RealTimeState<T>>({
    data: null,
    isConnected: true,
    error: null,
    lastUpdate: null,
    reconnectAttempts: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout>();

  const fetchData = useCallback(async () => {
    try {
      const data = await fetcher();
      setState(prev => ({
        ...prev,
        data,
        lastUpdate: new Date(),
        error: null,
      }));
    } catch (error) {
      console.error('[Polling] Fetch error:', error);
      setState(prev => ({
        ...prev,
        error: error as Error,
      }));
    }
  }, [fetcher]);

  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up polling
    intervalRef.current = setInterval(fetchData, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval]);

  return state;
}

/**
 * Hook for live game updates with automatic protocol selection
 */
export function useLiveGameData(gameId: string) {
  const [protocol, setProtocol] = useState<'websocket' | 'sse' | 'polling'>('polling');

  // Detect best protocol
  useEffect(() => {
    if (typeof WebSocket !== 'undefined') {
      setProtocol('websocket');
    } else if (typeof EventSource !== 'undefined') {
      setProtocol('sse');
    } else {
      setProtocol('polling');
    }
  }, []);

  const wsUrl = `wss://api.blazesportsintel.com/games/${gameId}/live`;
  const sseUrl = `https://api.blazesportsintel.com/games/${gameId}/stream`;
  const pollFetcher = useCallback(
    () => fetch(`https://api.blazesportsintel.com/games/${gameId}`).then(r => r.json()),
    [gameId]
  );

  const wsState = useWebSocket({
    url: wsUrl,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  });

  const sseState = useSSE({
    url: sseUrl,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
  });

  const pollingState = usePolling(pollFetcher, 15000);

  return protocol === 'websocket' ? wsState :
         protocol === 'sse' ? sseState :
         pollingState;
}

/**
 * Hook for optimistic updates with rollback
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  onUpdate: (data: T) => Promise<void>
) {
  const [data, setData] = useState<T>(initialData);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const previousDataRef = useRef<T>(initialData);

  const update = useCallback(async (newData: T) => {
    previousDataRef.current = data;
    setData(newData);
    setIsPending(true);
    setError(null);

    try {
      await onUpdate(newData);
      setIsPending(false);
    } catch (err) {
      // Rollback on error
      setData(previousDataRef.current);
      setError(err as Error);
      setIsPending(false);
    }
  }, [data, onUpdate]);

  return {
    data,
    isPending,
    error,
    update,
  };
}
