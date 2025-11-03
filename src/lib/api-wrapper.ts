/**
 * API Route Wrapper
 * Provides logging, metrics, and error tracking for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createLoggerFromRequest, Logger } from '@/lib/logging'
import { recordRequestMetric, RequestMetric } from '@/lib/metrics'
import * as Sentry from '@sentry/nextjs'

export interface ApiHandler {
  (request: NextRequest, context: any, logger: Logger): Promise<NextResponse>
}

/**
 * Wrapper for API routes that adds logging, metrics, and error tracking
 */
export function withObservability(
  handler: ApiHandler,
  options?: {
    trackMetrics?: boolean
    trackErrors?: boolean
  }
) {
  return async (request: NextRequest, context: any): Promise<NextResponse> => {
    const startTime = Date.now()
    const logger = createLoggerFromRequest(request, {
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })
    
    const correlationId = logger.getCorrelationId()
    
    try {
      // Set correlation ID in Sentry context
      Sentry.setContext('request', {
        correlationId,
        url: request.url,
        method: request.method,
      })
      
      // Execute handler
      const response = await handler(request, context, logger)
      
      // Calculate response time
      const responseTime = Date.now() - startTime
      
      // Record metrics if enabled
      if (options?.trackMetrics !== false) {
        const requestSize = request.headers.get('content-length') 
          ? parseInt(request.headers.get('content-length') || '0')
          : 0
        
        const responseSize = response.headers.get('content-length')
          ? parseInt(response.headers.get('content-length') || '0')
          : 0
        
        const metric: RequestMetric = {
          correlationId,
          endpoint: new URL(request.url).pathname,
          method: request.method,
          statusCode: response.status,
          responseTime,
          requestSize,
          responseSize,
        }
        
        await recordRequestMetric(metric)
      }
      
      // Log successful request
      logger.info('API request completed', {
        method: request.method,
        endpoint: new URL(request.url).pathname,
        statusCode: response.status,
        responseTime,
      })
      
      // Add correlation ID to response headers
      response.headers.set('x-correlation-id', correlationId)
      
      return response
    } catch (error) {
      const responseTime = Date.now() - startTime
      
      // Log error
      logger.error('API request failed', error instanceof Error ? error : new Error(String(error)), {
        method: request.method,
        endpoint: new URL(request.url).pathname,
        responseTime,
      })
      
      // Send to Sentry if enabled
      if (options?.trackErrors !== false) {
        Sentry.captureException(error, {
          tags: {
            correlationId,
            endpoint: new URL(request.url).pathname,
            method: request.method,
          },
          extra: {
            responseTime,
            url: request.url,
          },
        })
      }
      
      // Record error metric
      if (options?.trackMetrics !== false) {
        const metric: RequestMetric = {
          correlationId,
          endpoint: new URL(request.url).pathname,
          method: request.method,
          statusCode: 500,
          responseTime,
        }
        
        await recordRequestMetric(metric)
      }
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Internal server error',
          correlationId, // Include correlation ID in error response
        },
        { status: 500 }
      )
    }
  }
}

