import { withAuth } from "next-auth/middleware"
import { NextRequest, NextResponse } from "next/server"
import { addSecurityHeaders } from "@/lib/security-headers"
import { handleCustomDomainRequest } from "@/lib/domain-routing"
import { getCorrelationIdFromRequest } from "@/lib/logging"

async function handleRequest(req: NextRequest) {
  // Generate or extract correlation ID
  const correlationId = getCorrelationIdFromRequest(req)
  
  // Check if request is from a custom domain
  const host = req.headers.get('host') || ''
  const pathname = req.nextUrl.pathname
  
  // Skip API routes, static files, and known domains
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/i) ||
    host.includes('localhost') ||
    host.includes('127.0.0.1') ||
    host.includes('vercel.app') ||
    host.includes('localhost:')
  ) {
    // Standard middleware behavior
    const response = NextResponse.next()
    // Add correlation ID to response headers
    response.headers.set('x-correlation-id', correlationId)
    return addSecurityHeaders(response, req)
  }
  
  // Check if host matches a custom domain
  // Extract base domain (remove port if present)
  const baseHost = host.split(':')[0]
  
  // Try to handle as custom domain
  try {
    const customDomainResponse = await handleCustomDomainRequest(req, baseHost, pathname)
    if (customDomainResponse) {
      return addSecurityHeaders(customDomainResponse, req)
    }
  } catch (error) {
    console.error('Error handling custom domain request:', error)
    // Fall through to standard middleware
  }
  
  // Standard middleware behavior for non-custom domains
  const response = NextResponse.next()
  // Add correlation ID to response headers
  response.headers.set('x-correlation-id', correlationId)
  return addSecurityHeaders(response, req)
}

export default withAuth(
  function middleware(req) {
    // Handle custom domain routing first
    return handleRequest(req)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith("/dashboard")) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ]
}
