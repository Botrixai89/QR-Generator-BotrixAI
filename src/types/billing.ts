export type PlanName = 'FREE' | 'FLEX' | 'PRO' | 'BUSINESS'

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
  logoUploadsAllowed: boolean
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
  | 'logoUploadsAllowed'
>


