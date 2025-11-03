import { NextRequest, NextResponse } from 'next/server'
import { generateCsrfToken, setCsrfToken } from '@/lib/csrf'
import { addSecurityHeaders } from '@/lib/security-headers'

/**
 * GET /api/security/csrf-token
 * Returns a CSRF token for use in forms and API requests
 */
export async function GET(request: NextRequest) {
  try {
    const token = generateCsrfToken()
    await setCsrfToken(token)

    const response = NextResponse.json({ csrfToken: token })
    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

