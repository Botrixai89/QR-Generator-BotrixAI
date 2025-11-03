import { NextRequest, NextResponse } from 'next/server'
import { verifyApiKey, hasScope, type ApiKeyData } from './api-keys'

export interface ApiAuthContext {
  apiKey: ApiKeyData
  userId: string
  organizationId: string | null
}

// Middleware to authenticate API requests using API keys
export async function authenticateApiRequest(
  request: NextRequest,
  requiredScopes: string[] = []
): Promise<{ success: true; context: ApiAuthContext } | { success: false; response: NextResponse }> {
  // Get API key from Authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Missing or invalid Authorization header' },
        { status: 401 }
      ),
    }
  }

  const key = authHeader.substring(7) // Remove 'Bearer ' prefix

  // Verify the API key
  const verification = await verifyApiKey(key)
  if (!verification) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or expired API key' },
        { status: 401 }
      ),
    }
  }

  // Check required scopes
  for (const scope of requiredScopes) {
    if (!hasScope(verification.apiKey, scope)) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Forbidden', message: `Missing required scope: ${scope}` },
          { status: 403 }
        ),
      }
    }
  }

  return {
    success: true,
    context: {
      apiKey: verification.apiKey,
      userId: verification.userId,
      organizationId: verification.organizationId,
    },
  }
}

// Helper to extract API key from request for usage logging
export function getApiKeyFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

