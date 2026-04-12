import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getEntitlements,
  hasFeature,
  getUserPlan,
  getUsageSnapshot,
  assertCanCreateQr,
  assertWithinMonthlyScanQuota,
  PLAN_MATRIX,
} from '@/lib/entitlements'
import { TEST_USER_ID } from '../utils/test-helpers'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}))

describe('Entitlements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getEntitlements', () => {
    it('should return UNLIMITED entitlements for any input', () => {
      // Use PLAN_MATRIX.FREE as our reference for UNLIMITED
      expect(getEntitlements(null)).toEqual(PLAN_MATRIX.FREE)
      expect(getEntitlements(undefined)).toEqual(PLAN_MATRIX.FREE)
      expect(getEntitlements('FREE')).toEqual(PLAN_MATRIX.FREE)
      expect(getEntitlements('PRO')).toEqual(PLAN_MATRIX.FREE)
      expect(getEntitlements('BUSINESS')).toEqual(PLAN_MATRIX.FREE)
      expect(getEntitlements('INVALID' as any)).toEqual(PLAN_MATRIX.FREE)
    })
  })

  describe('hasFeature', () => {
    it('should always return true as everything is free', () => {
      expect(hasFeature('FREE', 'dynamicQrAllowed')).toBe(true)
      expect(hasFeature('FREE', 'customDomainsAllowed')).toBe(true)
      expect(hasFeature('FREE', 'webhooksAllowed')).toBe(true)
      expect(hasFeature('FREE', 'removeWatermarkAllowed')).toBe(true)
      expect(hasFeature('PRO', 'dynamicQrAllowed')).toBe(true)
      expect(hasFeature(null, 'dynamicQrAllowed')).toBe(true)
      expect(hasFeature(undefined, 'logoUploadsAllowed')).toBe(true)
    })
  })

  describe('getUserPlan', () => {
    it('should always return FREE as tiers are removed', async () => {
      const plan1 = await getUserPlan(TEST_USER_ID)
      expect(plan1).toBe('FREE')
      
      const plan2 = await getUserPlan('some-other-id')
      expect(plan2).toBe('FREE')
    })
  })

  describe('getUsageSnapshot', () => {
    it('should return stub usage snapshot', async () => {
      const snapshot = await getUsageSnapshot(TEST_USER_ID)
      expect(snapshot.userId).toBe(TEST_USER_ID)
      expect(snapshot.qrCodesCount).toBe(0)
      expect(snapshot.monthlyScanCount).toBe(0)
    })
  })

  describe('assertCanCreateQr', () => {
    it('should always allow QR creation', async () => {
      await expect(assertCanCreateQr(TEST_USER_ID)).resolves.not.toThrow()
      await expect(assertCanCreateQr('any-user')).resolves.not.toThrow()
    })
  })

  describe('assertWithinMonthlyScanQuota', () => {
    it('should always allow scans', async () => {
      await expect(assertWithinMonthlyScanQuota(TEST_USER_ID)).resolves.not.toThrow()
      await expect(assertWithinMonthlyScanQuota('any-user')).resolves.not.toThrow()
    })
  })
})
