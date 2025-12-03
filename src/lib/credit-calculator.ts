/**
 * Credit calculation utilities for QR code generation
 * 
 * Credit costs:
 * - Static QR code: 2 credits
 * - Dynamic/Social Media/Advanced Customization (except business/creative templates)/UPI: 4 credits
 */

import { isSocialMediaTemplate } from './social-media-logos'

export interface QRCodeForCreditCalc {
  isDynamic?: boolean
  template?: string
  gradient?: Record<string, unknown> | null
  sticker?: Record<string, unknown> | null
  effects?: Record<string, unknown> | null
  // UPI payment can be detected from template or URL pattern
  url?: string
}

/**
 * Calculate credit cost for a single QR code (Pro users only)
 * 
 * Credit costs for Pro users:
 * - Static QR code: 2 credits
 * - Business/Creative templates: 2 credits (free users can use these, Pro users pay static rate)
 * - Dynamic QR codes: 4 credits
 * - Social Media templates: 4 credits
 * - UPI Payment QR: 4 credits
 * - Advanced customization (gradient/sticker/effects): 4 credits
 * 
 * Note: Free users don't consume credits - they just have feature restrictions
 * 
 * @param qrCode - QR code data
 * @returns Credit cost (2 for static, 4 for dynamic/premium features)
 */
export function calculateQRCodeCreditCost(qrCode: QRCodeForCreditCalc): number {
  // Check if it's a dynamic QR code
  if (qrCode.isDynamic) {
    return 4
  }

  // Check if it's a social media template (except business/creative)
  if (qrCode.template) {
    const template = qrCode.template.toLowerCase()
    // Business and creative templates cost 2 credits (same as static)
    // These are the only advanced templates free users can use
    if (template === 'business' || template === 'creative') {
      return 2 // Static pricing for business/creative templates
    }
    
    // Social media templates cost 4 credits (Pro only feature)
    if (isSocialMediaTemplate(qrCode.template)) {
      return 4
    }
  }

  // Check for UPI payment (can be detected from template or URL pattern)
  // UPI is a Pro-only feature, costs 4 credits
  if (qrCode.template?.toLowerCase() === 'upi' || 
      qrCode.url?.toLowerCase().includes('upi') ||
      qrCode.url?.toLowerCase().startsWith('upi://')) {
    return 4
  }

  // Check for advanced customization (gradient, sticker, effects)
  // These are Pro-only features, cost 4 credits
  // Free users can only use business/creative templates, not these advanced features
  if (qrCode.gradient || qrCode.sticker || qrCode.effects) {
    return 4
  }

  // Default: static QR code costs 2 credits
  return 2
}

/**
 * Calculate total credits used from an array of QR codes
 * @param qrCodes - Array of QR codes
 * @returns Total credits used
 */
export function calculateTotalCreditsUsed(qrCodes: QRCodeForCreditCalc[]): number {
  return qrCodes.reduce((total, qrCode) => {
    return total + calculateQRCodeCreditCost(qrCode)
  }, 0)
}

/**
 * Get maximum possible QR codes based on credits
 * @param totalCredits - Total credits available
 * @returns Object with min (all dynamic) and max (all static) possible QR codes
 */
export function getMaxQRCodesFromCredits(totalCredits: number): {
  min: number // All dynamic/premium (4 credits each)
  max: number // All static (2 credits each)
} {
  return {
    min: Math.floor(totalCredits / 4), // Worst case: all dynamic/premium
    max: Math.floor(totalCredits / 2), // Best case: all static
  }
}

/**
 * Get credits allocation by plan
 * 
 * Note: Free users don't have a credit system - they have feature restrictions instead.
 * Only Pro and Business plan users have credits.
 * 
 * @param plan - User plan name
 * @returns Credits allocated for the plan (0 for FREE users)
 */
export function getCreditsByPlan(plan: string | null | undefined): number {
  // Map FLEX to PRO (legacy support)
  const normalizedPlan = plan === 'FLEX' ? 'PRO' : plan
  
  switch (normalizedPlan) {
    case 'PRO':
      return 100 // Pro users get 100 credits when they purchase
    case 'BUSINESS':
      return 1000 // Business users get 1000 credits
    case 'FREE':
    default:
      return 0 // Free users don't have credits - they have feature restrictions
  }
}

