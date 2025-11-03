import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { validateQuery } from '@/lib/validation'
import { logAuditEvent, extractRequestInfo } from '@/lib/audit-log'
import { addSecurityHeaders } from '@/lib/security-headers'

const exportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
})

/**
 * GET /api/user/export
 * Request a data export for GDPR compliance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validation = validateQuery(exportQuerySchema, searchParams)

    if (!validation.success) {
      return validation.response
    }

    const { format } = validation.data

    // Create export request
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expires in 7 days

    const { data: exportRequest, error } = await supabaseAdmin!
      .from('DataExportRequest')
      .insert({
        userId: session.user.id,
        format,
        status: 'pending',
        expiresAt: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error || !exportRequest) {
      console.error('Error creating export request:', error)
      return NextResponse.json(
        { error: 'Failed to create export request' },
        { status: 500 }
      )
    }

    // Log audit event
    const { ipAddress, userAgent } = extractRequestInfo(request)
    await logAuditEvent({
      userId: session.user.id,
      action: 'data_export',
      resourceType: 'user',
      resourceId: session.user.id,
      ipAddress,
      userAgent,
      requestMethod: 'GET',
      requestPath: '/api/user/export',
      metadata: { format, exportRequestId: exportRequest.id },
    })

    // Trigger export generation (async)
    // In production, this would use a queue system
    generateExportFile(exportRequest.id, session.user.id, format).catch((error) => {
      console.error('Error generating export file:', error)
    })

    const response = NextResponse.json({
      exportRequestId: exportRequest.id,
      status: exportRequest.status,
      expiresAt: exportRequest.expiresAt,
      message: 'Export request created. File will be available for download when ready.',
    })

    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in GET /api/user/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/user/export
 * Download an export file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exportRequestId } = body

    if (!exportRequestId) {
      return NextResponse.json({ error: 'exportRequestId is required' }, { status: 400 })
    }

    // Get export request
    const { data: exportRequest, error } = await supabaseAdmin!
      .from('DataExportRequest')
      .select('*')
      .eq('id', exportRequestId)
      .eq('userId', session.user.id)
      .single()

    if (error || !exportRequest) {
      return NextResponse.json({ error: 'Export request not found' }, { status: 404 })
    }

    if (exportRequest.status !== 'completed') {
      return NextResponse.json(
        { error: 'Export not ready', status: exportRequest.status },
        { status: 202 }
      )
    }

    if (!exportRequest.fileUrl) {
      return NextResponse.json({ error: 'Export file not available' }, { status: 404 })
    }

    // Return file URL (in production, generate signed URL)
    const response = NextResponse.json({
      downloadUrl: exportRequest.fileUrl,
      expiresAt: exportRequest.expiresAt,
    })

    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in POST /api/user/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generates export file (async background job)
 */
async function generateExportFile(
  exportRequestId: string,
  userId: string,
  format: 'json' | 'csv'
): Promise<void> {
  try {
    // Update status to processing
    await supabaseAdmin!
      .from('DataExportRequest')
      .update({ status: 'processing' })
      .eq('id', exportRequestId)

    // Gather all user data
    const userData = await gatherUserData(userId)

    // Generate file based on format
    let fileUrl: string
    if (format === 'json') {
      fileUrl = await generateJsonExport(userId, userData, exportRequestId)
    } else {
      fileUrl = await generateCsvExport(userId, userData, exportRequestId)
    }

    // Update export request with file URL
    await supabaseAdmin!
      .from('DataExportRequest')
      .update({
        status: 'completed',
        fileUrl,
        completedAt: new Date().toISOString(),
      })
      .eq('id', exportRequestId)
  } catch (error) {
    console.error('Error generating export file:', error)
    await supabaseAdmin!
      .from('DataExportRequest')
      .update({
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', exportRequestId)
  }
}

/**
 * Gathers all user data for export
 */
async function gatherUserData(userId: string): Promise<any> {
  // Get user profile
  const { data: user } = await supabaseAdmin!
    .from('User')
    .select('*')
    .eq('id', userId)
    .single()

  // Get QR codes
  const { data: qrCodes } = await supabaseAdmin!
    .from('QrCode')
    .select('*')
    .eq('userId', userId)

  // Get scans
  const { data: scans } = await supabaseAdmin!
    .from('QrCodeScan')
    .select('*')
    .in(
      'qrCodeId',
      (qrCodes || []).map((q) => q.id)
    )

  // Get organizations
  const { data: organizations } = await supabaseAdmin!
    .from('OrganizationMember')
    .select('*, Organization(*)')
    .eq('userId', userId)

  // Get API keys
  const { data: apiKeys } = await supabaseAdmin!
    .from('ApiKey')
    .select('*')
    .eq('userId', userId)

  // Get billing data
  const { data: subscriptions } = await supabaseAdmin!
    .from('Subscription')
    .select('*')
    .eq('userId', userId)

  const { data: invoices } = await supabaseAdmin!
    .from('Invoice')
    .select('*')
    .eq('userId', userId)

  return {
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      createdAt: user?.createdAt,
      updatedAt: user?.updatedAt,
    },
    qrCodes: qrCodes || [],
    scans: scans || [],
    organizations: organizations || [],
    apiKeys: (apiKeys || []).map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      scopes: k.scopes,
      createdAt: k.createdAt,
      lastUsedAt: k.lastUsedAt,
    })),
    subscriptions: subscriptions || [],
    invoices: invoices || [],
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Generates JSON export file
 */
async function generateJsonExport(
  userId: string,
  data: any,
  exportRequestId: string
): Promise<string> {
  // In production, upload to S3/cloud storage
  // For now, return a placeholder
  const jsonData = JSON.stringify(data, null, 2)
  // Store in database or upload to storage service
  // Return signed URL or storage path
  return `https://your-storage.com/exports/${exportRequestId}.json`
}

/**
 * Generates CSV export file
 */
async function generateCsvExport(
  userId: string,
  data: any,
  exportRequestId: string
): Promise<string> {
  // Convert to CSV format
  // In production, use a CSV library and upload to storage
  // For now, return a placeholder
  return `https://your-storage.com/exports/${exportRequestId}.csv`
}


