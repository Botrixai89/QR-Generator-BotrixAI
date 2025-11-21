/**
 * Test Database Utilities
 * Helper functions for test database operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if Supabase is configured (allow http://localhost for local testing)
function isValidSupabaseUrl(url: string): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    // Allow https URLs or localhost for testing
    return (parsed.protocol === 'https:' || parsed.hostname === 'localhost') && !!parsed.hostname
  } catch {
    return false
  }
}

const hasValidConfig = Boolean(supabaseUrl && supabaseServiceKey && isValidSupabaseUrl(supabaseUrl))

export const testSupabase = hasValidConfig && supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Cache for Supabase availability check
let supabaseAvailabilityCache: boolean | null = null

// Helper to check if Supabase is available (with connection check)
export async function isSupabaseAvailable(): Promise<boolean> {
  if (!hasValidConfig || !testSupabase) {
    return false
  }
  
  // If we've already checked, return cached result
  if (supabaseAvailabilityCache !== null) {
    return supabaseAvailabilityCache
  }
  
  // Try a simple query to check if Supabase is reachable
  try {
    const { error } = await testSupabase.from('User').select('id').limit(1)
    // If we get a response (even with an error about missing table), Supabase is reachable
    // Only fail if it's a network/connection error
    const isAvailable = error === null || (error.code !== 'PGRST301' && !error.message.includes('fetch failed'))
    supabaseAvailabilityCache = isAvailable
    return isAvailable
  } catch (err: any) {
    // Network errors mean Supabase is not available
    if (err?.message?.includes('fetch failed') || err?.code === 'ECONNREFUSED') {
      supabaseAvailabilityCache = false
      return false
    }
    // Other errors might mean Supabase is available but there's a different issue
    supabaseAvailabilityCache = true
    return true
  }
}

// Helper to check if Supabase is configured (synchronous check for skipIf)
// This is a best-effort check - actual availability is checked asynchronously in tests
export function isSupabaseConfigured(): boolean {
  if (!hasValidConfig || !testSupabase) {
    return false
  }
  
  // In CI, if we're using default test values, assume Supabase isn't available
  // This prevents tests from running when secrets aren't configured
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true'
  const isDefaultTestKey = supabaseServiceKey === 'test-service-role-key' || 
                           supabaseServiceKey === 'test-anon-key' ||
                           !supabaseServiceKey ||
                           supabaseServiceKey.length < 20 // Real keys are much longer
  
  // If in CI and using default/placeholder test values, Supabase is likely not available
  // Only skip if we're clearly using test defaults, not real secrets
  if (isCI && isDefaultTestKey) {
    return false
  }
  
  return true
}

/**
 * Get a test user by email
 */
export async function getTestUser(email: string) {
  if (!testSupabase) {
    throw new Error('Supabase not configured for tests. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  
  const { data, error } = await testSupabase
    .from('User')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = not found
    throw error
  }
  
  return data
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: {
  email?: string
  name?: string
  plan?: string
  credits?: number
} = {}) {
  if (!testSupabase) {
    throw new Error('Supabase not configured for tests. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  
  const email = overrides.email || `test-${Date.now()}@example.com`
  const name = overrides.name || 'Test User'
  const plan = overrides.plan || 'FREE'
  const credits = overrides.credits ?? 10
  
  const { data, error } = await testSupabase
    .from('User')
    .insert({
      email,
      name,
      plan,
      credits,
      emailVerified: new Date().toISOString(), // emailVerified is a timestamp, not boolean
      // createdAt and updatedAt have DEFAULT NOW() in the schema, so we don't need to set them
    })
    .select()
    .single()
  
  if (error) {
    throw error
  }
  
  return data
}

/**
 * Get user's current credits
 */
export async function getUserCredits(userId: string): Promise<number> {
  if (!testSupabase) {
    throw new Error('Supabase not configured for tests. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  
  const { data, error } = await testSupabase
    .from('User')
    .select('credits')
    .eq('id', userId)
    .single()
  
  if (error) {
    throw error
  }
  
  return data?.credits || 0
}

/**
 * Get QR codes for a user
 */
export async function getUserQRCodes(userId: string) {
  if (!testSupabase) {
    throw new Error('Supabase not configured for tests. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  
  const { data, error } = await testSupabase
    .from('QrCode')
    .select('*')
    .eq('userId', userId)
  
  if (error) {
    throw error
  }
  
  return data || []
}

/**
 * Get QR code by ID
 */
export async function getQRCode(qrCodeId: string) {
  if (!testSupabase) {
    throw new Error('Supabase not configured for tests. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }
  
  const { data, error } = await testSupabase
    .from('QrCode')
    .select('*')
    .eq('id', qrCodeId)
    .single()
  
  if (error && error.code !== 'PGRST116') {
    throw error
  }
  
  return data
}

/**
 * Clean up test data (delete test user and their QR codes)
 */
export async function cleanupTestUser(userId: string) {
  if (!testSupabase) {
    return // Silently skip cleanup if Supabase not configured
  }
  
  // Delete QR codes first (foreign key constraint)
  await testSupabase
    .from('QrCode')
    .delete()
    .eq('userId', userId)
  
  // Delete user
  await testSupabase
    .from('User')
    .delete()
    .eq('id', userId)
}

