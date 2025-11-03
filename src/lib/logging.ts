/**
 * Centralized Logging Utility
 * Provides structured logging with correlation IDs and PII masking
 */

// Generate cryptographically strong random bytes across environments (Edge, browser, Node)
function generateRandomBytes(length: number): Uint8Array {
  // Use Web Crypto API in Edge/browsers; never import Node 'crypto' in middleware.
  const anyGlobal = globalThis as any
  if (anyGlobal && anyGlobal.crypto && typeof anyGlobal.crypto.getRandomValues === 'function') {
    const array = new Uint8Array(length)
    anyGlobal.crypto.getRandomValues(array)
    return array
  }
  // Last-resort fallback (non-cryptographic) to avoid runtime errors
  const array = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256)
  }
  return array
}

// PII patterns to mask in logs
const PII_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' }, // Email
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' }, // Credit card
  { pattern: /\b\d{10,}\b/g, replacement: (match: string) => match.length > 10 ? '[PHONE_REDACTED]' : match }, // Phone
  { pattern: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, replacement: '[NAME_REDACTED]' }, // Name pattern
]

export interface LogContext {
  correlationId?: string
  userId?: string
  organizationId?: string
  requestId?: string
  ipAddress?: string
  userAgent?: string
  [key: string]: any
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  timestamp: string
  correlationId: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  metadata?: Record<string, any>
}

/**
 * Generate a correlation ID
 */
export function generateCorrelationId(): string {
  const bytes = generateRandomBytes(16)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Mask PII in a string
 */
export function maskPII(text: string): string {
  let masked = text
  
  for (const { pattern, replacement } of PII_PATTERNS) {
    masked = masked.replace(pattern, typeof replacement === 'function' ? replacement : () => replacement)
  }
  
  return masked
}

/**
 * Mask PII in an object recursively
 */
export function maskPIIInObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string') {
    return maskPII(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskPIIInObject(item))
  }
  
  if (typeof obj === 'object') {
    const masked: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip masking correlation IDs and technical fields
      if (['correlationId', 'requestId', 'timestamp', 'level', 'message'].includes(key)) {
        masked[key] = value
      } else {
        masked[key] = maskPIIInObject(value)
      }
    }
    return masked
  }
  
  return obj
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogEntry['level'],
  message: string,
  context?: LogContext,
  error?: Error,
  metadata?: Record<string, any>
): LogEntry {
  const correlationId = context?.correlationId || generateCorrelationId()
  
  const entry: LogEntry = {
    level,
    message: maskPII(message),
    timestamp: new Date().toISOString(),
    correlationId,
    context: context ? maskPIIInObject(context) : undefined,
    metadata: metadata ? maskPIIInObject(metadata) : undefined,
  }
  
  if (error) {
    entry.error = {
      name: error.name,
      message: maskPII(error.message),
      stack: error.stack ? maskPII(error.stack) : undefined,
    }
  }
  
  return entry
}

/**
 * Logger class with correlation ID support
 */
export class Logger {
  private correlationId: string
  private context: LogContext
  
  constructor(correlationId?: string, context?: LogContext) {
    this.correlationId = correlationId || generateCorrelationId()
    this.context = { ...context, correlationId: this.correlationId }
  }
  
  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    return new Logger(this.correlationId, { ...this.context, ...additionalContext })
  }
  
  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    const entry = createLogEntry('debug', message, this.context, undefined, metadata)
    this.writeLog(entry)
  }
  
  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    const entry = createLogEntry('info', message, this.context, undefined, metadata)
    this.writeLog(entry)
  }
  
  /**
   * Log warning message
   */
  warn(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = createLogEntry('warn', message, this.context, error, metadata)
    this.writeLog(entry)
  }
  
  /**
   * Log error message
   */
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = createLogEntry('error', message, this.context, error, metadata)
    this.writeLog(entry)
  }
  
  /**
   * Log fatal error
   */
  fatal(message: string, error?: Error, metadata?: Record<string, any>): void {
    const entry = createLogEntry('fatal', message, this.context, error, metadata)
    this.writeLog(entry)
  }
  
  /**
   * Write log entry (can be extended to send to external services)
   */
  private writeLog(entry: LogEntry): void {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      const logMethod = entry.level === 'error' || entry.level === 'fatal' 
        ? console.error 
        : entry.level === 'warn' 
        ? console.warn 
        : console.log
      
      logMethod(JSON.stringify(entry, null, 2))
    }
    
    // In production, send to centralized logging service
    // TODO: Integrate with logging service (e.g., Logtail, Datadog, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Send to external logging service
      this.sendToLoggingService(entry)
    }
  }
  
  /**
   * Send log entry to external logging service
   */
  private async sendToLoggingService(entry: LogEntry): Promise<void> {
    // TODO: Implement integration with logging service
    // For now, we'll store critical logs in the database
    if (entry.level === 'error' || entry.level === 'fatal') {
      try {
        const { supabaseAdmin } = await import('@/lib/supabase')
        if (supabaseAdmin) {
          const { error: dbError } = await supabaseAdmin.from('SystemLog').insert({
            level: entry.level,
            message: entry.message,
            correlationId: entry.correlationId,
            context: entry.context,
            error: entry.error,
            metadata: entry.metadata,
            timestamp: entry.timestamp,
          })
          if (dbError) {
            console.error('Failed to write log to database:', dbError)
            console.error('Original log entry:', entry)
          }
        }
      } catch (error) {
        // Fallback to console
        console.error('Failed to initialize logging service:', error)
        console.error('Original log entry:', entry)
      }
    }
  }
  
  /**
   * Get correlation ID
   */
  getCorrelationId(): string {
    return this.correlationId
  }
}

/**
 * Create a logger instance
 */
export function createLogger(correlationId?: string, context?: LogContext): Logger {
  return new Logger(correlationId, context)
}

/**
 * Extract correlation ID from request headers or create a new one
 */
export function getCorrelationIdFromRequest(request: Request): string {
  return request.headers.get('x-correlation-id') || generateCorrelationId()
}

/**
 * Create logger from request (for API routes)
 */
export function createLoggerFromRequest(
  request: Request,
  additionalContext?: LogContext
): Logger {
  const correlationId = getCorrelationIdFromRequest(request)
  const context: LogContext = {
    correlationId,
    ...additionalContext,
  }
  
  return new Logger(correlationId, context)
}

