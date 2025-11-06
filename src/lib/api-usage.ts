import { NextRequest, NextResponse } from 'next/server'
import { recordApiUsage } from './api-keys'

// Middleware wrapper to record API usage
export function withUsageMetering(
  handler: (
    request: NextRequest,
    context: unknown,
    authContext: { apiKeyId: string; userId: string; organizationId: string | null }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: unknown) => {
    const startTime = Date.now()
    let statusCode = 500
    let requestSize = 0
    let responseSize = 0

    // Get request size
    try {
      const body = await request.clone().text()
      requestSize = new Blob([body]).size
    } catch {
      // Ignore errors
    }

    // Get API key from request
    const authHeader = request.headers.get('authorization')
    const key = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!key) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Import here to avoid circular dependencies
    const { verifyApiKey } = await import('./api-keys')
    const verification = await verifyApiKey(key)

    if (!verification) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authContext = {
      apiKeyId: verification.apiKey.id,
      userId: verification.userId,
      organizationId: verification.organizationId,
    }

    // Call the handler
    let response: NextResponse
    try {
      response = await handler(request, context, authContext)
      statusCode = response.status
    } catch {
      statusCode = 500
      response = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Get response size
    try {
      const responseText = await response.clone().text()
      responseSize = new Blob([responseText]).size
    } catch {
      // Ignore errors
    }

    // Extract endpoint from URL
    const url = new URL(request.url)
    const endpoint = url.pathname

    // Record usage asynchronously (don't block response)
    recordApiUsage(
      authContext.apiKeyId,
      authContext.userId,
      authContext.organizationId,
      endpoint,
      request.method,
      statusCode,
      requestSize,
      responseSize,
      responseTime,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    ).catch((error) => {
      // Don't fail if usage logging fails
      console.error('Failed to record API usage:', error)
    })

    return response
  }
}

