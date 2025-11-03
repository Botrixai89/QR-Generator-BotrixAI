import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const rawSupabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && !!parsed.hostname
  } catch {
    return false
  }
}

const hasValidPublicConfig = Boolean(rawSupabaseUrl && rawSupabaseAnonKey && isValidUrl(rawSupabaseUrl))

if ((!rawSupabaseUrl || !rawSupabaseAnonKey) && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}
if (rawSupabaseUrl && !isValidUrl(rawSupabaseUrl)) {
  console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL. Ensure it is a full https URL like https://xxx.supabase.co')
}

// Client for client-side operations (with RLS). Guard creation to avoid throwing on malformed URL during import.
export const supabase = hasValidPublicConfig
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey)
  : null

// Admin client for server-side operations (bypasses RLS)
// Only create this on the server side to avoid exposing the service role key
export const supabaseAdmin = typeof window === 'undefined'
  ? (() => {
      if (!hasValidPublicConfig) return null
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
      if (!serviceKey) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will not work.')
        }
        return null
      }
      return createClient(rawSupabaseUrl, serviceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
    })()
  : null

// Safe accessors for on-demand initialization or explicit checks
export function getSupabaseClient() {
  if (!hasValidPublicConfig) {
    throw new Error('Supabase client not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  return supabase ?? createClient(rawSupabaseUrl, rawSupabaseAnonKey)
}

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') return null
  if (!hasValidPublicConfig) return null
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!serviceKey) return null
  return supabaseAdmin ?? createClient(rawSupabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
