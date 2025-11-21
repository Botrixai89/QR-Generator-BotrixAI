import { createClient } from '@supabase/supabase-js'

const rawPublicSupabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const rawSupabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

const rawServerSupabaseUrl = (process.env.SUPABASE_URL || '').trim()

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && !!parsed.hostname
  } catch {
    return false
  }
}

const publicSupabaseUrl = rawPublicSupabaseUrl && isValidUrl(rawPublicSupabaseUrl) ? rawPublicSupabaseUrl : ''
const adminSupabaseUrl = (() => {
  if (rawServerSupabaseUrl && isValidUrl(rawServerSupabaseUrl)) {
    return rawServerSupabaseUrl
  }
  if (publicSupabaseUrl) {
    return publicSupabaseUrl
  }
  return ''
})()

const hasValidPublicConfig = Boolean(publicSupabaseUrl && rawSupabaseAnonKey)

if ((!publicSupabaseUrl || !rawSupabaseAnonKey) && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local')
}
if (rawPublicSupabaseUrl && !isValidUrl(rawPublicSupabaseUrl)) {
  console.error('❌ Invalid NEXT_PUBLIC_SUPABASE_URL. Ensure it is a full https URL like https://xxx.supabase.co')
}
if (rawServerSupabaseUrl && !isValidUrl(rawServerSupabaseUrl)) {
  console.error('❌ Invalid SUPABASE_URL. Ensure it is a full https URL like https://xxx.supabase.co')
}
if (!adminSupabaseUrl && process.env.NODE_ENV === 'development') {
  console.warn('⚠️  No valid Supabase URL found for server-side admin client. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.')
}

// Client for client-side operations (with RLS). Guard creation to avoid throwing on malformed URL during import.
export const supabase = hasValidPublicConfig
  ? createClient(publicSupabaseUrl, rawSupabaseAnonKey)
  : null

// Admin client for server-side operations (bypasses RLS)
// Only create this on the server side to avoid exposing the service role key
export const supabaseAdmin = typeof window === 'undefined'
  ? (() => {
      if (!adminSupabaseUrl) return null
      const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
      if (!serviceKey) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing. Admin operations will not work.')
        }
        return null
      }
      return createClient(adminSupabaseUrl, serviceKey, {
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
  return supabase ?? createClient(publicSupabaseUrl, rawSupabaseAnonKey)
}

export function getSupabaseAdmin() {
  if (typeof window !== 'undefined') return null
  if (!adminSupabaseUrl) return null
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!serviceKey) return null
  return supabaseAdmin ?? createClient(adminSupabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
