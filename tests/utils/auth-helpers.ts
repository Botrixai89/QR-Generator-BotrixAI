/**
 * Authentication Helpers for Tests
 * Utilities for creating test sessions and making authenticated requests
 */

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createTestUser, getTestUser } from './test-db'
import type { User } from 'next-auth'

/**
 * Create a test user and return their session data
 * Note: This is a simplified version - in real tests you'd need to mock NextAuth
 */
export async function createTestSession(overrides: {
  email?: string
  name?: string
  plan?: string
  credits?: number
} = {}) {
  const user = await createTestUser(overrides)
  
  // Return a mock session object that matches NextAuth's session structure
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    } as User & { id: string },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Get session for an existing test user
 */
export async function getTestSession(email: string) {
  const user = await getTestUser(email)
  
  if (!user) {
    throw new Error(`Test user not found: ${email}`)
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    } as User & { id: string },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }
}

/**
 * Create authenticated fetch headers
 * In real tests, you'd need to set up proper cookies/session
 * For now, we'll pass userId in a custom header that the API can use
 */
export function getAuthHeaders(userId: string) {
  return {
    'Content-Type': 'application/json',
    'X-Test-User-Id': userId, // Custom header for test mode
  }
}

