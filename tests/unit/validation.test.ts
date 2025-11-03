import { describe, it, expect } from 'vitest'
import {
  validateRequest,
  validateJsonBody,
  validateQuery,
  sanitizeInput,
  validateAndSanitizeUrl,
  qrCodeCreateSchema,
  registerSchema,
} from '@/lib/validation'
import { NextRequest } from 'next/server'

describe('Validation', () => {
  describe('validateRequest', () => {
    it('should return success for valid data', async () => {
      const validData = {
        url: 'https://example.com',
        title: 'Test QR Code',
      }
      
      const result = await validateRequest(qrCodeCreateSchema, validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.url).toBe(validData.url)
        expect(result.data.title).toBe(validData.title)
      }
    })

    it('should return error for invalid data', async () => {
      const invalidData = {
        url: 'not-a-url',
        title: 'Test',
      }
      
      const result = await validateRequest(qrCodeCreateSchema, invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.response.status).toBe(400)
      }
    })

    it('should validate required fields', async () => {
      const invalidData = {}
      
      const result = await validateRequest(qrCodeCreateSchema, invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.response.status).toBe(400)
      }
    })
  })

  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>'
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('&lt;')
      expect(sanitized).toContain('&gt;')
    })

    it('should escape quotes', () => {
      const input = 'test"quotes\'here'
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).toContain('&quot;')
      expect(sanitized).toContain('&#x27;')
    })

    it('should trim whitespace', () => {
      const input = '  test  '
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).toBe('test')
    })
  })

  describe('validateAndSanitizeUrl', () => {
    it('should validate and return valid HTTP URL', () => {
      const url = 'https://example.com/path'
      const result = validateAndSanitizeUrl(url)
      
      expect(result).toBe(url)
    })

    it('should validate and return valid HTTPS URL', () => {
      const url = 'http://example.com/path'
      const result = validateAndSanitizeUrl(url)
      
      expect(result).toBe(url)
    })

    it('should reject javascript: URLs', () => {
      const url = 'javascript:alert("xss")'
      const result = validateAndSanitizeUrl(url)
      
      expect(result).toBeNull()
    })

    it('should reject data: URLs', () => {
      const url = 'data:text/html,<script>alert("xss")</script>'
      const result = validateAndSanitizeUrl(url)
      
      expect(result).toBeNull()
    })

    it('should reject invalid URLs', () => {
      const url = 'not-a-url'
      const result = validateAndSanitizeUrl(url)
      
      expect(result).toBeNull()
    })
  })

  describe('registerSchema', () => {
    it('should validate valid registration data', async () => {
      const validData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }
      
      const result = await validateRequest(registerSchema, validData)
      
      expect(result.success).toBe(true)
    })

    it('should reject weak passwords', async () => {
      const invalidData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
      }
      
      const result = await validateRequest(registerSchema, invalidData)
      
      expect(result.success).toBe(false)
    })

    it('should reject invalid emails', async () => {
      const invalidData = {
        name: 'Test User',
        email: 'not-an-email',
        password: 'password123',
      }
      
      const result = await validateRequest(registerSchema, invalidData)
      
      expect(result.success).toBe(false)
    })
  })
})

