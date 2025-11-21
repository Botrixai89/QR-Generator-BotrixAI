/**
 * Integration Tests for Payment Flow
 * Tests the complete payment lifecycle with real API calls
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST as createPaymentOrder } from '@/app/api/razorpay/create/route'
import { POST as verifyPayment } from '@/app/api/razorpay/verify/route'
import { GET as getPaymentStatus } from '@/app/api/razorpay/status/route'
import { createTestUser, getUserCredits, cleanupTestUser, isSupabaseConfigured } from '../utils/test-db'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Mock NextAuth session
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth/next'

const shouldSkip = !isSupabaseConfigured()

// Mock Razorpay SDK
vi.mock('razorpay', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      orders: {
        create: vi.fn().mockResolvedValue({
          id: 'order_test_123',
          amount: 100, // ₹1 in paise
          currency: 'INR',
          status: 'created',
          receipt: `order_${Date.now()}`,
        }),
        fetch: vi.fn().mockResolvedValue({
          id: 'order_test_123',
          amount: 100,
          currency: 'INR',
          status: 'paid',
          amount_paid: 100,
        }),
        fetchPayments: vi.fn().mockResolvedValue({
          items: [{
            id: 'pay_test_123',
            status: 'captured',
            amount: 100,
            currency: 'INR',
          }],
        }),
      },
      payments: {
        capture: vi.fn().mockResolvedValue({
          id: 'pay_test_123',
          status: 'captured',
        }),
      },
    })),
  }
})

describe.skipIf(shouldSkip)('Payment Flow Integration Tests', () => {
  let testUserId: string
  let testUserEmail: string

  beforeEach(async () => {
    // Create a test user
    const user = await createTestUser({
      email: `test-payment-${Date.now()}@example.com`,
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
    if (testUserId) {
      await cleanupTestUser(testUserId)
    }
  })

  describe('Payment Order Creation', () => {
    it('should create Razorpay order', async () => {
      const request = new NextRequest('http://localhost:3000/api/razorpay/create', {
        method: 'POST',
        body: JSON.stringify({ plan: 'FLEX' }),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.order_id).toBeDefined()
      expect(data.amount).toBe(100) // ₹1 in paise
      expect(data.currency).toBe('INR')
      expect(data.payment_id).toBeDefined()

      // Verify payment record was created in database
      const { testSupabase } = await import('../utils/test-db')
      const { data: payment } = await testSupabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', data.order_id)
        .eq('user_id', testUserId)
        .single()

      expect(payment).toBeDefined()
      expect(payment?.status).toBe('created')
      expect(payment?.amount).toBe(100)
    })

    it('should fail for unauthorized users', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/razorpay/create', {
        method: 'POST',
        body: JSON.stringify({ plan: 'FLEX' }),
      })

      const response = await createPaymentOrder(request)
      expect(response.status).toBe(401)
    })
  })

  describe('Payment Verification', () => {
    it('should verify payment signature and credit user', async () => {
      // First create an order
      const createRequest = new NextRequest('http://localhost:3000/api/razorpay/create', {
        method: 'POST',
        body: JSON.stringify({ plan: 'FLEX' }),
      })
      const createResponse = await createPaymentOrder(createRequest)
      const orderData = await createResponse.json()

      // Generate valid signature
      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret'
      const body = `${orderData.order_id}|pay_test_123`
      const signature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      // Verify payment
      const verifyRequest = new NextRequest('http://localhost:3000/api/razorpay/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: 'pay_test_123',
          razorpay_signature: signature,
        }),
      })

      const verifyResponse = await verifyPayment(verifyRequest)
      expect(verifyResponse.status).toBe(200)

      const verifyData = await verifyResponse.json()
      expect(verifyData.ok).toBe(true)
      expect(verifyData.credits).toBe(100)

      // Verify user credits were updated
      const finalCredits = await getUserCredits(testUserId)
      expect(finalCredits).toBe(100)

      // Verify user plan was updated
      const { testSupabase } = await import('../utils/test-db')
      const { data: user } = await testSupabase
        .from('User')
        .select('plan')
        .eq('id', testUserId)
        .single()

      expect(user?.plan).toBe('FLEX')
    })

    it('should reject invalid signature', async () => {
      const createRequest = new NextRequest('http://localhost:3000/api/razorpay/create', {
        method: 'POST',
        body: JSON.stringify({ plan: 'FLEX' }),
      })
      const createResponse = await createPaymentOrder(createRequest)
      const orderData = await createResponse.json()

      // Use invalid signature
      const verifyRequest = new NextRequest('http://localhost:3000/api/razorpay/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: 'pay_test_123',
          razorpay_signature: 'invalid_signature',
        }),
      })

      const verifyResponse = await verifyPayment(verifyRequest)
      expect(verifyResponse.status).toBe(403)

      const error = await verifyResponse.json()
      expect(error.error).toContain('signature')
    })

    it('should handle duplicate payment verification', async () => {
      // Create and verify payment once
      const createRequest = new NextRequest('http://localhost:3000/api/razorpay/create', {
        method: 'POST',
        body: JSON.stringify({ plan: 'FLEX' }),
      })
      const createResponse = await createPaymentOrder(createRequest)
      const orderData = await createResponse.json()

      const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret'
      const body = `${orderData.order_id}|pay_test_123`
      const signature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body)
        .digest('hex')

      const verifyRequest = new NextRequest('http://localhost:3000/api/razorpay/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: 'pay_test_123',
          razorpay_signature: signature,
        }),
      })

      // First verification
      const firstResponse = await verifyPayment(verifyRequest)
      expect(firstResponse.status).toBe(200)

      // Second verification (should return already processed)
      const secondResponse = await verifyPayment(verifyRequest)
      expect(secondResponse.status).toBe(200)

      const secondData = await secondResponse.json()
      expect(secondData.message).toContain('already processed')

      // Credits should still be 100 (not doubled)
      const finalCredits = await getUserCredits(testUserId)
      expect(finalCredits).toBe(100)
    })
  })

  describe('Payment Status Check', () => {
    it('should check payment status', async () => {
      // Create an order
      const createRequest = new NextRequest('http://localhost:3000/api/razorpay/create', {
        method: 'POST',
        body: JSON.stringify({ plan: 'FLEX' }),
      })
      const createResponse = await createPaymentOrder(createRequest)
      const orderData = await createResponse.json()

      // Check status
      const statusRequest = new NextRequest(
        `http://localhost:3000/api/razorpay/status?order_id=${orderData.order_id}`
      )
      const statusResponse = await getPaymentStatus(statusRequest)
      
      // Status might be pending or paid depending on mock
      expect([200, 404]).toContain(statusResponse.status)
    })
  })
})
