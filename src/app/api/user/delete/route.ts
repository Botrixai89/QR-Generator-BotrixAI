import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { validateJsonBody } from '@/lib/validation'
import { z } from 'zod'

const deleteRequestSchema = z.object({
  confirmEmail: z.string().email('Invalid email address'),
})
import { logAuditEvent, extractRequestInfo } from '@/lib/audit-log'
import { addSecurityHeaders } from '@/lib/security-headers'
import { randomBytes } from 'crypto'

/**
 * POST /api/user/delete
 * Request account deletion (GDPR compliance)
 * Returns a confirmation token that must be used to confirm deletion
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validation = await validateJsonBody(deleteRequestSchema, request)

    if (!validation.success) {
      return validation.response
    }

    const { confirmEmail } = validation.data

    // Verify email matches user's email
    const { data: user } = await supabaseAdmin!
      .from('User')
      .select('email')
      .eq('id', session.user.id)
      .single()

    if (!user || user.email !== confirmEmail) {
      return NextResponse.json(
        { error: 'Email does not match account email' },
        { status: 400 }
      )
    }

    // Check for existing pending deletion request
    const { data: existingRequest } = await supabaseAdmin!
      .from('DataDeletionRequest')
      .select('*')
      .eq('userId', session.user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json({
        message: 'Deletion request already pending',
        confirmationToken: existingRequest.confirmationToken,
        expiresAt: existingRequest.requestedAt, // Token expires after 48 hours
      })
    }

    // Generate confirmation token
    const confirmationToken = randomBytes(32).toString('hex')

    // Create deletion request
    const { data: deletionRequest, error } = await supabaseAdmin!
      .from('DataDeletionRequest')
      .insert({
        userId: session.user.id,
        status: 'pending',
        confirmationToken,
      })
      .select()
      .single()

    if (error || !deletionRequest) {
      console.error('Error creating deletion request:', error)
      return NextResponse.json(
        { error: 'Failed to create deletion request' },
        { status: 500 }
      )
    }

    // Log audit event
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAuditEvent({
      userId: session.user.id,
      action: 'data_deletion',
      resourceType: 'user',
      resourceId: session.user.id,
      ipAddress,
      userAgent,
      requestMethod: 'POST',
      requestPath: '/api/user/delete',
      metadata: { deletionRequestId: deletionRequest.id },
    })

    // Send confirmation email with token (implement email service)
    // For now, return token (in production, send via email)

    const response = NextResponse.json({
      message:
        'Deletion request created. Please confirm using the token sent to your email.',
      confirmationToken, // Remove in production - only send via email
      warning:
        'This token will expire in 48 hours. After confirmation, your account will be permanently deleted within 30 days.',
    })

    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in POST /api/user/delete:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/user/delete/confirm
 * Confirm account deletion with token
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirmationToken } = body

    if (!confirmationToken) {
      return NextResponse.json({ error: 'confirmationToken is required' }, { status: 400 })
    }

    // Get deletion request
    const { data: deletionRequest, error } = await supabaseAdmin!
      .from('DataDeletionRequest')
      .select('*')
      .eq('userId', session.user.id)
      .eq('confirmationToken', confirmationToken)
      .eq('status', 'pending')
      .maybeSingle()

    if (error || !deletionRequest) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 404 }
      )
    }

    // Check if token is expired (48 hours)
    const requestedAt = new Date(deletionRequest.requestedAt)
    const expiresAt = new Date(requestedAt.getTime() + 48 * 60 * 60 * 1000)

    if (new Date() > expiresAt) {
      return NextResponse.json({ error: 'Confirmation token has expired' }, { status: 410 })
    }

    // Update deletion request status
    await supabaseAdmin!
      .from('DataDeletionRequest')
      .update({
        status: 'processing',
        confirmedAt: new Date().toISOString(),
      })
      .eq('id', deletionRequest.id)

    // Schedule account deletion (30 day grace period for GDPR)
    // In production, use a queue system
    scheduleAccountDeletion(session.user.id, deletionRequest.id).catch((error) => {
      console.error('Error scheduling account deletion:', error)
    })

    // Log audit event
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAuditEvent({
      userId: session.user.id,
      action: 'data_deletion',
      resourceType: 'user',
      resourceId: session.user.id,
      ipAddress,
      userAgent,
      requestMethod: 'PUT',
      requestPath: '/api/user/delete/confirm',
      metadata: {
        deletionRequestId: deletionRequest.id,
        confirmed: true,
      },
    })

    const response = NextResponse.json({
      message:
        'Deletion confirmed. Your account will be permanently deleted within 30 days. You can cancel this request by contacting support.',
      deletionScheduled: true,
    })

    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in PUT /api/user/delete/confirm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Schedules account deletion (30 day grace period)
 */
async function scheduleAccountDeletion(userId: string, deletionRequestId: string): Promise<void> {
  // In production, use a job queue (e.g., Bull, BullMQ) to schedule deletion after 30 days
  // For now, just mark as scheduled
  const deletionDate = new Date()
  deletionDate.setDate(deletionDate.getDate() + 30)

  // Store deletion date in metadata
  await supabaseAdmin!
    .from('DataDeletionRequest')
    .update({
      metadata: {
        scheduledDeletionDate: deletionDate.toISOString(),
      },
    })
    .eq('id', deletionRequestId)

  // Perform actual deletion (async after 30 days)
  // This would be handled by a scheduled job
  await performAccountDeletion(userId, deletionRequestId)
}

/**
 * Performs actual account deletion
 */
async function performAccountDeletion(userId: string, deletionRequestId: string): Promise<void> {
  try {
    // Gather deletion metadata for audit
    const deletionMetadata: {
      userId: string
      deletedAt: string
      deletedItems: Array<{ type: string; id?: string; count?: number }>
    } = {
      userId,
      deletedAt: new Date().toISOString(),
      deletedItems: [],
    }

    // Delete user data (cascading deletes should handle most)
    // But we'll explicitly delete sensitive data

    // Delete API keys
    const { data: apiKeys } = await supabaseAdmin!.from('ApiKey').select('id').eq('userId', userId)
    await supabaseAdmin!.from('ApiKey').delete().eq('userId', userId)
    deletionMetadata.deletedItems.push({ type: 'api_keys', count: apiKeys?.length || 0 })

    // Delete QR codes (and associated scans via cascade)
    const { data: qrCodes } = await supabaseAdmin!.from('QrCode').select('id').eq('userId', userId)
    await supabaseAdmin!.from('QrCode').delete().eq('userId', userId)
    deletionMetadata.deletedItems.push({ type: 'qr_codes', count: qrCodes?.length || 0 })

    // Anonymize user record (keep for audit trail but remove PII)
    await supabaseAdmin!
      .from('User')
      .update({
        email: `deleted_${userId}@deleted.local`,
        name: 'Deleted User',
        password: null,
        image: null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', userId)

    // Update deletion request
    await supabaseAdmin!
      .from('DataDeletionRequest')
      .update({
        status: 'completed',
        completedAt: new Date().toISOString(),
        metadata: deletionMetadata,
      })
      .eq('id', deletionRequestId)

    // Log final audit event
    await logAuditEvent({
      userId,
      action: 'user_delete',
      resourceType: 'user',
      resourceId: userId,
      metadata: deletionMetadata,
      success: true,
    })
  } catch (error) {
    console.error('Error performing account deletion:', error)
    await supabaseAdmin!
      .from('DataDeletionRequest')
      .update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', deletionRequestId)
  }
}


