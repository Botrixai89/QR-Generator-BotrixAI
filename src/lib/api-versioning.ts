/**
 * API Versioning Strategy
 * Handles API version negotiation and routing
 */

import { NextRequest, NextResponse } from 'next/server'

export const API_VERSIONS = ['v1', 'v2'] as const
export type APIVersion = (typeof API_VERSIONS)[number]

export const CURRENT_VERSION: APIVersion = 'v2'
export const DEFAULT_VERSION: APIVersion = 'v1'

/**
 * Get API version from request
 * Checks: 1. URL path, 2. Header, 3. Query param, 4. Default
 */
export function getAPIVersion(request: NextRequest): APIVersion {
  const url = new URL(request.url)
  const pathname = url.pathname

  // 1. Check URL path (/api/v2/qr-codes)
  for (const version of API_VERSIONS) {
    if (pathname.startsWith(`/api/${version}/`)) {
      return version
    }
  }

  // 2. Check Accept-Version header
  const versionHeader = request.headers.get('Accept-Version')
  if (versionHeader && API_VERSIONS.includes(versionHeader as APIVersion)) {
    return versionHeader as APIVersion
  }

  // 3. Check query parameter (?api-version=v2)
  const versionParam = url.searchParams.get('api-version')
  if (versionParam && API_VERSIONS.includes(versionParam as APIVersion)) {
    return versionParam as APIVersion
  }

  // 4. Default version
  return DEFAULT_VERSION
}

/**
 * Add version header to response
 */
export function addVersionHeader(response: NextResponse, version: APIVersion): NextResponse {
  response.headers.set('X-API-Version', version)
  response.headers.set('X-API-Current-Version', CURRENT_VERSION)
  return response
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: APIVersion): boolean {
  // v1 is deprecated but still supported
  return version === 'v1'
}

/**
 * Add deprecation warning header
 */
export function addDeprecationWarning(
  response: NextResponse,
  version: APIVersion,
  sunsetDate?: string
): NextResponse {
  if (isVersionDeprecated(version)) {
    response.headers.set(
      'Warning',
      `299 - "API version ${version} is deprecated. Please migrate to ${CURRENT_VERSION}"`
    )
    
    if (sunsetDate) {
      response.headers.set('Sunset', sunsetDate) // RFC 8594
    }
    
    response.headers.set('Link', `</api/${CURRENT_VERSION}>; rel="successor-version"`)
  }
  
  return response
}

/**
 * Version-aware API route wrapper
 */
export function versionedAPI(handlers: {
  [K in APIVersion]?: (request: NextRequest, context: unknown) => Promise<NextResponse>
}) {
  return async (request: NextRequest, context: unknown): Promise<NextResponse> => {
    const version = getAPIVersion(request)
    const handler = handlers[version]

    if (!handler) {
      return NextResponse.json(
        {
          error: {
            code: 'unsupported_version',
            message: `API version '${version}' is not supported`,
            supportedVersions: API_VERSIONS,
            currentVersion: CURRENT_VERSION,
          },
        },
        { status: 400 }
      )
    }

    const response = await handler(request, context)
    
    // Add version headers
    addVersionHeader(response, version)
    addDeprecationWarning(response, version, '2026-01-01') // v1 sunset date
    
    return response
  }
}

/**
 * Redirect legacy API calls to versioned endpoints
 */
export function redirectToVersioned(
  pathname: string,
  version: APIVersion = CURRENT_VERSION
): string {
  // /api/qr-codes → /api/v2/qr-codes
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/v')) {
    const parts = pathname.split('/')
    parts.splice(2, 0, version) // Insert version after /api/
    return parts.join('/')
  }
  
  return pathname
}

/**
 * Parse Accept header for version preference
 */
export function parseAcceptHeader(accept: string | null): APIVersion | null {
  if (!accept) return null

  // application/vnd.qrgen.v2+json
  const match = accept.match(/application\/vnd\.qrgen\.(v\d+)\+json/)
  if (match && API_VERSIONS.includes(match[1] as APIVersion)) {
    return match[1] as APIVersion
  }

  return null
}

/**
 * Version compatibility checker
 */
export function isVersionCompatible(
  requestedVersion: APIVersion,
  requiredVersion: APIVersion
): boolean {
  const versionNumbers = {
    v1: 1,
    v2: 2,
  }

  return versionNumbers[requestedVersion] >= versionNumbers[requiredVersion]
}

/**
 * Breaking changes per version
 */
export const VERSION_CHANGES = {
  v1: {
    introduced: '2024-01-01',
    deprecated: '2025-06-01',
    sunset: '2026-01-01',
    changes: [
      'Initial API release',
      'Basic QR code CRUD',
      'Simple authentication',
    ],
  },
  v2: {
    introduced: '2025-01-11',
    deprecated: null,
    sunset: null,
    changes: [
      'Standardized error responses',
      'Atomic transactions for QR creation',
      'Enhanced authentication with session management',
      'Caching layer integration',
      'Performance optimizations',
      'Better rate limiting',
    ],
  },
} as const

/**
 * Get version changelog
 */
export function getVersionChangelog(version: APIVersion) {
  return VERSION_CHANGES[version]
}

