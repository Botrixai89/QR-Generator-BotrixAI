/**
 * Supabase Client Wrapper
 * Adds retry logic, timeouts, and circuit breaker protection
 */

import { supabaseAdmin } from "@/lib/supabase"
import { retryWithTimeout, supabaseQueryWithRetry } from "./retry-with-timeout"
import { getCircuitBreaker } from "./circuit-breaker"

/**
 * Supabase query with retry, timeout, and circuit breaker
 */
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    timeout?: number
    maxRetries?: number
    useCircuitBreaker?: boolean
  } = {}
): Promise<T> {
  const { timeout = 30000, maxRetries = 3, useCircuitBreaker = true } = options

  const executeQuery = async () => {
    return await supabaseQueryWithRetry(queryFn, {
      timeout,
      maxRetries,
    })
  }

  if (useCircuitBreaker) {
    const circuitBreaker = getCircuitBreaker('supabase', {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
    })

    return await circuitBreaker.execute(executeQuery, async () => {
      throw new Error('Supabase circuit breaker is OPEN - service unavailable')
    })
  }

  return await executeQuery()
}

/**
 * Supabase insert with retry and timeout
 */
export async function supabaseInsert<T>(
  table: string,
  data: any,
  options: { timeout?: number; maxRetries?: number } = {}
): Promise<T> {
  return await supabaseQuery(
    () => supabaseAdmin!.from(table).insert(data).select().single(),
    options
  )
}

/**
 * Supabase update with retry and timeout
 */
export async function supabaseUpdate<T>(
  table: string,
  data: any,
  filter: Record<string, any>,
  options: { timeout?: number; maxRetries?: number } = {}
): Promise<T> {
  let query = supabaseAdmin!.from(table).update(data)

  for (const [key, value] of Object.entries(filter)) {
    query = query.eq(key, value)
  }

  return await supabaseQuery(
    () => query.select().single(),
    options
  )
}

/**
 * Supabase delete with retry and timeout
 */
export async function supabaseDelete(
  table: string,
  filter: Record<string, any>,
  options: { timeout?: number; maxRetries?: number } = {}
): Promise<void> {
  await supabaseQuery(
    async () => {
      let query = supabaseAdmin!.from(table).delete()

      for (const [key, value] of Object.entries(filter)) {
        query = query.eq(key, value)
      }

      const { error } = await query
      return { data: null, error }
    },
    options
  )
}

