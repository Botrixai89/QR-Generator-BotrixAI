/**
 * Entitlements — everything is free, no plan tiers.
 * All features are unlocked for all signed-in users.
 */

export type PlanName = 'FREE' | 'PRO' | 'BUSINESS'

export interface UsageSnapshot {
  userId: string
  qrCodesCount: number
  monthlyScanCount: number
}

export interface PlanEntitlements {
  name: PlanName
  label: string
  monthlyPriceCents: number
  maxQrCodes: number
  monthlyScanQuota: number
  dynamicQrAllowed: boolean
  customDomainsAllowed: boolean
  webhooksAllowed: boolean
  removeWatermarkAllowed: boolean
  removeAdsAllowed: boolean
  logoUploadsAllowed: boolean
  fileStorageMB: number
}

export type EntitlementKey = keyof Omit<PlanEntitlements, 'name' | 'label' | 'monthlyPriceCents' | 'maxQrCodes' | 'monthlyScanQuota' | 'fileStorageMB'>

/** Single unlimited tier — all features free */
const UNLIMITED: PlanEntitlements = {
  name: 'FREE',
  label: 'Free',
  monthlyPriceCents: 0,
  maxQrCodes: Number.MAX_SAFE_INTEGER,
  monthlyScanQuota: Number.MAX_SAFE_INTEGER,
  dynamicQrAllowed: true,
  customDomainsAllowed: true,
  webhooksAllowed: true,
  removeWatermarkAllowed: true,
  removeAdsAllowed: true,
  logoUploadsAllowed: true,
  fileStorageMB: 10000,
}

export const PLAN_MATRIX: Record<PlanName, PlanEntitlements> = {
  FREE: UNLIMITED,
  PRO: UNLIMITED,
  BUSINESS: UNLIMITED,
}

export function getEntitlements(_plan?: PlanName | string | null): PlanEntitlements {
  return UNLIMITED
}

export function hasFeature(_plan: PlanName | null | undefined, _feature: EntitlementKey): boolean {
  return true
}

export async function getUserPlan(_userId: string): Promise<PlanName> {
  return 'FREE'
}

/** No-op — creation is always allowed */
export async function assertCanCreateQr(_userId: string): Promise<void> {
  // No limits — everything is free
}

/** No-op — scan quota is unlimited */
export async function assertWithinMonthlyScanQuota(_userId: string): Promise<void> {
  // No limits — everything is free
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  return {
    userId,
    qrCodesCount: 0,
    monthlyScanCount: 0,
  }
}
