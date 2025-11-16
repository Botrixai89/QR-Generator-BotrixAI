import { supabaseAdmin } from '@/lib/supabase'
import type { PlanEntitlements, PlanName, UsageSnapshot, EntitlementKey } from '@/types/billing'

export const PLAN_MATRIX: Record<PlanName, PlanEntitlements> = {
  FREE: {
    name: 'FREE',
    label: 'Free',
    monthlyPriceCents: 0,
    maxQrCodes: 10,
    monthlyScanQuota: 1000,
    dynamicQrAllowed: false,
    customDomainsAllowed: false,
    webhooksAllowed: false,
    removeWatermarkAllowed: false,
    removeAdsAllowed: true, // Ads feature removed - all plans have no ads
    logoUploadsAllowed: true,
    fileStorageMB: 100,
  },
  FLEX: {
    name: 'FLEX',
    label: 'Flex (Credits)',
    monthlyPriceCents: 0,
    maxQrCodes: 100,
    monthlyScanQuota: 10000,
    dynamicQrAllowed: true,
    customDomainsAllowed: false,
    webhooksAllowed: false,
    removeWatermarkAllowed: true,
    removeAdsAllowed: true, // Ads feature removed - all plans have no ads
    logoUploadsAllowed: true,
    fileStorageMB: 250,
  },
  PRO: {
    name: 'PRO',
    label: 'Pro',
    monthlyPriceCents: 1999,
    maxQrCodes: 1000,
    monthlyScanQuota: 100000,
    dynamicQrAllowed: true,
    customDomainsAllowed: true,
    webhooksAllowed: true,
    removeWatermarkAllowed: true,
    removeAdsAllowed: true, // Ads feature removed - all plans have no ads
    logoUploadsAllowed: true,
    fileStorageMB: 500,
  },
  BUSINESS: {
    name: 'BUSINESS',
    label: 'Business',
    monthlyPriceCents: 4999,
    maxQrCodes: 10000,
    monthlyScanQuota: 1000000,
    dynamicQrAllowed: true,
    customDomainsAllowed: true,
    webhooksAllowed: true,
    removeWatermarkAllowed: true,
    removeAdsAllowed: true, // Ads feature removed - all plans have no ads
    logoUploadsAllowed: true,
    fileStorageMB: 2000,
  },
}

export function getEntitlements(plan: PlanName | null | undefined): PlanEntitlements {
  const key: PlanName = (plan as PlanName) || 'FREE'
  return PLAN_MATRIX[key] || PLAN_MATRIX.FREE
}

export function hasFeature(plan: PlanName | null | undefined, feature: EntitlementKey): boolean {
  const ent = getEntitlements(plan)
  return Boolean(ent[feature])
}

export async function getUserPlan(userId: string): Promise<PlanName> {
  const { data, error } = await supabaseAdmin!
    .from('User')
    .select('plan')
    .eq('id', userId)
    .single()

  if (error || !data?.plan) return 'FREE'
  const plan = (data.plan as string).toUpperCase() as PlanName
  return PLAN_MATRIX[plan] ? plan : 'FREE'
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  // Count QR codes
  const { count: qrCodesCount } = await supabaseAdmin!
    .from('QrCode')
    .select('id', { count: 'exact', head: true })
    .eq('userId', userId)

  // Count scans this calendar month across all user's QR codes
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const { count: monthlyScanCount } = await supabaseAdmin!
    .from('QrCodeScan')
    .select('id', { count: 'exact', head: true })
    .gte('createdAt', startOfMonth.toISOString())
    .in('qrCodeId',
      (
        await supabaseAdmin!
          .from('QrCode')
          .select('id')
          .eq('userId', userId)
      ).data?.map(r => r.id) || []
    )

  return {
    userId,
    qrCodesCount: qrCodesCount || 0,
    monthlyScanCount: monthlyScanCount || 0,
  }
}

export async function assertCanCreateQr(userId: string) {
  const [plan, usage] = await Promise.all([
    getUserPlan(userId),
    getUsageSnapshot(userId),
  ])
  const ent = getEntitlements(plan)
  if (usage.qrCodesCount >= ent.maxQrCodes) {
    const upgradeHint = plan === 'FREE' ? 'PRO' : 'BUSINESS'
    const message = `QR code limit reached for your plan (${ent.maxQrCodes}). Upgrade to ${upgradeHint} to increase your limit.`
    const error = new Error(message) as Error & { status?: number; code?: string }
    error.status = 403
    error.code = 'PLAN_LIMIT_QR_CODES'
    throw error
  }
}

export async function assertWithinMonthlyScanQuota(userId: string) {
  const [plan, usage] = await Promise.all([
    getUserPlan(userId),
    getUsageSnapshot(userId),
  ])
  const ent = getEntitlements(plan)
  if (usage.monthlyScanCount >= ent.monthlyScanQuota) {
    const message = `Monthly scan quota reached for your plan (${ent.monthlyScanQuota}). Consider upgrading.`
    const error = new Error(message) as Error & { status?: number; code?: string }
    error.status = 403
    error.code = 'PLAN_LIMIT_SCANS'
    throw error
  }
}


