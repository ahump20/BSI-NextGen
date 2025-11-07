/**
 * RetryUtils.ts
 * Utilities for automatic retries with exponential backoff
 */

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  shouldRetry: (error: any, attempt: number) => {
    // Retry on network errors or 5xx server errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return true; // Network error
    }
    if (error.status >= 500 && error.status < 600) {
      return true; // Server error
    }
    return false; // Don't retry client errors (4xx) or other errors
  },
  onRetry: () => {} // No-op by default
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter (±25% randomization)
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  let lastError: any;

  for (let attempt = 1; attempt <= mergedConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === mergedConfig.maxAttempts;

      if (isLastAttempt || !mergedConfig.shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        mergedConfig.initialDelay,
        mergedConfig.maxDelay,
        mergedConfig.backoffMultiplier
      );

      // Call retry callback
      mergedConfig.onRetry(error, attempt, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Retry fetch with exponential backoff
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  config: RetryConfig = {}
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init);

      // Check for HTTP errors
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }

      return response;
    },
    config
  );
}

/**
 * Request deduplication cache
 */
class RequestCache {
  private pending = new Map<string, Promise<any>>();

  /**
   * Get or create a request
   */
  public async getOrCreate<T>(
    key: string,
    creator: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    // Create new request
    const promise = creator().finally(() => {
      // Remove from pending after completion
      this.pending.delete(key);
    });

    this.pending.set(key, promise);

    return promise;
  }

  /**
   * Clear all pending requests
   */
  public clear(): void {
    this.pending.clear();
  }

  /**
   * Check if request is pending
   */
  public has(key: string): boolean {
    return this.pending.has(key);
  }
}

// Global request cache instance
export const requestCache = new RequestCache();

/**
 * Timeout wrapper for promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}

/**
 * Circuit breaker pattern for failing services
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private failureThreshold: number = 5,
    private cooldownPeriod: number = 60000, // 1 minute
    private successThreshold: number = 2
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === "open") {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.cooldownPeriod) {
        // Try to recover
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open - service unavailable");
      }
    }

    try {
      const result = await fn();

      // Success
      if (this.state === "half-open") {
        this.failureCount--;

        if (this.failureCount <= 0) {
          this.state = "closed";
          this.failureCount = 0;
        }
      }

      return result;
    } catch (error) {
      // Failure
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = "open";
      }

      throw error;
    }
  }

  /**
   * Manually reset the circuit breaker
   */
  public reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.state = "closed";
  }

  /**
   * Get current state
   */
  public getState(): "closed" | "open" | "half-open" {
    return this.state;
  }
}
