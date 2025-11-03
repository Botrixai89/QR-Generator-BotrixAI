/**
 * Retry and Timeout Utilities
 * Provides retry logic with timeouts for Supabase and external API calls
 */

export interface RetryConfig {
  maxRetries: number
  initialDelay: number // ms
  maxDelay: number // ms
  backoffMultiplier: number
  timeout: number // ms
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  timeout: 30000, // 30 seconds
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create timeout promise that rejects after timeout
 */
function createTimeout(timeout: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`))
    }, timeout)
  })
}

/**
 * Retry function with exponential backoff and timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Race between function and timeout
      return await Promise.race([
        fn(),
        createTimeout(finalConfig.timeout),
      ])
    } catch (error) {
      lastError = error as Error

      // Don't retry on timeout (it's likely a persistent issue)
      if (error instanceof Error && error.message.includes('timed out')) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      )

      // Wait before retry
      await sleep(delay)
    }
  }

  throw lastError || new Error('Retry failed')
}

/**
 * Retry with timeout and specific error handling
 */
export async function retryWithTimeoutAndHandler<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  onError?: (error: Error, attempt: number) => Promise<void>
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await Promise.race([
        fn(),
        createTimeout(finalConfig.timeout),
      ])
    } catch (error) {
      lastError = error as Error

      // Call error handler if provided
      if (onError) {
        await onError(error as Error, attempt)
      }

      // Don't retry on timeout
      if (error instanceof Error && error.message.includes('timed out')) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === finalConfig.maxRetries) {
        break
      }

      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt),
        finalConfig.maxDelay
      )

      await sleep(delay)
    }
  }

  throw lastError || new Error('Retry failed')
}

/**
 * Supabase query wrapper with retry and timeout
 */
export async function supabaseQueryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const result = await retryWithTimeout(async () => {
    const { data, error } = await queryFn()

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`)
    }

    if (data === null) {
      throw new Error('Supabase query returned null')
    }

    return data
  }, {
    ...config,
    timeout: config.timeout || 30000, // 30s for Supabase
  })

  return result
}

/**
 * External API call wrapper with retry and timeout
 */
export async function apiCallWithRetry<T>(
  apiFn: () => Promise<Response>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const result = await retryWithTimeout(async () => {
    const response = await apiFn()

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    return await response.json() as T
  }, {
    ...config,
    timeout: config.timeout || 15000, // 15s for external APIs
  })

  return result
}

