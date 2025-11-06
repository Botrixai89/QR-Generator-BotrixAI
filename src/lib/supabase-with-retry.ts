/**
 * Supabase Client with Retry and Circuit Breaker
 * Wraps Supabase calls with retry logic, timeouts, and circuit breaker protection
 */

import { supabaseAdmin } from "@/lib/supabase"
import { supabaseQuery } from "./supabase-client"
import { retryWithTimeout } from "./retry-with-timeout"
import { getCircuitBreaker } from "./circuit-breaker"

/**
 * Execute Supabase query with retry, timeout, and circuit breaker
 */
export async function supabaseWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>,
  options: {
    timeout?: number
    maxRetries?: number
    useCircuitBreaker?: boolean
  } = {}
): Promise<T> {
  return await supabaseQuery(queryFn, options)
}

/**
 * Execute Supabase query with retry that can return null (for maybeSingle)
 */
async function supabaseQueryMaybe<T>(
  queryFn: () => Promise<{ data: T | null; error: { message?: string; code?: string } | null }>,
  options: {
    timeout?: number
    maxRetries?: number
    useCircuitBreaker?: boolean
  } = {}
): Promise<T | null> {
  const { timeout = 30000, maxRetries = 3, useCircuitBreaker = true } = options

  const executeQuery = async (): Promise<T | null> => {
    const result = await retryWithTimeout(async () => {
      const { data, error } = await queryFn()
      
      if (error) {
        throw new Error(`Supabase query failed: ${error.message || 'Unknown error'}`)
      }
      
      // Allow null for maybeSingle - no record found is valid
      return data
    }, {
      timeout,
      maxRetries,
    })
    return result
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
 * Supabase from() wrapper with retry
 */
export function createSupabaseQuery<T>(
  table: string,
  options: {
    timeout?: number
    maxRetries?: number
    useCircuitBreaker?: boolean
  } = {}
) {
  return {
    select: (columns: string = '*') => ({
      eq: async (column: string, value: unknown): Promise<T | null> => {
        return await supabaseQueryMaybe(
          async () => {
            const { data, error } = await supabaseAdmin!.from(table).select(columns).eq(column, value).maybeSingle()
            return {
              data: data as T | null,
              error: error ? { message: error.message, code: error.code } : null
            }
          },
          options
        )
      },
      single: async (): Promise<T> => {
        return await supabaseWithRetry(
          async () => {
            const { data, error } = await supabaseAdmin!.from(table).select(columns).single()
            return {
              data: data as T | null,
              error: error ? { message: error.message, code: error.code } : null
            }
          },
          options
        )
      },
      all: async (): Promise<T[]> => {
        return await supabaseWithRetry<T[]>(
          async () => {
            const { data, error } = await supabaseAdmin!.from(table).select(columns)
            return {
              data: (data || []) as T[] | null,
              error: error ? { message: error.message, code: error.code } : null
            }
          },
          options
        )
      },
    }),
    insert: (data: Record<string, unknown>) => ({
      select: () => ({
        single: async (): Promise<T> => {
          return await supabaseWithRetry(
            async () => {
              const { data: insertedData, error } = await supabaseAdmin!.from(table).insert(data).select().single()
              return {
                data: insertedData as T | null,
                error: error ? { message: error.message, code: error.code } : null
              }
            },
            options
          )
        },
        execute: async (): Promise<void> => {
          await supabaseWithRetry(
            async () => {
              const { error } = await supabaseAdmin!.from(table).insert(data)
              if (error) throw error
              return { data: null, error: null }
            },
            options
          )
        },
      }),
    }),
    update: (data: Record<string, unknown>) => ({
      eq: (column: string, value: unknown) => ({
        select: () => ({
          single: async (): Promise<T> => {
            return await supabaseWithRetry(
              async () => {
                const { data: updatedData, error } = await supabaseAdmin!.from(table).update(data).eq(column, value).select().single()
                return {
                  data: updatedData as T | null,
                  error: error ? { message: error.message, code: error.code } : null
                }
              },
              options
            )
          },
          execute: async (): Promise<void> => {
            await supabaseWithRetry(
              async () => {
                const { error } = await supabaseAdmin!.from(table).update(data).eq(column, value)
                if (error) throw error
                return { data: null, error: null }
              },
              options
            )
          },
        }),
      }),
    }),
    delete: () => ({
      eq: async (column: string, value: unknown): Promise<void> => {
        await supabaseWithRetry(
          async () => {
            const { error } = await supabaseAdmin!.from(table).delete().eq(column, value)
            if (error) throw error
            return { data: null, error: null }
          },
          options
        )
      },
    }),
  }
}

