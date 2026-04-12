/**
 * Credit calculation utilities — everything is free.
 * (Now returning neutral values as credits are ignored).
 */

export interface QRCodeForCreditCalc {
  isDynamic?: boolean
  template?: string
  gradient?: Record<string, unknown> | null
  sticker?: Record<string, unknown> | null
  effects?: Record<string, unknown> | null
  url?: string
}

/** All features now cost 0 credits */
export function calculateQRCodeCreditCost(_qrCode: QRCodeForCreditCalc): number {
  return 0
}

/** Always 0 total credits used */
export function calculateTotalCreditsUsed(_qrCodes: QRCodeForCreditCalc[]): number {
  return 0
}

/** Maximum possible is effectively unlimited */
export function getMaxQRCodesFromCredits(_totalCredits: number): {
  min: number
  max: number
} {
  return {
    min: Number.MAX_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
  }
}

/** All plans now return 0 starting credits as they are free */
export function getCreditsByPlan(_plan: string | null | undefined): number {
  return 0
}
