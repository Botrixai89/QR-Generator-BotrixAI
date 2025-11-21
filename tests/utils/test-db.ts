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

const hasValidConfig = supabaseUrl && supabaseServiceKey && isValidSupabaseUrl(supabaseUrl)

export const testSupabase = hasValidConfig
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Helper to check if Supabase is available
export function isSupabaseConfigured(): boolean {
  return hasValidConfig && testSupabase !== null
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
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

