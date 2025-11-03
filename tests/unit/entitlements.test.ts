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
import { supabaseAdmin } from '@/lib/supabase'
import { createMockUser, createMockQrCode, createMockScan, TEST_USER_ID } from '../utils/test-helpers'

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
    it('should return FREE plan entitlements for null/undefined', () => {
      expect(getEntitlements(null)).toEqual(PLAN_MATRIX.FREE)
      expect(getEntitlements(undefined)).toEqual(PLAN_MATRIX.FREE)
    })

    it('should return correct entitlements for each plan', () => {
      expect(getEntitlements('FREE')).toEqual(PLAN_MATRIX.FREE)
      expect(getEntitlements('FLEX')).toEqual(PLAN_MATRIX.FLEX)
      expect(getEntitlements('PRO')).toEqual(PLAN_MATRIX.PRO)
      expect(getEntitlements('BUSINESS')).toEqual(PLAN_MATRIX.BUSINESS)
    })

    it('should return FREE for invalid plan', () => {
      expect(getEntitlements('INVALID' as any)).toEqual(PLAN_MATRIX.FREE)
    })
  })

  describe('hasFeature', () => {
    it('should return false for FREE plan features', () => {
      expect(hasFeature('FREE', 'dynamicQrAllowed')).toBe(false)
      expect(hasFeature('FREE', 'customDomainsAllowed')).toBe(false)
      expect(hasFeature('FREE', 'webhooksAllowed')).toBe(false)
      expect(hasFeature('FREE', 'removeWatermarkAllowed')).toBe(false)
    })

    it('should return true for allowed features', () => {
      expect(hasFeature('FREE', 'logoUploadsAllowed')).toBe(true)
      expect(hasFeature('PRO', 'dynamicQrAllowed')).toBe(true)
      expect(hasFeature('PRO', 'customDomainsAllowed')).toBe(true)
      expect(hasFeature('PRO', 'webhooksAllowed')).toBe(true)
      expect(hasFeature('PRO', 'removeWatermarkAllowed')).toBe(true)
    })

    it('should handle null/undefined plans', () => {
      expect(hasFeature(null, 'dynamicQrAllowed')).toBe(false)
      expect(hasFeature(undefined, 'logoUploadsAllowed')).toBe(true)
    })
  })

  describe('getUserPlan', () => {
    it('should return FREE for user without plan', async () => {
      vi.mocked(supabaseAdmin!.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      } as any)

      const plan = await getUserPlan(TEST_USER_ID)
      expect(plan).toBe('FREE')
    })

    it('should return user plan from database', async () => {
      vi.mocked(supabaseAdmin!.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'PRO' },
              error: null,
            }),
          }),
        }),
      } as any)

      const plan = await getUserPlan(TEST_USER_ID)
      expect(plan).toBe('PRO')
    })

    it('should normalize plan name to uppercase', async () => {
      vi.mocked(supabaseAdmin!.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'pro' },
              error: null,
            }),
          }),
        }),
      } as any)

      const plan = await getUserPlan(TEST_USER_ID)
      expect(plan).toBe('PRO')
    })
  })

  describe('getUsageSnapshot', () => {
    it('should return usage snapshot for user', async () => {
      const mockQrCodes = [
        createMockQrCode({ id: 'qr1', userId: TEST_USER_ID }),
        createMockQrCode({ id: 'qr2', userId: TEST_USER_ID }),
      ]

      const mockScans = [
        createMockScan({ id: 'scan1', qrCodeId: 'qr1' }),
        createMockScan({ id: 'scan2', qrCodeId: 'qr2' }),
      ]

      let callSequence = 0
      vi.mocked(supabaseAdmin!.from).mockImplementation((table: string) => {
        callSequence++
        if (table === 'QrCode') {
          if (callSequence === 1) {
            // First call: count QR codes - select('id', { count: 'exact', head: true }).eq('userId', userId)
            const countBuilder = {
              eq: vi.fn().mockReturnThis(),
              then: vi.fn((onFulfilled: any) => Promise.resolve({ count: mockQrCodes.length, data: null, error: null }).then(onFulfilled)),
              catch: vi.fn(),
            }
            return {
              select: vi.fn((cols: string, opts?: any) => {
                if (opts?.count === 'exact' && opts?.head === true) {
                  return countBuilder
                }
                return countBuilder
              }),
            } as any
          } else {
            // Second call: get QR code IDs - select('id').eq('userId', userId)
            const dataBuilder = {
              eq: vi.fn().mockReturnThis(),
              then: vi.fn((onFulfilled: any) => Promise.resolve({ data: mockQrCodes.map(qr => ({ id: qr.id })), error: null }).then(onFulfilled)),
              catch: vi.fn(),
            }
            return {
              select: vi.fn().mockReturnValue(dataBuilder),
            } as any
          }
        } else if (table === 'QrCodeScan') {
          // Third call: count scans - select('id', { count: 'exact', head: true }).gte(...).in(...)
          const scanBuilder = {
            gte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: mockScans.length, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return scanBuilder
              }
              return scanBuilder
            }),
          } as any
        }
        return {} as any
      })

      const snapshot = await getUsageSnapshot(TEST_USER_ID)
      expect(snapshot.userId).toBe(TEST_USER_ID)
      expect(snapshot.qrCodesCount).toBe(2)
      expect(snapshot.monthlyScanCount).toBe(2)
    })
  })

  describe('assertCanCreateQr', () => {
    beforeEach(() => {
      vi.mocked(supabaseAdmin!.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plan: 'FREE' },
              error: null,
            }),
          }),
        }),
      } as any)
    })

    it('should allow QR creation when under limit', async () => {
      let callCount = 0
      vi.mocked(supabaseAdmin!.from).mockImplementation((table: string) => {
        callCount++
        if (table === 'User') {
          // getUserPlan call
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { plan: 'FREE' }, error: null }),
          } as any
        } else if (table === 'QrCode' && callCount === 2) {
          // First QrCode call - count QR codes
          const countBuilder = {
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 5, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return countBuilder
              }
              return {
                eq: vi.fn().mockReturnThis(),
                then: vi.fn((onFulfilled: any) => Promise.resolve({ data: [], error: null }).then(onFulfilled)),
                catch: vi.fn(),
              }
            }),
          } as any
        } else if (table === 'QrCode' && callCount > 2) {
          // Second QrCode call - get QR code IDs
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ data: [], error: null }).then(onFulfilled)),
            catch: vi.fn(),
          } as any
        } else if (table === 'QrCodeScan') {
          // Count scans
          const scanBuilder = {
            gte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 0, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return scanBuilder
              }
              return scanBuilder
            }),
          } as any
        }
        return {} as any
      })

      await expect(assertCanCreateQr(TEST_USER_ID)).resolves.not.toThrow()
    })

    it('should throw error when QR code limit reached', async () => {
      let callCount = 0
      vi.mocked(supabaseAdmin!.from).mockImplementation((table: string) => {
        callCount++
        if (table === 'User') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { plan: 'FREE' }, error: null }),
          } as any
        } else if (table === 'QrCode' && callCount === 2) {
          const countBuilder = {
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 10, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return countBuilder
              }
              return {
                eq: vi.fn().mockReturnThis(),
                then: vi.fn((onFulfilled: any) => Promise.resolve({ data: [], error: null }).then(onFulfilled)),
                catch: vi.fn(),
              }
            }),
          } as any
        } else if (table === 'QrCodeScan') {
          const scanBuilder = {
            gte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 0, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return scanBuilder
              }
              return scanBuilder
            }),
          } as any
        }
        return {} as any
      })

      await expect(assertCanCreateQr(TEST_USER_ID)).rejects.toThrow()
      await expect(assertCanCreateQr(TEST_USER_ID)).rejects.toMatchObject({
        status: 403,
        code: 'PLAN_LIMIT_QR_CODES',
      })
    })
  })

  describe('assertWithinMonthlyScanQuota', () => {
    it('should allow scans when under quota', async () => {
      let callCount = 0
      vi.mocked(supabaseAdmin!.from).mockImplementation((table: string) => {
        callCount++
        if (table === 'User') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { plan: 'FREE' }, error: null }),
          } as any
        } else if (table === 'QrCode' && callCount === 2) {
          const countBuilder = {
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 5, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return countBuilder
              }
              return {
                eq: vi.fn().mockReturnThis(),
                then: vi.fn((onFulfilled: any) => Promise.resolve({ data: [{ id: 'qr1' }], error: null }).then(onFulfilled)),
                catch: vi.fn(),
              }
            }),
          } as any
        } else if (table === 'QrCodeScan') {
          const scanBuilder = {
            gte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 500, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return scanBuilder
              }
              return scanBuilder
            }),
          } as any
        }
        return {} as any
      })

      await expect(assertWithinMonthlyScanQuota(TEST_USER_ID)).resolves.not.toThrow()
    })

    it('should throw error when monthly scan quota exceeded', async () => {
      let callCount = 0
      vi.mocked(supabaseAdmin!.from).mockImplementation((table: string) => {
        callCount++
        if (table === 'User') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { plan: 'FREE' }, error: null }),
          } as any
        } else if (table === 'QrCode' && callCount === 2) {
          const countBuilder = {
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 5, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return countBuilder
              }
              return {
                eq: vi.fn().mockReturnThis(),
                then: vi.fn((onFulfilled: any) => Promise.resolve({ data: [{ id: 'qr1' }], error: null }).then(onFulfilled)),
                catch: vi.fn(),
              }
            }),
          } as any
        } else if (table === 'QrCodeScan') {
          const scanBuilder = {
            gte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            then: vi.fn((onFulfilled: any) => Promise.resolve({ count: 1000, data: null, error: null }).then(onFulfilled)),
            catch: vi.fn(),
          }
          return {
            select: vi.fn((cols: string, opts?: any) => {
              if (opts?.count === 'exact' && opts?.head === true) {
                return scanBuilder
              }
              return scanBuilder
            }),
          } as any
        }
        return {} as any
      })

      await expect(assertWithinMonthlyScanQuota(TEST_USER_ID)).rejects.toThrow()
      await expect(assertWithinMonthlyScanQuota(TEST_USER_ID)).rejects.toMatchObject({
        status: 403,
        code: 'PLAN_LIMIT_SCANS',
      })
    })
  })
})

