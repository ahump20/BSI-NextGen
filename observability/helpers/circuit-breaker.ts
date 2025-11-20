/**
 * Circuit Breaker Implementation for External API Calls
 *
 * Prevents cascading failures by failing fast when external services are down.
 */

import { StructuredLogger, MetricsRecorder } from './telemetry';

// ============================================================================
// Types
// ============================================================================

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Failing, reject requests
  HALF_OPEN = 'half_open', // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time in ms to wait before entering half-open
  name: string;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastStateChange: number;
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime?: number;
  private lastStateChange: number = Date.now();
  private config: CircuitBreakerConfig;
  private logger: StructuredLogger;
  private metrics: MetricsRecorder;

  constructor(
    config: CircuitBreakerConfig,
    logger: StructuredLogger,
    metrics: MetricsRecorder
  ) {
    this.config = config;
    this.logger = logger.child({ circuitBreaker: config.name });
    this.metrics = metrics;
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      const now = Date.now();
      const timeSinceFailure = this.lastFailureTime
        ? now - this.lastFailureTime
        : Infinity;

      // Check if we should enter half-open state
      if (timeSinceFailure >= this.config.timeout) {
        this.logger.info('Circuit entering half-open state', {
          timeSinceFailure,
          timeout: this.config.timeout,
        });
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        // Circuit is still open, fail fast
        this.metrics.counter('circuit_breaker.rejected', 1, {
          circuit: this.config.name,
          state: this.state,
        });

        throw new Error(
          `Circuit breaker is OPEN for ${this.config.name}. Failing fast.`
        );
      }
    }

    // Attempt to execute the function
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      this.logger.debug('Success in half-open state', {
        successCount: this.successCount,
        successThreshold: this.config.successThreshold,
      });

      // Check if we should close the circuit
      if (this.successCount >= this.config.successThreshold) {
        this.logger.info('Circuit closing after successful recovery');
        this.transitionTo(CircuitState.CLOSED);
        this.successCount = 0;
      }
    }

    this.metrics.counter('circuit_breaker.success', 1, {
      circuit: this.config.name,
      state: this.state,
    });
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: unknown): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    this.logger.warn('Circuit breaker failure', {
      failureCount: this.failureCount,
      failureThreshold: this.config.failureThreshold,
      error: error instanceof Error ? error.message : String(error),
    });

    this.metrics.counter('circuit_breaker.failure', 1, {
      circuit: this.config.name,
      state: this.state,
    });

    // If in half-open, immediately reopen
    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.warn('Circuit reopening after failure in half-open state');
      this.transitionTo(CircuitState.OPEN);
      this.successCount = 0;
      return;
    }

    // Check if we should open the circuit
    if (
      this.state === CircuitState.CLOSED &&
      this.failureCount >= this.config.failureThreshold
    ) {
      this.logger.error('Circuit opening due to failure threshold', {
        failureCount: this.failureCount,
        failureThreshold: this.config.failureThreshold,
      });
      this.transitionTo(CircuitState.OPEN);
    }
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    this.logger.info('Circuit state transition', {
      from: oldState,
      to: newState,
    });

    this.metrics.counter('circuit_breaker.state_change', 1, {
      circuit: this.config.name,
      from: oldState,
      to: newState,
    });
  }

  /**
   * Get current circuit breaker stats
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.logger.info('Circuit breaker manually reset');
    this.transitionTo(CircuitState.CLOSED);
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    this.logger.warn('Circuit breaker manually opened');
    this.transitionTo(CircuitState.OPEN);
  }
}

/**
 * Circuit Breaker Manager - manages multiple circuit breakers
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private logger: StructuredLogger;
  private metrics: MetricsRecorder;

  constructor(logger: StructuredLogger, metrics: MetricsRecorder) {
    this.logger = logger;
    this.metrics = metrics;
  }

  /**
   * Get or create a circuit breaker
   */
  getBreaker(config: CircuitBreakerConfig): CircuitBreaker {
    let breaker = this.breakers.get(config.name);

    if (!breaker) {
      breaker = new CircuitBreaker(config, this.logger, this.metrics);
      this.breakers.set(config.name, breaker);
    }

    return breaker;
  }

  /**
   * Get stats for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};

    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }

    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}
