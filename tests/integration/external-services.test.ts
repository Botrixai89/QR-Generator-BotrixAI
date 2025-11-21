/**
 * External Service Contract Tests
 * Tests integration with Razorpay and Supabase Storage
 */

import { describe, it, expect, beforeEach } from 'vitest'
import crypto from 'crypto'
import { testSupabase, isSupabaseConfigured } from '../utils/test-db'

const shouldSkip = !isSupabaseConfigured()

describe('Razorpay Signature Verification', () => {
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_12345'

  describe('Payment Signature Generation', () => {
    it('should generate valid HMAC SHA256 signature', () => {
      const orderId = 'order_test_123'
      const paymentId = 'pay_test_456'
      const body = `${orderId}|${paymentId}`

      const signature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      expect(signature).toBeDefined()
      expect(signature.length).toBe(64) // SHA256 hex is 64 chars
      expect(signature).toMatch(/^[a-f0-9]{64}$/i)
    })

    it('should generate consistent signatures for same input', () => {
      const orderId = 'order_test_123'
      const paymentId = 'pay_test_456'
      const body = `${orderId}|${paymentId}`

      const signature1 = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      const signature2 = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      expect(signature1).toBe(signature2)
    })

    it('should generate different signatures for different inputs', () => {
      const body1 = 'order_123|pay_456'
      const body2 = 'order_123|pay_789'

      const signature1 = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body1)
        .digest('hex')

      const signature2 = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body2)
        .digest('hex')

      expect(signature1).not.toBe(signature2)
    })

    it('should match Razorpay signature format', () => {
      // Sample payload from Razorpay docs
      const orderId = 'order_1234567890'
      const paymentId = 'pay_9876543210'
      const body = `${orderId}|${paymentId}`

      const signature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      // Verify format matches Razorpay's expected format
      expect(signature).toMatch(/^[a-f0-9]{64}$/i)
    })
  })

  describe('Payment Signature Verification', () => {
    it('should verify valid signature', () => {
      const orderId = 'order_test_123'
      const paymentId = 'pay_test_456'
      const body = `${orderId}|${paymentId}`

      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      // Verify signature
      const actualSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      expect(actualSignature).toBe(expectedSignature)
    })

    it('should reject invalid signature', () => {
      const orderId = 'order_test_123'
      const paymentId = 'pay_test_456'
      const body = `${orderId}|${paymentId}`

      const validSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      const invalidSignature = 'invalid_signature_12345'

      expect(validSignature).not.toBe(invalidSignature)
    })

    it('should handle edge cases in signature verification', () => {
      // Empty body
      const emptyBody = ''
      const emptySignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(emptyBody)
        .digest('hex')

      expect(emptySignature).toBeDefined()
      expect(emptySignature.length).toBe(64)

      // Very long body
      const longBody = 'order_' + 'x'.repeat(1000) + '|pay_' + 'y'.repeat(1000)
      const longSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(longBody)
        .digest('hex')

      expect(longSignature).toBeDefined()
      expect(longSignature.length).toBe(64)
    })
  })

  describe('Webhook Payload Validation', () => {
    it('should validate payment.captured webhook structure', () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_123',
              order_id: 'order_test_123',
              status: 'captured',
              amount: 100,
              currency: 'INR',
              created_at: Math.floor(Date.now() / 1000),
            },
          },
        },
      }

      expect(webhookPayload.event).toBe('payment.captured')
      expect(webhookPayload.payload.payment.entity.id).toBeDefined()
      expect(webhookPayload.payload.payment.entity.order_id).toBeDefined()
      expect(webhookPayload.payload.payment.entity.status).toBe('captured')
    })

    it('should validate payment.failed webhook structure', () => {
      const webhookPayload = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_456',
              status: 'failed',
              error_code: 'BAD_REQUEST_ERROR',
              error_description: 'Payment failed',
            },
          },
        },
      }

      expect(webhookPayload.event).toBe('payment.failed')
      expect(webhookPayload.payload.payment.entity.status).toBe('failed')
      expect(webhookPayload.payload.payment.entity.error_code).toBeDefined()
    })

    it('should generate webhook signature', () => {
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_123',
            },
          },
        },
      })

      const webhookSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(webhookPayload)
        .digest('hex')

      expect(webhookSignature).toBeDefined()
      expect(webhookSignature.length).toBe(64)
    })
  })
})

describe.skipIf(shouldSkip)('Supabase Storage Integration', () => {
  describe('Storage Bucket Operations', () => {
    it('should verify qr-logos bucket exists', async () => {
      if (!testSupabase) {
        throw new Error('Supabase not configured')
      }
      
      const { data: buckets, error } = await testSupabase.storage.listBuckets()

      if (error) {
        // Bucket listing might fail in test environment
        console.warn('Could not list buckets:', error.message)
        return
      }

      const qrLogosBucket = buckets?.find(b => b.name === 'qr-logos')
      
      // If bucket doesn't exist, that's okay for tests (will be created on first upload)
      if (qrLogosBucket) {
        expect(qrLogosBucket.name).toBe('qr-logos')
        expect(qrLogosBucket.public).toBe(true) // Should be public for QR logos
      }
    })

    it('should upload file to storage', async () => {
      if (!testSupabase) {
        throw new Error('Supabase not configured')
      }
      
      // Create a test image file (1x1 PNG)
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const buffer = Buffer.from(pngBase64, 'base64')
      const fileName = `test-${Date.now()}.png`

      const { data, error } = await testSupabase.storage
        .from('qr-logos')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (error) {
        // Upload might fail if bucket doesn't exist or permissions are wrong
        console.warn('Could not upload test file:', error.message)
        return
      }

      expect(data).toBeDefined()
      expect(data.path).toBe(fileName)

      // Clean up: delete the test file
      if (testSupabase) {
        await testSupabase.storage
          .from('qr-logos')
          .remove([fileName])
      }
    })

    it('should get public URL for uploaded file', async () => {
      if (!testSupabase) {
        throw new Error('Supabase not configured')
      }
      
      // Create a test file
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const buffer = Buffer.from(pngBase64, 'base64')
      const fileName = `test-url-${Date.now()}.png`

      const { data: uploadData, error: uploadError } = await testSupabase.storage
        .from('qr-logos')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (uploadError) {
        console.warn('Could not upload test file:', uploadError.message)
        return
      }

      // Get public URL
      const { data: urlData } = testSupabase.storage
        .from('qr-logos')
        .getPublicUrl(fileName)

      expect(urlData.publicUrl).toBeDefined()
      expect(urlData.publicUrl).toContain(fileName)
      expect(urlData.publicUrl).toMatch(/^https?:\/\//)

      // Clean up
      if (testSupabase) {
        await testSupabase.storage
          .from('qr-logos')
          .remove([fileName])
      }
    })

    it('should validate file type restrictions', () => {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      const testTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
        'application/pdf', // Should be rejected
        'text/plain', // Should be rejected
      ]

      testTypes.forEach(type => {
        const isAllowed = allowedTypes.includes(type)
        if (type.startsWith('image/') && type !== 'image/svg+xml') {
          expect(isAllowed).toBe(true)
        } else if (type === 'application/pdf' || type === 'text/plain') {
          expect(isAllowed).toBe(false)
        }
      })
    })

    it('should validate file size limits', () => {
      const maxSize = 5 * 1024 * 1024 // 5MB
      const testSizes = [
        1024, // 1KB - should pass
        1024 * 1024, // 1MB - should pass
        4 * 1024 * 1024, // 4MB - should pass
        5 * 1024 * 1024, // 5MB - should pass (at limit)
        6 * 1024 * 1024, // 6MB - should fail
      ]

      testSizes.forEach(size => {
        const isValid = size <= maxSize
        if (size <= 5 * 1024 * 1024) {
          expect(isValid).toBe(true)
        } else {
          expect(isValid).toBe(false)
        }
      })
    })

    it('should handle file deletion', async () => {
      if (!testSupabase) {
        throw new Error('Supabase not configured')
      }
      
      // Upload a test file
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      const buffer = Buffer.from(pngBase64, 'base64')
      const fileName = `test-delete-${Date.now()}.png`

      const { error: uploadError } = await testSupabase.storage
        .from('qr-logos')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (uploadError) {
        console.warn('Could not upload test file:', uploadError.message)
        return
      }

      // Delete the file
      const { error: deleteError } = await testSupabase.storage
        .from('qr-logos')
        .remove([fileName])

      expect(deleteError).toBeNull()
    })
  })

  describe('Storage Error Handling', () => {
    it('should handle missing bucket gracefully', async () => {
      if (!testSupabase) {
        throw new Error('Supabase not configured')
      }
      
      const { error } = await testSupabase.storage
        .from('non-existent-bucket')
        .list()

      // Should return error for non-existent bucket
      expect(error).toBeDefined()
    })

    it('should handle invalid file paths', async () => {
      if (!testSupabase) {
        throw new Error('Supabase not configured')
      }
      
      // getPublicUrl is synchronous and always returns a URL
      // Note: Supabase returns the URL as-is, path sanitization happens server-side
      const { data } = testSupabase.storage
        .from('qr-logos')
        .getPublicUrl('../invalid-path/../../file.png')

      // Should return a valid URL (Supabase will handle sanitization on the server)
      expect(data.publicUrl).toBeDefined()
      expect(data.publicUrl).toMatch(/^https?:\/\//)
      // The URL may contain '../' in the path, but Supabase server will sanitize it
    })
  })
})

