/**
 * Email Digest System
 * Sends periodic email digests for threshold crossings and notifications
 */

import { supabaseAdmin } from './supabase'
import { getNotificationPreferences } from './notifications'
import { sendUsageAlertEmail } from './transactional-emails'

export interface DigestItem {
  type: 'threshold_crossed' | 'credit_low' | 'scan_threshold' | 'domain_verified'
  title: string
  message: string
  timestamp: string
}

/**
 * Generates and sends email digest for a user
 */
export async function generateEmailDigest(userId: string): Promise<void> {
  try {
    const preferences = await getNotificationPreferences(userId)
    
    // Check if user wants email digests
    if (!preferences?.emailEnabled || preferences.emailFrequency === 'immediate') {
      return
    }

    // Get user info
    const { data: user } = await supabaseAdmin!
      .from('User')
      .select('email, name')
      .eq('id', userId)
      .single()

    if (!user?.email) {
      return
    }

    // Get date range based on frequency
    const now = new Date()
    let startDate: Date
    
    if (preferences.emailFrequency === 'daily') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
    } else if (preferences.emailFrequency === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    } else {
      return // Immediate, don't send digest
    }

    // Get notifications in range
    const { data: notifications } = await supabaseAdmin!
      .from('Notification')
      .select('*')
      .eq('userId', userId)
      .gte('createdAt', startDate.toISOString())
      .in('type', ['usage_alert', 'credit_low', 'threshold_crossed', 'domain_verified'])
      .order('createdAt', { ascending: false })

    // Get threshold alerts in range
    const { data: alerts } = await supabaseAdmin!
      .from('ThresholdAlert')
      .select('*')
      .eq('userId', userId)
      .eq('isResolved', false)
      .gte('createdAt', startDate.toISOString())
      .order('createdAt', { ascending: false })

    // Only send if there are items to digest
    if ((notifications && notifications.length > 0) || (alerts && alerts.length > 0)) {
      await sendEmailDigest(userId, user.email, user.name || 'User', notifications || [], alerts || [])
    }
  } catch (error) {
    console.error('Error generating email digest:', error)
  }
}

/**
 * Sends email digest email
 */
async function sendEmailDigest(
  userId: string,
  email: string,
  name: string,
  notifications: any[],
  alerts: any[]
): Promise<void> {
  const APP_NAME = process.env.APP_NAME || 'QR Generator'
  const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Build digest content
  const items: DigestItem[] = []

  // Add notifications
  for (const notification of notifications) {
    items.push({
      type: notification.type as any,
      title: notification.title,
      message: notification.message,
      timestamp: notification.createdAt,
    })
  }

  // Add alerts
  for (const alert of alerts) {
    items.push({
      type: alert.thresholdType as any,
      title: `Threshold Alert: ${alert.thresholdType.replace('_', ' ')}`,
      message: `Current value: ${alert.currentValue}, Threshold: ${alert.thresholdValue}`,
      timestamp: alert.createdAt,
    })
  }

  // Sort by timestamp
  items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Generate HTML email
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your ${APP_NAME} Digest</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #3498db; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h1 style="color: white; margin-top: 0;">Your ${APP_NAME} Digest</h1>
      </div>
      
      <p>Hi ${name},</p>
      
      <p>Here's a summary of your activity and alerts from the past ${items.length > 0 ? 'period' : 'day'}:</p>
      
      ${items.length === 0 ? '<p>No new notifications or alerts to report.</p>' : ''}
      
      ${items.map((item) => `
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3498db;">
          <h3 style="margin-top: 0;">${item.title}</h3>
          <p>${item.message}</p>
          <p style="color: #999; font-size: 12px;">${new Date(item.timestamp).toLocaleString()}</p>
        </div>
      `).join('')}
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${APP_URL}/dashboard" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dashboard</a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="color: #999; font-size: 12px;">You can change your email frequency preferences in your <a href="${APP_URL}/dashboard/settings">settings</a>.</p>
      
      <p style="color: #999; font-size: 12px;">This is an automated message from ${APP_NAME}.</p>
    </body>
    </html>
  `

  const subject = `Your ${APP_NAME} Digest - ${items.length} ${items.length === 1 ? 'update' : 'updates'}`

  // Send email
  const { sendEmail } = await import('./email')
  await sendEmail({
    to: email,
    toName: name,
    subject,
    htmlBody,
    templateName: 'email_digest',
    templateVariables: { name, items, appName: APP_NAME },
    userId,
  })
}

/**
 * Sends daily email digests (should be called by a scheduled job)
 */
export async function sendDailyEmailDigests(): Promise<void> {
  try {
    // Get all users with daily email frequency
    const { data: preferences } = await supabaseAdmin!
      .from('NotificationPreference')
      .select('userId')
      .eq('emailEnabled', true)
      .eq('emailFrequency', 'daily')

    if (!preferences) {
      return
    }

    // Generate digest for each user
    for (const pref of preferences) {
      await generateEmailDigest(pref.userId)
    }
  } catch (error) {
    console.error('Error sending daily email digests:', error)
  }
}

/**
 * Sends weekly email digests (should be called by a scheduled job)
 */
export async function sendWeeklyEmailDigests(): Promise<void> {
  try {
    // Get all users with weekly email frequency
    const { data: preferences } = await supabaseAdmin!
      .from('NotificationPreference')
      .select('userId')
      .eq('emailEnabled', true)
      .eq('emailFrequency', 'weekly')

    if (!preferences) {
      return
    }

    // Generate digest for each user
    for (const pref of preferences) {
      await generateEmailDigest(pref.userId)
    }
  } catch (error) {
    console.error('Error sending weekly email digests:', error)
  }
}

