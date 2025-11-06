/**
 * Security Headers Middleware
 * Implements CSP, HSTS, Referrer-Policy, X-Frame-Options, and other security headers
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Adds security headers to a response
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addSecurityHeaders(response: NextResponse, _: NextRequest): NextResponse {
  // Guard against unexpected undefined/invalid responses in error paths
  // If response is missing or doesn't expose headers, return it as-is
  if (!response || !('headers' in response)) {
    return response
  }
  // Content Security Policy
  const isProduction = process.env.NODE_ENV === 'production'
  const csp = [
    "default-src 'self'",
    // Allow Razorpay scripts while keeping strict defaults
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com", // Next.js + Razorpay
    "style-src 'self' 'unsafe-inline'", // Required for CSS-in-JS
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    // Permit API/XHR to Supabase and Razorpay services (api, lumberjack, checkout)
    "connect-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://checkout.razorpay.com https://*.razorpay.com",
    // Allow Razorpay to open iframes (api/checkout domains)
    "frame-src 'self' https://checkout.razorpay.com https://*.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  // Strict Transport Security (HSTS) - only in production
  const hsts = isProduction
    ? 'max-age=31536000; includeSubDomains; preload'
    : 'max-age=0' // Disable in development

  // Set all security headers
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('Strict-Transport-Security', hsts)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Remove X-Powered-By header (handled by Next.js config)
  response.headers.delete('X-Powered-By')

  return response
}

/**
 * Middleware wrapper that adds security headers to all responses
 */
export function withSecurityHeaders(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = await handler(request)
    return addSecurityHeaders(response, request)
  }
}

/**
 * Rate limiting headers
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', resetTime.toString())
  return response
}

