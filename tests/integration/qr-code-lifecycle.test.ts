/**
 * Integration Tests for QR Code Lifecycle
 * Tests the complete QR code CRUD operations with real API calls and database.
 * (Updated for the Free-Only model).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST as createQRCode, GET as getQRCodes } from '@/app/api/qr-codes/route'
import { DELETE as deleteQRCode } from '@/app/api/qr-codes/[id]/route'
import { createTestUser, getUserCredits, getQRCode, cleanupTestUser, isSupabaseConfigured } from '../utils/test-db'
import { NextRequest } from 'next/server'

// Mock NextAuth session
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth/next'

const shouldSkip = !isSupabaseConfigured()

describe.skipIf(shouldSkip)('QR Code Lifecycle Integration Tests', () => {
  let testUserId: string
  let testUserEmail: string

  beforeEach(async () => {
    // Create a test user
    const user = await createTestUser({
      email: `test-${Date.now()}@example.com`,
      plan: 'FREE',
      credits: 0,
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
    it('should create QR code and NOT deduct credits (everything is free)', async () => {
      const initialCredits = await getUserCredits(testUserId)
      // Credits don't matter anymore, but we'll check they stay at 0
      expect(initialCredits).toBe(0)

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

      // Verify credit was NOT deducted
      const finalCredits = await getUserCredits(testUserId)
      expect(finalCredits).toBe(initialCredits)

      // Verify QR code exists in database
      const dbQRCode = await getQRCode(qrCode.id)
      expect(dbQRCode).toBeDefined()
      expect(dbQRCode?.userId).toBe(testUserId)
    })

    it('should SUCCEED even when user has 0 credits', async () => {
      // User already has 0 credits from beforeEach
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Free QR Code')
      formData.append('isDynamic', 'false')

      const request = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })

      const response = await createQRCode(request)
      expect(response.status).toBe(201)
    }, 30000)

    it('should create dynamic QR code successfully for everyone', async () => {
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Dynamic QR Code')
      formData.append('isDynamic', 'true')
      formData.append('redirectUrl', 'https://redirect.example.com')

      const request = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })

      const response = await createQRCode(request)
      expect(response.status).toBe(201)

      const qrCode = await response.json()
      expect(qrCode.isDynamic).toBe(true)

      // Verify in database
      const dbQRCode = await getQRCode(qrCode.id)
      expect(dbQRCode?.isDynamic).toBe(true)
    })
  })

  describe('QR Code Retrieval', () => {
    it('should retrieve user QR codes', async () => {
      // Create a QR code first
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'Test Retrieve')
      formData.append('isDynamic', 'false')

      const createRequest = new NextRequest('http://localhost:3000/api/qr-codes', {
        method: 'POST',
        body: formData,
      })
      await createQRCode(createRequest)

      // Now retrieve all QR codes
      const getResponse = await getQRCodes()
      expect(getResponse.status).toBe(200)

      const qrCodes = await getResponse.json()
      expect(Array.isArray(qrCodes)).toBe(true)
      expect(qrCodes.length).toBeGreaterThan(0)
    }, 30000)
  })

  describe('QR Code Deletion', () => {
    it('should delete QR code', async () => {
      // Create a QR code first
      const formData = new FormData()
      formData.append('url', 'https://example.com')
      formData.append('title', 'To Be Deleted')
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

  describe('No Plan Limits', () => {
    it('should ALLOW creation beyond old FREE plan limits (everything is unlimited)', async () => {
      // Create 11 QR codes (beyond the old 10 limit)
      for (let i = 0; i < 11; i++) {
        const formData = new FormData()
        formData.append('url', `https://example.com/${i}`)
        formData.append('title', `QR ${i}`)
        formData.append('isDynamic', 'false')

        const request = new NextRequest('http://localhost:3000/api/qr-codes', {
          method: 'POST',
          body: formData,
        })
        const response = await createQRCode(request)
        expect(response.status).toBe(201)
      }
    }, 60000) // Increase timeout for bulk creation
  })
})
