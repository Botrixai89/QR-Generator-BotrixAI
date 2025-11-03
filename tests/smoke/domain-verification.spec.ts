import { test, expect } from '@playwright/test'

/**
 * Smoke tests for domain verification flows
 */

test.describe('Domain Verification Smoke Tests', () => {
  test('domain verification endpoint should exist', async ({ request }) => {
    // Test domain verification endpoint
    const response = await request.get('/api/custom-domains', {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Should return 401/403 for unauthenticated or 200 if public endpoint
    expect(response.status()).toBeLessThan(500)
  })

  test('domain verification should validate domain format', async ({ request }) => {
    // Test with invalid domain format
    const response = await request.post('/api/custom-domains', {
      data: {
        domain: 'invalid..domain..com',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Should reject invalid domains
    expect([400, 401, 403]).toContain(response.status())
  })

  test('domain verification should handle TXT record check', async ({ request }) => {
    // Test domain verification with TXT record
    const response = await request.post('/api/custom-domains', {
      data: {
        domain: 'example.com',
        verificationMethod: 'txt',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Should process or require authentication
    expect(response.status()).toBeLessThan(500)
  })

  test('domain verification should handle DNS records', async ({ request }) => {
    // Test DNS record verification
    const response = await request.get('/api/custom-domains/verify', {
      params: {
        domain: 'example.com',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Should return verification status or require auth
    expect(response.status()).toBeLessThan(500)
  })
})

