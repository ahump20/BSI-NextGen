/**
 * Resilience Utilities
 * Timeout and retry logic for API endpoints
 */

/**
 * Execute a promise with a timeout
 * @param promise The promise to execute
 * @param timeoutMs Timeout in milliseconds
 * @param operation Optional operation name for error messages
 * @returns Promise that rejects if timeout is exceeded
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operation} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
}

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelayMs Initial delay before first retry
 * @param maxDelayMs Maximum delay between retries
 * @param operation Optional operation name for logging
 * @returns Promise that resolves with function result or rejects after max retries
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 250,
  maxDelayMs: number = 4000,
  operation: string = 'Operation'
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on the last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Calculate exponential backoff with jitter
      const baseDelay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      const jitter = Math.random() * baseDelay * 0.1; // 10% jitter
      const delay = baseDelay + jitter;

      console.log(
        `${operation} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms...`,
        error.message
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(`${operation} failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Combine timeout and retry for maximum resilience
 * @param fn Function to execute
 * @param options Configuration options
 * @returns Promise that resolves with function result
 */
export async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    operation?: string;
  } = {}
): Promise<T> {
  const {
    timeoutMs = 10000, // 10 second default timeout
    maxRetries = 3,
    initialDelayMs = 250,
    maxDelayMs = 4000,
    operation = 'Operation'
  } = options;

  return withRetry(
    () => withTimeout(fn(), timeoutMs, operation),
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    operation
  );
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private failureThreshold: number = 5,
    private resetTimeoutMs: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>, operation: string = 'Operation'): Promise<T> {
    if (this.state === 'open') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeoutMs) {
        // Try to transition to half-open
        this.state = 'half-open';
        console.log(`Circuit breaker for ${operation} transitioning to half-open`);
      } else {
        throw new Error(`Circuit breaker open for ${operation}, failing fast`);
      }
    }

    try {
      const result = await fn();

      // Success - reset failure count
      if (this.state === 'half-open') {
        console.log(`Circuit breaker for ${operation} recovered, closing`);
      }
      this.failureCount = 0;
      this.state = 'closed';

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
        console.error(
          `Circuit breaker for ${operation} opened after ${this.failureCount} failures`
        );
      }

      throw error;
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
}

/**
 * D1 query wrapper with timeout and retry
 */
export async function queryD1WithResilience<T = unknown>(
  db: D1Database,
  query: string,
  params: any[] = [],
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    operation?: string;
  } = {}
): Promise<D1Result<T>> {
  return withTimeoutAndRetry(
    () => {
      const stmt = db.prepare(query);
      return params.length > 0 ? stmt.bind(...params).all() : stmt.all();
    },
    {
      timeoutMs: options.timeoutMs || 10000,
      maxRetries: options.maxRetries || 3,
      operation: options.operation || 'D1 Query'
    }
  ) as Promise<D1Result<T>>;
}

/**
 * KV get with timeout and retry
 */
export async function getKVWithResilience<T = unknown>(
  kv: KVNamespace,
  key: string,
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
  } = {}
): Promise<T | null> {
  return withTimeoutAndRetry(
    () => kv.get(key, options.type as any) as Promise<T | null>,
    {
      timeoutMs: options.timeoutMs || 5000,
      maxRetries: options.maxRetries || 2,
      operation: `KV Get ${key}`
    }
  );
}

/**
 * KV put with timeout and retry
 */
export async function putKVWithResilience(
  kv: KVNamespace,
  key: string,
  value: string | ArrayBuffer | ReadableStream,
  options: {
    timeoutMs?: number;
    maxRetries?: number;
    expirationTtl?: number;
  } = {}
): Promise<void> {
  return withTimeoutAndRetry(
    () => kv.put(key, value, { expirationTtl: options.expirationTtl }),
    {
      timeoutMs: options.timeoutMs || 5000,
      maxRetries: options.maxRetries || 2,
      operation: `KV Put ${key}`
    }
  );
}
