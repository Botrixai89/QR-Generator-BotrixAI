/**
 * Circuit Breaker Pattern
 * Prevents cascading failures by stopping requests when a service is down
 */

export interface CircuitBreakerConfig {
  failureThreshold: number // Number of failures before opening circuit
  resetTimeout: number // Time in ms before attempting to reset
  monitoringPeriod: number // Time in ms to track failures
}

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Circuit is open, rejecting requests
  HALF_OPEN = 'half-open', // Testing if service recovered
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED
  private failures: number = 0
  private lastFailureTime: number = 0
  private nextRetryTime: number = 0
  private config: CircuitBreakerConfig

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 60000, // 1 minute
      monitoringPeriod: config.monitoringPeriod || 60000, // 1 minute
    }
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // Check if circuit should be reset
    if (this.state === CircuitState.OPEN) {
      if (Date.now() >= this.nextRetryTime) {
        this.state = CircuitState.HALF_OPEN
        this.failures = 0
      } else {
        // Circuit is open, reject request
        if (fallback) {
          return await fallback()
        }
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await fn()

      // Success - reset circuit if half-open
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.CLOSED
        this.failures = 0
      } else if (this.state === CircuitState.CLOSED) {
        // Reset failures in closed state after monitoring period
        const timeSinceLastFailure = Date.now() - this.lastFailureTime
        if (timeSinceLastFailure > this.config.monitoringPeriod) {
          this.failures = 0
        }
      }

      return result
    } catch (error) {
      // Failure - increment counter
      this.failures++
      this.lastFailureTime = Date.now()

      // Check if we should open circuit
      if (this.failures >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN
        this.nextRetryTime = Date.now() + this.config.resetTimeout
      }

      // If half-open and failure, go back to open
      if (this.state === CircuitState.HALF_OPEN) {
        this.state = CircuitState.OPEN
        this.nextRetryTime = Date.now() + this.config.resetTimeout
      }

      // Try fallback if available
      if (fallback) {
        return await fallback()
      }

      throw error
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get failure count
   */
  getFailures(): number {
    return this.failures
  }

  /**
   * Manually reset circuit
   */
  reset(): void {
    this.state = CircuitState.CLOSED
    this.failures = 0
    this.lastFailureTime = 0
    this.nextRetryTime = 0
  }

  /**
   * Check if circuit is open
   */
  isOpen(): boolean {
    return this.state === CircuitState.OPEN
  }
}

/**
 * Create a circuit breaker instance for a specific service
 */
const circuitBreakers = new Map<string, CircuitBreaker>()

export function getCircuitBreaker(
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(config))
  }
  return circuitBreakers.get(serviceName)!
}

