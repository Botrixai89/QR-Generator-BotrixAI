/**
 * Standardized API Error Handling
 * Provides consistent error responses across all API routes
 */

import { NextResponse } from 'next/server'

/**
 * Standard error codes used throughout the application
 */
export enum ApiErrorCode {
  // Authentication & Authorization (40x)
  UNAUTHORIZED = 'unauthorized',
  INVALID_CREDENTIALS = 'invalid_credentials',
  TOKEN_EXPIRED = 'token_expired',
  SESSION_EXPIRED = 'session_expired',
  FORBIDDEN = 'forbidden',
  ACCOUNT_DEACTIVATED = 'account_deactivated',
  EMAIL_NOT_VERIFIED = 'email_not_verified',
  
  // Resource Errors (40x)
  NOT_FOUND = 'not_found',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  USER_NOT_FOUND = 'user_not_found',
  QR_CODE_NOT_FOUND = 'qr_code_not_found',
  
  // Validation Errors (400)
  VALIDATION_ERROR = 'validation_error',
  INVALID_INPUT = 'invalid_input',
  MISSING_REQUIRED_FIELD = 'missing_required_field',
  INVALID_FORMAT = 'invalid_format',
  INVALID_FILE_TYPE = 'invalid_file_type',
  FILE_TOO_LARGE = 'file_too_large',
  
  // Business Logic Errors (402, 403)
  INSUFFICIENT_CREDITS = 'no_credits',
  PLAN_LIMIT_REACHED = 'plan_limit',
  FEATURE_NOT_ALLOWED = 'feature_not_allowed',
  QUOTA_EXCEEDED = 'quota_exceeded',
  
  // Rate Limiting (429)
  RATE_LIMITED = 'rate_limited',
  TOO_MANY_REQUESTS = 'too_many_requests',
  
  // Server Errors (50x)
  INTERNAL_ERROR = 'internal_error',
  DATABASE_ERROR = 'database_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  TIMEOUT = 'timeout',
  
  // Payment Errors (402)
  PAYMENT_REQUIRED = 'payment_required',
  PAYMENT_FAILED = 'payment_failed',
  INVALID_PAYMENT_METHOD = 'invalid_payment_method',
  
  // Conflict Errors (409)
  ALREADY_EXISTS = 'already_exists',
  DUPLICATE_ENTRY = 'duplicate_entry',
  CONFLICT = 'conflict',
}

/**
 * HTTP Status codes mapping
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  error: {
    code: string
    message: string
    details?: unknown
    field?: string
    timestamp?: string
    correlationId?: string
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode
  public readonly statusCode: number
  public readonly details?: unknown
  public readonly field?: string
  public readonly isOperational: boolean

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    details?: unknown,
    field?: string,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.field = field
    this.isOperational = isOperational

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
  }

  /**
   * Convert error to standardized API response
   */
  toResponse(correlationId?: string): NextResponse<ApiErrorResponse> {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: this.code,
        message: this.message,
        timestamp: new Date().toISOString(),
      },
    }

    if (this.details !== undefined) {
      errorResponse.error.details = this.details
    }

    if (this.field) {
      errorResponse.error.field = this.field
    }

    if (correlationId) {
      errorResponse.error.correlationId = correlationId
    }

    return NextResponse.json(errorResponse, { status: this.statusCode })
  }
}

/**
 * Predefined error factories for common cases
 */
export const ApiErrors = {
  // Authentication errors
  unauthorized: (message = 'Authentication required') =>
    new ApiError(ApiErrorCode.UNAUTHORIZED, message, HTTP_STATUS.UNAUTHORIZED),

  invalidCredentials: (message = 'Invalid email or password') =>
    new ApiError(ApiErrorCode.INVALID_CREDENTIALS, message, HTTP_STATUS.UNAUTHORIZED),

  tokenExpired: (message = 'Authentication token has expired') =>
    new ApiError(ApiErrorCode.TOKEN_EXPIRED, message, HTTP_STATUS.UNAUTHORIZED),

  sessionExpired: (message = 'Your session has expired. Please sign in again.') =>
    new ApiError(ApiErrorCode.SESSION_EXPIRED, message, HTTP_STATUS.UNAUTHORIZED),

  forbidden: (message = 'You do not have permission to perform this action') =>
    new ApiError(ApiErrorCode.FORBIDDEN, message, HTTP_STATUS.FORBIDDEN),

  accountDeactivated: (message = 'Your account has been deactivated') =>
    new ApiError(ApiErrorCode.ACCOUNT_DEACTIVATED, message, HTTP_STATUS.FORBIDDEN),

  emailNotVerified: (message = 'Please verify your email address') =>
    new ApiError(ApiErrorCode.EMAIL_NOT_VERIFIED, message, HTTP_STATUS.FORBIDDEN),

  // Resource errors
  notFound: (resource = 'Resource', id?: string) =>
    new ApiError(
      ApiErrorCode.NOT_FOUND,
      id ? `${resource} with ID '${id}' not found` : `${resource} not found`,
      HTTP_STATUS.NOT_FOUND
    ),

  userNotFound: (userId?: string) =>
    new ApiError(
      ApiErrorCode.USER_NOT_FOUND,
      userId ? `User '${userId}' not found` : 'User not found',
      HTTP_STATUS.NOT_FOUND
    ),

  qrCodeNotFound: (qrCodeId?: string) =>
    new ApiError(
      ApiErrorCode.QR_CODE_NOT_FOUND,
      qrCodeId ? `QR code '${qrCodeId}' not found` : 'QR code not found',
      HTTP_STATUS.NOT_FOUND
    ),

  // Validation errors
  validationError: (message: string, details?: unknown, field?: string) =>
    new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      message,
      HTTP_STATUS.BAD_REQUEST,
      details,
      field
    ),

  invalidInput: (field: string, message?: string) =>
    new ApiError(
      ApiErrorCode.INVALID_INPUT,
      message || `Invalid input for field '${field}'`,
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      field
    ),

  missingField: (field: string) =>
    new ApiError(
      ApiErrorCode.MISSING_REQUIRED_FIELD,
      `Required field '${field}' is missing`,
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      field
    ),

  invalidFormat: (field: string, expectedFormat: string) =>
    new ApiError(
      ApiErrorCode.INVALID_FORMAT,
      `Invalid format for '${field}'. Expected: ${expectedFormat}`,
      HTTP_STATUS.BAD_REQUEST,
      undefined,
      field
    ),

  invalidFileType: (allowedTypes: string[]) =>
    new ApiError(
      ApiErrorCode.INVALID_FILE_TYPE,
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    ),

  fileTooLarge: (maxSize: string) =>
    new ApiError(
      ApiErrorCode.FILE_TOO_LARGE,
      `File size exceeds maximum allowed size of ${maxSize}`,
      HTTP_STATUS.BAD_REQUEST
    ),

  // Business logic errors
  insufficientCredits: (required = 1, available = 0) =>
    new ApiError(
      ApiErrorCode.INSUFFICIENT_CREDITS,
      `Insufficient credits. Required: ${required}, Available: ${available}`,
      HTTP_STATUS.PAYMENT_REQUIRED,
      { required, available }
    ),

  planLimitReached: (feature: string, limit: number) =>
    new ApiError(
      ApiErrorCode.PLAN_LIMIT_REACHED,
      `Plan limit reached for '${feature}'. Maximum: ${limit}`,
      HTTP_STATUS.FORBIDDEN,
      { feature, limit }
    ),

  featureNotAllowed: (feature: string, requiredPlan?: string) =>
    new ApiError(
      ApiErrorCode.FEATURE_NOT_ALLOWED,
      requiredPlan
        ? `Feature '${feature}' requires ${requiredPlan} plan`
        : `Feature '${feature}' is not available on your plan`,
      HTTP_STATUS.FORBIDDEN,
      { feature, requiredPlan }
    ),

  quotaExceeded: (quota: string, limit: number) =>
    new ApiError(
      ApiErrorCode.QUOTA_EXCEEDED,
      `Quota exceeded for '${quota}'. Limit: ${limit}`,
      HTTP_STATUS.FORBIDDEN,
      { quota, limit }
    ),

  // Rate limiting
  rateLimited: (retryAfter?: number) =>
    new ApiError(
      ApiErrorCode.RATE_LIMITED,
      retryAfter
        ? `Rate limit exceeded. Please try again in ${retryAfter} seconds`
        : 'Rate limit exceeded. Please try again later',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      { retryAfter }
    ),

  // Server errors
  internalError: (message = 'An unexpected error occurred', details?: unknown) =>
    new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details,
      undefined,
      false // Not operational
    ),

  databaseError: (message = 'Database operation failed', details?: unknown) =>
    new ApiError(
      ApiErrorCode.DATABASE_ERROR,
      message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details,
      undefined,
      false
    ),

  externalServiceError: (service: string, details?: unknown) =>
    new ApiError(
      ApiErrorCode.EXTERNAL_SERVICE_ERROR,
      `External service '${service}' is unavailable`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      details,
      undefined,
      false
    ),

  timeout: (operation: string, timeoutMs: number) =>
    new ApiError(
      ApiErrorCode.TIMEOUT,
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      { operation, timeoutMs }
    ),

  // Payment errors
  paymentRequired: (message = 'Payment is required to access this resource') =>
    new ApiError(ApiErrorCode.PAYMENT_REQUIRED, message, HTTP_STATUS.PAYMENT_REQUIRED),

  paymentFailed: (reason?: string) =>
    new ApiError(
      ApiErrorCode.PAYMENT_FAILED,
      reason || 'Payment processing failed',
      HTTP_STATUS.PAYMENT_REQUIRED,
      { reason }
    ),

  // Conflict errors
  alreadyExists: (resource: string, identifier?: string) =>
    new ApiError(
      ApiErrorCode.ALREADY_EXISTS,
      identifier
        ? `${resource} '${identifier}' already exists`
        : `${resource} already exists`,
      HTTP_STATUS.CONFLICT,
      { resource, identifier }
    ),

  conflict: (message: string, details?: unknown) =>
    new ApiError(ApiErrorCode.CONFLICT, message, HTTP_STATUS.CONFLICT, details),
}

/**
 * Error handler utility for API routes
 */
export function handleApiError(error: unknown, correlationId?: string): NextResponse {
  // If it's already an ApiError, convert to response
  if (error instanceof ApiError) {
    return error.toResponse(correlationId)
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    console.error('Unexpected error:', error)
    return ApiErrors.internalError(
      process.env.NODE_ENV === 'development' ? error.message : undefined,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
    ).toResponse(correlationId)
  }

  // Handle unknown error types
  console.error('Unknown error type:', error)
  return ApiErrors.internalError().toResponse(correlationId)
}

/**
 * Success response helper
 */
export function successResponse<T>(data: T, status: number = HTTP_STATUS.OK): NextResponse<T> {
  return NextResponse.json(data, { status })
}

/**
 * Created response helper
 */
export function createdResponse<T>(data: T): NextResponse<T> {
  return NextResponse.json(data, { status: HTTP_STATUS.CREATED })
}

/**
 * No content response helper
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: HTTP_STATUS.NO_CONTENT })
}

