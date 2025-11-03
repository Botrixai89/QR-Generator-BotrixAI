/**
 * Threshold Monitoring System
 * Monitors user metrics and triggers alerts when thresholds are crossed
 */

import { supabaseAdmin } from './supabase'
import { createNotification } from './notifications'
import { sendUsageAlertEmail } from './transactional-emails'
import { getNotificationPreferences } from './notifications'

export type ThresholdType = 'credits_low' | 'scan_threshold' | 'domain_verification'

/**
 * Checks if credits are low and triggers alert
 */
export async function checkCreditsThreshold(userId: string): Promise<void> {
  try {
    // Get user credits
    const { data: user } = await supabaseAdmin!
      .from('User')
      .select('credits, email, name')
      .eq('id', userId)
      .single()

    if (!user) return

    // Get user threshold preferences
    const preferences = await getNotificationPreferences(userId)
    const creditsThreshold =
      preferences?.thresholds?.credits_low || parseInt(process.env.CREDITS_LOW_THRESHOLD || '10')

    // Check if credits are below threshold
    if ((user.credits || 0) <= creditsThreshold) {
      // Check if alert already exists and is unresolved
      const { data: existingAlert } = await supabaseAdmin!
        .from('ThresholdAlert')
        .select('id')
        .eq('userId', userId)
        .eq('thresholdType', 'credits_low')
        .eq('isResolved', false)
        .maybeSingle()

      // Create alert if not exists
      if (!existingAlert) {
        await supabaseAdmin!.from('ThresholdAlert').insert({
          userId,
          thresholdType: 'credits_low',
          thresholdValue: creditsThreshold,
          currentValue: user.credits || 0,
          isResolved: false,
          metadata: { message: `Credits below ${creditsThreshold}` },
        })

        // Create in-app notification
        await createNotification({
          userId,
          type: 'credit_low',
          title: 'Low Credits Warning',
          message: `Your account has ${user.credits || 0} credits remaining. Please top up to avoid service interruption.`,
          actionUrl: '/dashboard/settings/billing',
          actionLabel: 'Top Up Credits',
        })

        // Send email if enabled
        const prefs = await getNotificationPreferences(userId)
        if (prefs?.emailEnabled) {
          await sendUsageAlertEmail(
            userId,
            user.email || '',
            user.name || 'User',
            {
              type: 'credits_low',
              threshold: creditsThreshold,
              currentValue: user.credits || 0,
              message: `Your account has ${user.credits || 0} credits remaining. Please top up to avoid service interruption.`,
            }
          )
        }
      }
    } else {
      // Resolve existing alert if credits are back above threshold
      await supabaseAdmin!
        .from('ThresholdAlert')
        .update({
          isResolved: true,
          resolvedAt: new Date().toISOString(),
        })
        .eq('userId', userId)
        .eq('thresholdType', 'credits_low')
        .eq('isResolved', false)
    }
  } catch (error) {
    console.error('Error checking credits threshold:', error)
  }
}

/**
 * Checks if scan threshold is crossed
 */
export async function checkScanThreshold(qrCodeId: string, userId: string): Promise<void> {
  try {
    // Get QR code scan count
    const { data: qrCode } = await supabaseAdmin!
      .from('QrCode')
      .select('scanCount, maxScans, title')
      .eq('id', qrCodeId)
      .single()

    if (!qrCode || !qrCode.maxScans) return

    // Check if scan count is approaching or at max
    const percentageUsed = (qrCode.scanCount / qrCode.maxScans) * 100

    // Alert at 80% and 100%
    if (percentageUsed >= 80 && percentageUsed < 100) {
      // Check if alert already exists
      const { data: existingAlert } = await supabaseAdmin!
        .from('ThresholdAlert')
        .select('id')
        .eq('userId', userId)
        .eq('thresholdType', 'scan_threshold')
        .eq('metadata->>qrCodeId', qrCodeId)
        .eq('isResolved', false)
        .maybeSingle()

      if (!existingAlert) {
        await supabaseAdmin!.from('ThresholdAlert').insert({
          userId,
          thresholdType: 'scan_threshold',
          thresholdValue: Math.floor(qrCode.maxScans * 0.8),
          currentValue: qrCode.scanCount,
          metadata: {
            qrCodeId,
            qrCodeTitle: qrCode.title,
            percentageUsed: Math.round(percentageUsed),
          },
          isResolved: false,
        })

        await createNotification({
          userId,
          type: 'threshold_crossed',
          title: 'QR Code Scan Limit Warning',
          message: `QR Code "${qrCode.title || 'Untitled'}" has reached ${Math.round(percentageUsed)}% of its scan limit.`,
          actionUrl: `/dashboard?highlight=${qrCodeId}`,
          actionLabel: 'View QR Code',
          metadata: { qrCodeId },
        })
      }
    }
  } catch (error) {
    console.error('Error checking scan threshold:', error)
  }
}

/**
 * Sends domain verification notification
 */
export async function sendDomainVerificationNotification(
  userId: string,
  domain: string,
  verified: boolean
): Promise<void> {
  try {
    const { data: user } = await supabaseAdmin!
      .from('User')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (verified) {
      await createNotification({
        userId,
        type: 'domain_verified',
        title: 'Domain Verified',
        message: `Your custom domain ${domain} has been successfully verified.`,
        actionUrl: '/dashboard/settings/domains',
        actionLabel: 'View Domains',
        metadata: { domain },
      })

      // Send email if enabled
      const prefs = await getNotificationPreferences(userId)
      if (prefs?.emailEnabled && user?.email) {
        await sendUsageAlertEmail(
          userId,
          user.email,
          user.name || 'User',
          {
            type: 'domain_verification',
            threshold: 0,
            currentValue: 0,
            message: `Your custom domain ${domain} has been successfully verified.`,
          }
        )
      }
    } else {
      await createNotification({
        userId,
        type: 'warning',
        title: 'Domain Verification Required',
        message: `Please verify your custom domain ${domain} by adding the required DNS records.`,
        actionUrl: '/dashboard/settings/domains',
        actionLabel: 'Verify Domain',
        metadata: { domain },
      })
    }
  } catch (error) {
    console.error('Error sending domain verification notification:', error)
  }
}

/**
 * Resolves a threshold alert
 */
export async function resolveThresholdAlert(alertId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin!
      .from('ThresholdAlert')
      .update({
        isResolved: true,
        resolvedAt: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('userId', userId)

    return !error
  } catch (error) {
    console.error('Error resolving threshold alert:', error)
    return false
  }
}

/**
 * Gets active threshold alerts for a user
 */
export async function getUserThresholdAlerts(userId: string): Promise<any[]> {
  try {
    const { data: alerts, error } = await supabaseAdmin!
      .from('ThresholdAlert')
      .select('*')
      .eq('userId', userId)
      .eq('isResolved', false)
      .order('createdAt', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch threshold alerts')
    }

    return alerts || []
  } catch (error) {
    console.error('Error fetching threshold alerts:', error)
    return []
  }
}

