/**
 * CSRF Protection Utilities
 * Implements CSRF token generation and validation for state-changing operations
 */

import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CSRF_TOKEN_COOKIE = 'csrf-token'
const CSRF_HEADER = 'X-CSRF-Token'

/**
 * Generates a secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Sets CSRF token in cookie
 */
export async function setCsrfToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
    path: '/',
  })
}

/**
 * Gets CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null
}

/**
 * Validates CSRF token from request
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value

  if (!cookieToken) {
    return false
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER)

  if (!headerToken) {
    return false
  }

  // Compare tokens (constant-time comparison)
  return constantTimeEquals(cookieToken, headerToken)
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

/**
 * Middleware to require CSRF token for state-changing operations
 */
export async function requireCsrfToken(
  request: NextRequest
): Promise<{ valid: true } | { valid: false; response: NextResponse }> {
  // Only enforce for POST, PUT, PATCH, DELETE methods
  const method = request.method
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return { valid: true }
  }

  const isValid = await validateCsrfToken(request)

  if (!isValid) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'CSRF token validation failed', message: 'Invalid or missing CSRF token' },
        { status: 403 }
      ),
    }
  }

  return { valid: true }
}

/**
 * API endpoint to get CSRF token
 */
export async function getCsrfTokenEndpoint(): Promise<NextResponse> {
  const token = generateCsrfToken()
  await setCsrfToken(token)

  return NextResponse.json({ csrfToken: token })
}

