/**
 * Supabase Client with Retry and Circuit Breaker
 * Wraps Supabase calls with retry logic, timeouts, and circuit breaker protection
 */

import { supabaseAdmin } from "@/lib/supabase"
import { supabaseQuery } from "./supabase-client"

/**
 * Execute Supabase query with retry, timeout, and circuit breaker
 */
export async function supabaseWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: {
    timeout?: number
    maxRetries?: number
    useCircuitBreaker?: boolean
  } = {}
): Promise<T> {
  return await supabaseQuery(queryFn, options)
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
      eq: async (column: string, value: any): Promise<T | null> => {
        return await supabaseWithRetry(
          () => supabaseAdmin!.from(table).select(columns).eq(column, value).maybeSingle(),
          options
        )
      },
      single: async (): Promise<T> => {
        return await supabaseWithRetry(
          () => supabaseAdmin!.from(table).select(columns).single(),
          options
        )
      },
      all: async (): Promise<T[]> => {
        return await supabaseWithRetry(
          async () => {
            const { data, error } = await supabaseAdmin!.from(table).select(columns)
            if (error) throw error
            return { data: data || [], error: null }
          },
          options
        )
      },
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async (): Promise<T> => {
          return await supabaseWithRetry(
            () => supabaseAdmin!.from(table).insert(data).select().single(),
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
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async (): Promise<T> => {
            return await supabaseWithRetry(
              () => supabaseAdmin!.from(table).update(data).eq(column, value).select().single(),
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
      eq: async (column: string, value: any): Promise<void> => {
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

