/**
 * Audit Logging System
 * Logs sensitive actions for compliance and security monitoring
 */

import { supabaseAdmin } from './supabase'

export type AuditAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'api_key_create'
  | 'api_key_delete'
  | 'api_key_rotate'
  | 'api_key_update'
  | 'billing_update'
  | 'billing_subscription_create'
  | 'billing_subscription_cancel'
  | 'domain_create'
  | 'domain_update'
  | 'domain_delete'
  | 'user_delete'
  | 'data_export'
  | 'data_deletion'
  | 'password_change'
  | 'organization_create'
  | 'organization_delete'
  | 'organization_transfer'
  | 'qr_code_delete'
  | 'webhook_create'
  | 'webhook_delete'
  | 'webhook_secret_rotate'

export type ResourceType =
  | 'user'
  | 'api_key'
  | 'billing'
  | 'domain'
  | 'qr_code'
  | 'organization'
  | 'webhook'
  | 'subscription'

export interface AuditLogMetadata {
  [key: string]: any
}

export interface AuditLogInput {
  userId?: string | null
  organizationId?: string | null
  action: AuditAction
  resourceType: ResourceType
  resourceId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  requestMethod?: string | null
  requestPath?: string | null
  metadata?: AuditLogMetadata
  success?: boolean
  errorMessage?: string | null
}

/**
 * Creates an audit log entry
 */
export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    await supabaseAdmin!.from('AuditLog').insert({
      userId: input.userId || null,
      organizationId: input.organizationId || null,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      requestMethod: input.requestMethod || null,
      requestPath: input.requestPath || null,
      metadata: input.metadata || null,
      success: input.success !== undefined ? input.success : true,
      errorMessage: input.errorMessage || null,
    })
  } catch (error) {
    // Don't fail the request if audit logging fails
    // But log to console for monitoring
    console.error('Failed to create audit log:', error)
  }
}

/**
 * Gets audit logs for a user or organization
 */
export async function getAuditLogs(
  userId?: string,
  organizationId?: string,
  limit: number = 100,
  offset: number = 0,
  action?: AuditAction,
  startDate?: Date,
  endDate?: Date
): Promise<{
  logs: any[]
  total: number
}> {
  let query = supabaseAdmin!.from('AuditLog').select('*', { count: 'exact' })

  if (userId) {
    query = query.eq('userId', userId)
  } else if (organizationId) {
    query = query.eq('organizationId', organizationId)
  }

  if (action) {
    query = query.eq('action', action)
  }

  if (startDate) {
    query = query.gte('createdAt', startDate.toISOString())
  }

  if (endDate) {
    query = query.lte('createdAt', endDate.toISOString())
  }

  query = query
    .order('createdAt', { ascending: false })
    .limit(limit)
    .offset(offset)

  const { data, error, count } = await query

  if (error) {
    throw new Error('Failed to fetch audit logs')
  }

  return {
    logs: data || [],
    total: count || 0,
  }
}

/**
 * Helper to extract IP address and user agent from request
 */
export function extractRequestInfo(request: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  // In Next.js, we need to get this from headers
  // This is a simplified version - you'd need to adapt based on your hosting
  const userAgent = request.headers.get('user-agent') || null
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null

  return { ipAddress, userAgent }
}

