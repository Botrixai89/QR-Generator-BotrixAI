export type PlanName = 'FREE' | 'PRO' | 'BUSINESS'

export interface PlanEntitlements {
  name: PlanName
  label: string
  monthlyPriceCents?: number
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

export interface UsageSnapshot {
  userId: string
  qrCodesCount: number
  monthlyScanCount: number
}

export type EntitlementKey = keyof Pick<
  PlanEntitlements,
  | 'dynamicQrAllowed'
  | 'customDomainsAllowed'
  | 'webhooksAllowed'
  | 'removeWatermarkAllowed'
  | 'removeAdsAllowed'
  | 'logoUploadsAllowed'
>


