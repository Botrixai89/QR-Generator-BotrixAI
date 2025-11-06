/**
 * Sentry Server Configuration
 * Error tracking and performance monitoring for server-side code
 */

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is provided
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
  
  // Adjust this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Filter out sensitive data
  beforeSend(event, hint) {
    // Filter PII from events
    if (event.request) {
      // Mask email addresses in URLs
      if (event.request.url) {
        event.request.url = event.request.url.replace(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
          '[EMAIL_REDACTED]'
        )
      }
      
      // Mask sensitive headers
      if (event.request.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-forwarded-for']
        sensitiveHeaders.forEach(header => {
          if (event.request?.headers?.[header]) {
            event.request.headers[header] = '[REDACTED]'
          }
        })
      }
      
      // Mask sensitive data in body
      if (event.request.data && typeof event.request.data === 'object') {
        const sensitiveFields = ['password', 'email', 'apiKey', 'token', 'secret']
        const maskSensitiveData = (obj: any): any => {
          if (typeof obj !== 'object' || obj === null) return obj
          if (Array.isArray(obj)) return obj.map(maskSensitiveData)
          
          const masked: any = {}
          for (const [key, value] of Object.entries(obj)) {
            if (sensitiveFields.includes(key.toLowerCase())) {
              masked[key] = '[REDACTED]'
            } else if (typeof value === 'object' && value !== null) {
              masked[key] = maskSensitiveData(value)
            } else {
              masked[key] = value
            }
          }
          return masked
        }
        event.request.data = maskSensitiveData(event.request.data)
      }
    }
    
    return event
  },
  })
}

