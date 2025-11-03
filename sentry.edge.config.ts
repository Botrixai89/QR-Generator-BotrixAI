/**
 * Sentry Edge Configuration
 * Error tracking for edge runtime code
 */

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is provided
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
  
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  environment: process.env.NODE_ENV || 'development',
  
  beforeSend(event, hint) {
    // Filter PII from events (same as server config)
    if (event.request) {
      if (event.request.url) {
        event.request.url = event.request.url.replace(
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
          '[EMAIL_REDACTED]'
        )
      }
      
      if (event.request.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key']
        sensitiveHeaders.forEach(header => {
          if (event.request?.headers?.[header]) {
            event.request.headers[header] = '[REDACTED]'
          }
        })
      }
    }
    
    return event
  },
  })
}

