import type { PlanName } from '@/types/billing'

/**
 * Test utilities and helpers
 */

export const TEST_USER_ID = 'test-user-id'
export const TEST_ORG_ID = 'test-org-id'
export const TEST_API_KEY = 'test-api-key'

/**
 * Mock user data for testing
 */
export function createMockUser(overrides?: Partial<{
  id: string
  email: string
  name: string
  plan: PlanName
  credits: number
}>) {
  return {
    id: overrides?.id || TEST_USER_ID,
    email: overrides?.email || 'test@example.com',
    name: overrides?.name || 'Test User',
    plan: overrides?.plan || 'FREE',
    credits: overrides?.credits || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Mock QR code data for testing
 */
export function createMockQrCode(overrides?: Partial<{
  id: string
  userId: string
  url: string
  title: string
  isDynamic: boolean
  isActive: boolean
  scanCount: number
}>) {
  return {
    id: overrides?.id || 'test-qr-id',
    userId: overrides?.userId || TEST_USER_ID,
    url: overrides?.url || 'https://example.com',
    title: overrides?.title || 'Test QR Code',
    isDynamic: overrides?.isDynamic || false,
    isActive: overrides?.isActive ?? true,
    scanCount: overrides?.scanCount || 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Mock scan data for testing
 */
export function createMockScan(overrides?: Partial<{
  id: string
  qrCodeId: string
  userAgent: string
  ipAddress: string
  country: string
  city: string
  device: string
}>) {
  return {
    id: overrides?.id || 'test-scan-id',
    qrCodeId: overrides?.qrCodeId || 'test-qr-id',
    userAgent: overrides?.userAgent || 'Mozilla/5.0',
    ipAddress: overrides?.ipAddress || '127.0.0.1',
    country: overrides?.country || 'US',
    city: overrides?.city || 'New York',
    device: overrides?.device || 'Desktop',
    browser: 'Chrome',
    os: 'Windows',
    scannedAt: new Date().toISOString(),
  }
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
  const start = Date.now()
  while (!condition() && Date.now() - start < timeout) {
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`)
  }
}

