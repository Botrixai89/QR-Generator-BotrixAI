/**
 * Tests for Standardized API Error Handling
 */

import { describe, it, expect } from 'vitest'
import { ApiError, ApiErrors, ApiErrorCode, HTTP_STATUS, handleApiError } from '@/lib/api-errors'

describe('ApiError Class', () => {
  it('should create an API error with all properties', () => {
    const error = new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid input',
      HTTP_STATUS.BAD_REQUEST,
      { field: 'email' },
      'email'
    )

    expect(error.code).toBe(ApiErrorCode.VALIDATION_ERROR)
    expect(error.message).toBe('Invalid input')
    expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST)
    expect(error.details).toEqual({ field: 'email' })
    expect(error.field).toBe('email')
    expect(error.isOperational).toBe(true)
  })

  it('should convert to response with correct structure', async () => {
    const error = new ApiError(
      ApiErrorCode.UNAUTHORIZED,
      'Authentication required',
      HTTP_STATUS.UNAUTHORIZED
    )

    const response = error.toResponse('correlation-123')
    const json = await response.json()

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    expect(json).toHaveProperty('error')
    expect(json.error).toHaveProperty('code', ApiErrorCode.UNAUTHORIZED)
    expect(json.error).toHaveProperty('message', 'Authentication required')
    expect(json.error).toHaveProperty('timestamp')
    expect(json.error).toHaveProperty('correlationId', 'correlation-123')
  })

  it('should include details in response if provided', async () => {
    const error = new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      { fields: ['email', 'password'] }
    )

    const response = error.toResponse()
    const json = await response.json()

    expect(json.error.details).toEqual({ fields: ['email', 'password'] })
  })

  it('should mark non-operational errors correctly', () => {
    const error = new ApiError(
      ApiErrorCode.INTERNAL_ERROR,
      'Database connection failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      undefined,
      undefined,
      false // Not operational
    )

    expect(error.isOperational).toBe(false)
  })
})

describe('ApiErrors Factory Functions', () => {
  describe('Authentication Errors', () => {
    it('should create unauthorized error', () => {
      const error = ApiErrors.unauthorized()

      expect(error.code).toBe(ApiErrorCode.UNAUTHORIZED)
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED)
      expect(error.message).toBe('Authentication required')
    })

    it('should create invalid credentials error', () => {
      const error = ApiErrors.invalidCredentials()

      expect(error.code).toBe(ApiErrorCode.INVALID_CREDENTIALS)
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it('should create token expired error', () => {
      const error = ApiErrors.tokenExpired()

      expect(error.code).toBe(ApiErrorCode.TOKEN_EXPIRED)
      expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it('should create forbidden error', () => {
      const error = ApiErrors.forbidden()

      expect(error.code).toBe(ApiErrorCode.FORBIDDEN)
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
    })
  })

  describe('Resource Errors', () => {
    it('should create not found error with resource name', () => {
      const error = ApiErrors.notFound('User', 'user-123')

      expect(error.code).toBe(ApiErrorCode.NOT_FOUND)
      expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND)
      expect(error.message).toContain('user-123')
    })

    it('should create user not found error', () => {
      const error = ApiErrors.userNotFound('user-456')

      expect(error.code).toBe(ApiErrorCode.USER_NOT_FOUND)
      expect(error.message).toContain('user-456')
    })

    it('should create QR code not found error', () => {
      const error = ApiErrors.qrCodeNotFound('qr-789')

      expect(error.code).toBe(ApiErrorCode.QR_CODE_NOT_FOUND)
      expect(error.message).toContain('qr-789')
    })
  })

  describe('Validation Errors', () => {
    it('should create validation error with details', () => {
      const details = { fields: ['email', 'password'] }
      const error = ApiErrors.validationError('Validation failed', details)

      expect(error.code).toBe(ApiErrorCode.VALIDATION_ERROR)
      expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST)
      expect(error.details).toEqual(details)
    })

    it('should create missing field error', () => {
      const error = ApiErrors.missingField('email')

      expect(error.code).toBe(ApiErrorCode.MISSING_REQUIRED_FIELD)
      expect(error.field).toBe('email')
      expect(error.message).toContain('email')
    })

    it('should create invalid format error', () => {
      const error = ApiErrors.invalidFormat('phone', 'XXX-XXX-XXXX')

      expect(error.code).toBe(ApiErrorCode.INVALID_FORMAT)
      expect(error.field).toBe('phone')
      expect(error.message).toContain('phone')
      expect(error.message).toContain('XXX-XXX-XXXX')
    })

    it('should create invalid file type error', () => {
      const allowedTypes = ['image/jpeg', 'image/png']
      const error = ApiErrors.invalidFileType(allowedTypes)

      expect(error.code).toBe(ApiErrorCode.INVALID_FILE_TYPE)
      expect(error.message).toContain('jpeg')
      expect(error.message).toContain('png')
    })

    it('should create file too large error', () => {
      const error = ApiErrors.fileTooLarge('5MB')

      expect(error.code).toBe(ApiErrorCode.FILE_TOO_LARGE)
      expect(error.message).toContain('5MB')
    })
  })

  describe('Business Logic Errors', () => {
    it('should create insufficient credits error', () => {
      const error = ApiErrors.insufficientCredits(5, 2)

      expect(error.code).toBe(ApiErrorCode.INSUFFICIENT_CREDITS)
      expect(error.statusCode).toBe(HTTP_STATUS.PAYMENT_REQUIRED)
      expect(error.details).toEqual({ required: 5, available: 2 })
    })

    it('should create plan limit reached error', () => {
      const error = ApiErrors.planLimitReached('API calls', 1000)

      expect(error.code).toBe(ApiErrorCode.PLAN_LIMIT_REACHED)
      expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN)
      expect(error.details).toEqual({ feature: 'API calls', limit: 1000 })
    })

    it('should create feature not allowed error', () => {
      const error = ApiErrors.featureNotAllowed('Advanced QR', 'PRO')

      expect(error.code).toBe(ApiErrorCode.FEATURE_NOT_ALLOWED)
      expect(error.message).toContain('Advanced QR')
      expect(error.message).toContain('PRO')
    })
  })

  describe('Rate Limiting Errors', () => {
    it('should create rate limited error without retry after', () => {
      const error = ApiErrors.rateLimited()

      expect(error.code).toBe(ApiErrorCode.RATE_LIMITED)
      expect(error.statusCode).toBe(HTTP_STATUS.TOO_MANY_REQUESTS)
    })

    it('should create rate limited error with retry after', () => {
      const error = ApiErrors.rateLimited(60)

      expect(error.code).toBe(ApiErrorCode.RATE_LIMITED)
      expect(error.message).toContain('60 seconds')
      expect(error.details).toEqual({ retryAfter: 60 })
    })
  })

  describe('Server Errors', () => {
    it('should create internal error', () => {
      const error = ApiErrors.internalError('Something went wrong')

      expect(error.code).toBe(ApiErrorCode.INTERNAL_ERROR)
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(error.isOperational).toBe(false)
    })

    it('should create database error', () => {
      const error = ApiErrors.databaseError('Query failed', { query: 'SELECT *' })

      expect(error.code).toBe(ApiErrorCode.DATABASE_ERROR)
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      expect(error.details).toEqual({ query: 'SELECT *' })
    })

    it('should create external service error', () => {
      const error = ApiErrors.externalServiceError('Stripe')

      expect(error.code).toBe(ApiErrorCode.EXTERNAL_SERVICE_ERROR)
      expect(error.statusCode).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE)
      expect(error.message).toContain('Stripe')
    })

    it('should create timeout error', () => {
      const error = ApiErrors.timeout('database query', 5000)

      expect(error.code).toBe(ApiErrorCode.TIMEOUT)
      expect(error.message).toContain('database query')
      expect(error.message).toContain('5000ms')
    })
  })

  describe('Payment Errors', () => {
    it('should create payment required error', () => {
      const error = ApiErrors.paymentRequired()

      expect(error.code).toBe(ApiErrorCode.PAYMENT_REQUIRED)
      expect(error.statusCode).toBe(HTTP_STATUS.PAYMENT_REQUIRED)
    })

    it('should create payment failed error', () => {
      const error = ApiErrors.paymentFailed('Card declined')

      expect(error.code).toBe(ApiErrorCode.PAYMENT_FAILED)
      expect(error.details).toEqual({ reason: 'Card declined' })
    })
  })

  describe('Conflict Errors', () => {
    it('should create already exists error', () => {
      const error = ApiErrors.alreadyExists('User', 'user@example.com')

      expect(error.code).toBe(ApiErrorCode.ALREADY_EXISTS)
      expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT)
      expect(error.message).toContain('User')
      expect(error.message).toContain('user@example.com')
    })

    it('should create generic conflict error', () => {
      const error = ApiErrors.conflict('Resource is locked')

      expect(error.code).toBe(ApiErrorCode.CONFLICT)
      expect(error.message).toBe('Resource is locked')
    })
  })
})

describe('handleApiError Function', () => {
  it('should handle ApiError instances', () => {
    const apiError = ApiErrors.unauthorized()
    const response = handleApiError(apiError, 'corr-123')

    expect(response.status).toBe(HTTP_STATUS.UNAUTHORIZED)
  })

  it('should handle generic Error instances', async () => {
    const error = new Error('Something went wrong')
    const response = handleApiError(error)

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    const json = await response.json()
    expect(json.error.code).toBe(ApiErrorCode.INTERNAL_ERROR)
  })

  it('should handle unknown error types', () => {
    const error = 'string error'
    const response = handleApiError(error)

    expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
  })

  it('should include correlation ID in error response', async () => {
    const error = new Error('Test error')
    const response = handleApiError(error, 'correlation-456')

    const json = await response.json()
    expect(json.error.correlationId).toBe('correlation-456')
  })
})

describe('Error Response Structure', () => {
  it('should have consistent error response structure', async () => {
    const error = ApiErrors.validationError('Test', { field: 'test' })
    const response = error.toResponse('corr-789')
    const json = await response.json()

    // Verify structure
    expect(json).toHaveProperty('error')
    expect(json.error).toHaveProperty('code')
    expect(json.error).toHaveProperty('message')
    expect(json.error).toHaveProperty('timestamp')
    expect(json.error).toHaveProperty('correlationId')
    expect(json.error).toHaveProperty('details')

    // Verify types
    expect(typeof json.error.code).toBe('string')
    expect(typeof json.error.message).toBe('string')
    expect(typeof json.error.timestamp).toBe('string')
    expect(typeof json.error.correlationId).toBe('string')
  })

  it('should omit optional fields when not provided', async () => {
    const error = new ApiError(
      ApiErrorCode.UNAUTHORIZED,
      'Test',
      HTTP_STATUS.UNAUTHORIZED
    )
    const response = error.toResponse()
    const json = await response.json()

    expect(json.error).not.toHaveProperty('details')
    expect(json.error).not.toHaveProperty('field')
  })
})

describe('Error Code Consistency', () => {
  it('should use consistent error codes', () => {
    // Verify all error codes are strings
    Object.values(ApiErrorCode).forEach(code => {
      expect(typeof code).toBe('string')
    })
  })

  it('should use snake_case for error codes', () => {
    Object.values(ApiErrorCode).forEach(code => {
      expect(code).toMatch(/^[a-z_]+$/)
    })
  })
})

describe('HTTP Status Codes', () => {
  it('should use appropriate status codes for authentication errors', () => {
    expect(ApiErrors.unauthorized().statusCode).toBe(401)
    expect(ApiErrors.forbidden().statusCode).toBe(403)
  })

  it('should use appropriate status codes for validation errors', () => {
    expect(ApiErrors.validationError('test', {}).statusCode).toBe(400)
    expect(ApiErrors.invalidInput('test').statusCode).toBe(400)
  })

  it('should use appropriate status codes for business logic errors', () => {
    expect(ApiErrors.insufficientCredits().statusCode).toBe(402)
    expect(ApiErrors.planLimitReached('test', 100).statusCode).toBe(403)
  })

  it('should use appropriate status codes for server errors', () => {
    expect(ApiErrors.internalError().statusCode).toBe(500)
    expect(ApiErrors.externalServiceError('test').statusCode).toBe(503)
  })
})

