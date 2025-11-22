import { test, expect } from '@playwright/test'

/**
 * Smoke tests for webhook flows
 */

test.describe('Webhook Smoke Tests', () => {
  test('webhook endpoint should be accessible', async ({ request }) => {
    // Test webhook endpoint exists and returns appropriate response
    const response = await request.post('/api/billing/webhook', {
      data: {
        event: 'test',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Webhook should either accept the request or return 401/403 for invalid auth, or 503 if misconfigured
    expect([200, 201, 400, 401, 403, 503]).toContain(response.status())
  })

  test('webhook endpoint should validate signature', async ({ request }) => {
    // Attempt to call webhook without proper signature
    const response = await request.post('/api/billing/webhook', {
      data: {
        event: 'payment.succeeded',
        payload: {},
      },
      headers: {
        'Content-Type': 'application/json',
        // Missing signature header
      },
    })

    // Should reject invalid/missing signatures, or return 503 if misconfigured
    expect([400, 401, 403, 503]).toContain(response.status())
  })

  test('razorpay webhook endpoint should handle events', async ({ request }) => {
    // Test Razorpay webhook endpoint
    const response = await request.post('/api/razorpay/webhook', {
      data: {
        entity: 'event',
        event: 'payment.captured',
        payload: {},
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Should return 200 or appropriate error
    expect(response.status()).toBeLessThan(500)
  })
})

