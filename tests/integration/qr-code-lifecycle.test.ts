/**
 * Integration Tests for QR Code Lifecycle
 * Tests the complete QR code CRUD operations with real API calls and database
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST as createQRCode, GET as getQRCodes } from '@/app/api/qr-codes/route'
import { DELETE as deleteQRCode } from '@/app/api/qr-codes/[id]/route'
import { createTestUser, getUserCredits, getUserQRCodes, getQRCode, cleanupTestUser } from '../utils/test-db'
import { NextRequest } from 'next/server'

// Mock NextAuth session
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth/next'

describe('QR Code Lifecycle Integration Tests', () => {
  let testUserId: string
  let testUserEmail: string

  beforeEach(async () => {
    // Create a test user
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      plan: 'PRO',
      credits: 100,
    })
    testUserId = user.id
    testUserEmail = user.email
    
    // Mock NextAuth session
    vi.mocked(getServerSession).mockResolvedValue({
      user: {
        id: testUserId,
        email: testUserEmail,
        name: 'Test User',
      },
    } as any)
  })

  afterEach(async () => {
    // Clean up test user and their QR codes
    if (testUserId) {
      await cleanupTestUser(testUserId)
    }
  })

  describe('QR Code Creation', () => {
    it('should create QR code and deduct credit', async () => {
      const initialCredits = await getUserCredits(testUserId)
      expect(initialCredits).toBe(100)

      // Create FormData for QR code creation
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Test QR Code')
      formData.append('foregroundColor', '#000000')
      formData.append('backgroundColor', '#FFFFFF')
      formData.append('dotType', 'square')
      formData.append('cornerType', 'square')
      formData.append('hasWatermark', 'false')
      formData.append('isDynamic', 'false')

      const request = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })

      const response = await createQRCode(request)
      expect(response.status).toBe(201)

      const qrCode = await response.json()
      expect(qrCode.id).toBeDefined()
      expect(qrCode.url).toBe('https://example.com')
      expect(qrCode.title).toBe('Test QR Code')

      // Verify credit was deducted
      const finalCredits = await getUserCredits(testUserId)
      expect(finalCredits).toBe(initialCredits - 1)

      // Verify QR code exists in database
      const dbQRCode = await getQRCode(qrCode.id)
      expect(dbQRCode).toBeDefined()
      expect(dbQRCode?.userId).toBe(testUserId)
    })

    it('should fail when user has no credits', async () => {
      // Set user credits to 0
      const { testSupabase } = await import('../utils/test-db')
      await testSupabase
        .from('User')
        .update({ credits: 0 })
        .eq('id', testUserId)

      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Test QR Code')
      formData.append('foregroundColor', '#000000')
      formData.append('backgroundColor', '#FFFFFF')
      formData.append('dotType', 'square')
      formData.append('cornerType', 'square')
      formData.append('hasWatermark', 'false')
      formData.append('isDynamic', 'false')

      const request = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })

      const response = await createQRCode(request)
      expect(response.status).toBe(402) // Payment Required

      const error = await response.json()
      expect(error.error).toBeDefined()
    })

    it('should create dynamic QR code for PRO users', async () => {
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Dynamic QR Code')
      formData.append('foregroundColor', '#000000')
      formData.append('backgroundColor', '#FFFFFF')
      formData.append('dotType', 'square')
      formData.append('cornerType', 'square')
      formData.append('hasWatermark', 'false')
      formData.append('isDynamic', 'true')
      formData.append('redirectUrl', 'https://redirect.example.com')
      formData.append('expiresAt', '2025-12-31T23:59:59Z')
      formData.append('maxScans', '1000')

      const request = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })

      const response = await createQRCode(request)
      expect(response.status).toBe(201)

      const qrCode = await response.json()
      expect(qrCode.isDynamic).toBe(true)
      expect(qrCode.redirectUrl).toBe('https://redirect.example.com')

      // Verify in database
      const dbQRCode = await getQRCode(qrCode.id)
      expect(dbQRCode?.isDynamic).toBe(true)
      expect(dbQRCode?.redirectUrl).toBe('https://redirect.example.com')
    })

    it('should prevent dynamic QR creation for FREE users', async () => {
      // Change user to FREE plan
      const { testSupabase } = await import('../utils/test-db')
      await testSupabase
        .from('User')
        .update({ plan: 'FREE' })
        .eq('id', testUserId)

      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Dynamic QR Code')
      formData.append('foregroundColor', '#000000')
      formData.append('backgroundColor', '#FFFFFF')
      formData.append('dotType', 'square')
      formData.append('cornerType', 'square')
      formData.append('hasWatermark', 'false')
      formData.append('isDynamic', 'true')

      const request = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })

      const response = await createQRCode(request)
      expect(response.status).toBe(403)

      const error = await response.json()
      expect(error.error).toContain('not available')
    })
  })

  describe('QR Code Retrieval', () => {
    it('should retrieve user QR codes', async () => {
      // Create a QR code first
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Test QR Code')
      formData.append('foregroundColor', '#000000')
      formData.append('backgroundColor', '#FFFFFF')
      formData.append('dotType', 'square')
      formData.append('cornerType', 'square')
      formData.append('hasWatermark', 'false')
      formData.append('isDynamic', 'false')

      const createRequest = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })
      const createResponse = await createQRCode(createRequest)
      const createdQR = await createResponse.json()

      // Now retrieve all QR codes
      const getRequest = new NextRequest('http://localhost:3000/api/qr-codes')
      const getResponse = await getQRCodes(getRequest)
      expect(getResponse.status).toBe(200)

      const qrCodes = await getResponse.json()
      expect(Array.isArray(qrCodes)).toBe(true)
      expect(qrCodes.length).toBeGreaterThan(0)
      
      const foundQR = qrCodes.find((q: any) => q.id === createdQR.id)
      expect(foundQR).toBeDefined()
      expect(foundQR.title).toBe('Test QR Code')
    })
  })

  describe('QR Code Deletion', () => {
    it('should delete QR code', async () => {
      // Create a QR code first
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'To Be Deleted')
      formData.append('foregroundColor', '#000000')
      formData.append('backgroundColor', '#FFFFFF')
      formData.append('dotType', 'square')
      formData.append('cornerType', 'square')
      formData.append('hasWatermark', 'false')
      formData.append('isDynamic', 'false')

      const createRequest = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })
      const createResponse = await createQRCode(createRequest)
      const createdQR = await createResponse.json()

      // Delete the QR code
      const deleteRequest = new NextRequest(`http://localhost:3000/api/qr-codes/${createdQR.id}`, {
        method: 'DELETE',
      })
      const deleteResponse = await deleteQRCode(deleteRequest, { params: Promise.resolve({ id: createdQR.id }) })
      expect(deleteResponse.status).toBe(200)

      // Verify it's deleted
      const dbQRCode = await getQRCode(createdQR.id)
      expect(dbQRCode).toBeNull()
    })
  })

  describe('Plan Limits', () => {
    it('should enforce FREE plan QR code limit', async () => {
      // Change user to FREE plan (limit: 10 QR codes)
      const { testSupabase } = await import('../utils/test-db')
      await testSupabase
        .from('User')
        .update({ plan: 'FREE', credits: 100 })
        .eq('id', testUserId)

      // Create 10 QR codes (at limit)
      for (let i = 0; i < 10; i++) {
        const formData = new FormData()
        formData.append('url', `https://example.com/${i}`)
        formData.append('title', `QR ${i}`)
        formData.append('foregroundColor', '#000000')
        formData.append('backgroundColor', '#FFFFFF')
        formData.append('dotType', 'square')
        formData.append('cornerType', 'square')
        formData.append('hasWatermark', 'false')
        formData.append('isDynamic', 'false')

        const request = new NextRequest('http://localhost:3000/api/qr-codes', {
          method: 'POST',
          body: formData,
        })
        await createQRCode(request)
      }

      // Try to create 11th QR code (should fail)
      const formData = new FormData()
      formData.append('url', 'https://example.com/11')
      formData.append('title', 'QR 11')
      formData.append('foregroundColor', '#000000')
      formData.append('backgroundColor', '#FFFFFF')
      formData.append('dotType', 'square')
      formData.append('cornerType', 'square')
      formData.append('hasWatermark', 'false')
      formData.append('isDynamic', 'false')

      const request = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })

      const response = await createQRCode(request)
      expect(response.status).toBe(403)

      const error = await response.json()
      expect(error.error).toContain('limit')
    })
  })
})
