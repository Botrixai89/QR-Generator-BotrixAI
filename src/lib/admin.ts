/**
 * Admin Utilities
 * Helper functions for admin operations and access control
 */

import { supabaseAdmin } from '@/lib/supabase'
import { logAuditEvent } from '@/lib/audit-log'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string | null
  plan: string | null
  credits: number | null
  createdAt: string
  updatedAt: string | null
  image: string | null
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin!
      .from('User')
      .select('role')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return false
    }
    
    return user.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if email is in admin list (legacy support)
 */
export function isAdminEmail(email?: string | null): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return !!email && adminEmails.includes(email.toLowerCase())
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const admin = await isAdmin(userId)
  if (!admin) {
    throw new Error('Admin access required')
  }
}

/**
 * Get all users with pagination
 */
export async function getUsers(
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ users: AdminUser[]; total: number }> {
  let query = supabaseAdmin!
    .from('User')
    .select('id, email, name, role, plan, credits, "createdAt", "updatedAt", image', { count: 'exact' })
  
  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }
  
  const offset = (page - 1) * limit
  query = query.order('createdAt', { ascending: false })
    .range(offset, offset + limit - 1)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
  
  return {
    users: (data || []) as AdminUser[],
    total: count || 0,
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AdminUser | null> {
  const { data, error } = await supabaseAdmin!
    .from('User')
    .select('id, email, name, role, plan, credits, "createdAt", "updatedAt", image')
    .eq('id', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as AdminUser
}

/**
 * Update user
 */
export async function updateUser(
  userId: string,
  updates: Partial<AdminUser>,
  adminUserId: string
): Promise<void> {
  await requireAdmin(adminUserId)
  
  const { error } = await supabaseAdmin!
    .from('User')
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to update user: ${error.message}`)
  }
  
  // Log audit event
  await logAuditEvent({
    userId: adminUserId,
    action: 'user_update',
    resourceType: 'user',
    resourceId: userId,
    metadata: { updates },
  })
}

/**
 * Lock user account
 */
export async function lockUser(
  userId: string,
  reason: string,
  adminUserId: string
): Promise<void> {
  await requireAdmin(adminUserId)
  
  await updateUser(userId, { role: 'locked' }, adminUserId)
  
  // Store lockout reason in metadata
  const { error } = await supabaseAdmin!
    .from('User')
    .update({
      metadata: { locked: true, lockReason: reason, lockedAt: new Date().toISOString(), lockedBy: adminUserId },
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to lock user: ${error.message}`)
  }
  
  // Log audit event
  await logAuditEvent({
    userId: adminUserId,
    action: 'user_lock',
    resourceType: 'user',
    resourceId: userId,
    metadata: { reason },
  })
}

/**
 * Unlock user account
 */
export async function unlockUser(
  userId: string,
  adminUserId: string
): Promise<void> {
  await requireAdmin(adminUserId)
  
  const { error } = await supabaseAdmin!
    .from('User')
    .update({
      role: 'user',
      metadata: null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to unlock user: ${error.message}`)
  }
  
  // Log audit event
  await logAuditEvent({
    userId: adminUserId,
    action: 'user_unlock',
    resourceType: 'user',
    resourceId: userId,
  })
}

/**
 * Grant credits to user
 */
export async function grantCredits(
  userId: string,
  credits: number,
  reason: string,
  adminUserId: string
): Promise<void> {
  await requireAdmin(adminUserId)
  
  // Get current credits
  const user = await getUserById(userId)
  if (!user) {
    throw new Error('User not found')
  }
  
  const newCredits = (user.credits || 0) + credits
  
  await updateUser(userId, { credits: newCredits }, adminUserId)
  
  // Record in billing adjustments
  await supabaseAdmin!.from('BillingAdjustment').insert({
    userId,
    type: 'credit_grant',
    amountCents: credits * 100, // Convert to cents
    reason,
    createdBy: adminUserId,
  })
  
  // Log audit event
  await logAuditEvent({
    userId: adminUserId,
    action: 'credits_grant',
    resourceType: 'user',
    resourceId: userId,
    metadata: { credits, reason },
  })
}

