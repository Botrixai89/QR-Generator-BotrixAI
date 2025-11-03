/**
 * Sentry Client Configuration
 * Error tracking and performance monitoring for client-side code
 */

import * as Sentry from '@sentry/nextjs'

// Only initialize Sentry if DSN is provided
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enable capturing of unhandled promise rejections
  captureUnhandledRejections: true,
  
  // Set environment
  environment: process.env.NODE_ENV || 'development',
  
  // Enable session replay (optional, can impact performance)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
  
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
  
  // Integrate with logging correlation IDs
  integrations: [
    new Sentry.BrowserTracing({
      // Set tracing origins to track performance
      tracePropagationTargets: ['localhost', /^\//],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  })
}

