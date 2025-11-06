/**
 * Notification System
 * Handles in-app notifications and email digests
 */

import { supabaseAdmin } from './supabase'
import { sendUsageAlertEmail } from './transactional-emails'

export type NotificationType =
  | 'info'
  | 'warning'
  | 'error'
  | 'success'
  | 'usage_alert'
  | 'credit_low'
  | 'domain_verified'
  | 'threshold_crossed'

export interface NotificationInput {
  userId: string
  organizationId?: string
  type: NotificationType
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, unknown>
}

/**
 * Creates an in-app notification
 */
export async function createNotification(input: NotificationInput): Promise<string | null> {
  try {
    if (!supabaseAdmin) {
      return null
    }
    const { data: notification, error } = await supabaseAdmin!
      .from('Notification')
      .insert({
        userId: input.userId,
        organizationId: input.organizationId || null,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl || null,
        actionLabel: input.actionLabel || null,
        metadata: input.metadata || null,
        isRead: false,
      })
      .select()
      .single()

    if (error || !notification) {
      if ((error as { code?: string })?.code === 'PGRST205') {
        // Table does not exist in this environment; skip silently
        return null
      }
      console.error('Error creating notification:', error)
      return null
    }

    // Check if user wants email notifications for this type
    await sendNotificationEmailIfEnabled(input.userId, input)

    return notification.id
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Gets user notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<{ notifications: Array<Record<string, unknown>>; total: number }> {
  try {
    if (!supabaseAdmin) {
      return { notifications: [], total: 0 }
    }
    const baseQuery = supabaseAdmin!
      .from('Notification')
      .select('*', { count: 'exact' })
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .limit(limit)
    const query = unreadOnly
      ? baseQuery.eq('isRead', false)
      : baseQuery

    const { data: paged, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      if ((error as { code?: string })?.code === 'PGRST205') {
        return { notifications: [], total: 0 }
      }
      throw new Error('Failed to fetch notifications')
    }

    return {
      notifications: paged || [],
      total: count || 0,
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return { notifications: [], total: 0 }
  }
}

/**
 * Marks notification as read
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin!
      .from('Notification')
      .update({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('userId', userId)

    return !error
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

/**
 * Marks all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) return true
    const { error } = await supabaseAdmin!
      .from('Notification')
      .update({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .eq('userId', userId)
      .eq('isRead', false)

    if ((error as { code?: string })?.code === 'PGRST205') return true
    return !error
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

/**
 * Gets unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    if (!supabaseAdmin) return 0
    const { count, error } = await supabaseAdmin!
      .from('Notification')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('isRead', false)

    if (error) {
      if ((error as { code?: string })?.code === 'PGRST205') return 0
      throw new Error('Failed to fetch unread count')
    }

    return count || 0
  } catch (error) {
    console.error('Error fetching unread count:', error)
    return 0
  }
}

/**
 * Checks if user wants email notifications and sends if enabled
 */
async function sendNotificationEmailIfEnabled(
  userId: string,
  notification: NotificationInput
): Promise<void> {
  try {
    // Get user notification preferences
    const { data: preferences } = await supabaseAdmin!
      .from('NotificationPreference')
      .select('*')
      .eq('userId', userId)
      .maybeSingle()

    // Default to enabled if no preferences
    if (!preferences || preferences.emailEnabled === true) {
      // Get user email
      const { data: user } = await supabaseAdmin!
        .from('User')
        .select('email, name')
        .eq('id', userId)
        .single()

      if (user?.email && notification.type === 'usage_alert') {
        await sendUsageAlertEmail(
          userId,
          user.email,
          user.name || 'User',
          {
            type: 'threshold_crossed',
            threshold: 0,
            currentValue: 0,
            message: notification.message,
          }
        )
      }
    }
  } catch (error) {
    // Don't fail if email sending fails
    console.error('Error sending notification email:', error)
  }
}

/**
 * Gets or creates notification preferences for user
 */
export async function getNotificationPreferences(userId: string): Promise<{
  userId: string
  emailEnabled: boolean
  inAppEnabled: boolean
  emailFrequency: 'immediate' | 'daily' | 'weekly'
  notificationTypes: Record<string, unknown>
  thresholds: Record<string, number>
} | null> {
  try {
    if (!supabaseAdmin) {
      return {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        emailFrequency: 'immediate',
        notificationTypes: {},
        thresholds: {},
      }
    }
    const result = await supabaseAdmin!
      .from('NotificationPreference')
      .select('*')
      .eq('userId', userId)
      .maybeSingle()
    
    let preferences = result.data
    const prefError = result.error

    // Create default preferences if not found
    if (!preferences) {
      const { data: newPreferences, error } = await supabaseAdmin!
        .from('NotificationPreference')
        .insert({
          userId,
          emailEnabled: true,
          inAppEnabled: true,
          emailFrequency: 'immediate',
          notificationTypes: {},
          thresholds: {},
        })
        .select()
        .single()

      if (error || !newPreferences) {
        if ((error as { code?: string })?.code === 'PGRST205' || (prefError as { code?: string })?.code === 'PGRST205') {
          return {
            userId,
            emailEnabled: true,
            inAppEnabled: true,
            emailFrequency: 'immediate',
            notificationTypes: {},
            thresholds: {},
          }
        }
        throw new Error('Failed to create notification preferences')
      }

      preferences = newPreferences
    }

    return preferences
  } catch (error) {
    console.error('Error getting notification preferences:', error)
    return null
  }
}

/**
 * Updates notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  updates: {
    emailEnabled?: boolean
    inAppEnabled?: boolean
    emailFrequency?: 'immediate' | 'daily' | 'weekly'
    notificationTypes?: Record<string, unknown>
    thresholds?: Record<string, number>
  }
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin!
      .from('NotificationPreference')
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', userId)

    return !error
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return false
  }
}

