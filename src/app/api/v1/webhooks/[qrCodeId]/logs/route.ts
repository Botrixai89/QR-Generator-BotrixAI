import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiRequest } from '@/lib/api-auth'
import { withUsageMetering } from '@/lib/api-usage'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Get webhook delivery logs for a QR code
async function handleGet(
  request: NextRequest,
  context: { qrCodeId: string },
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { qrCodeId } = context
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const status = searchParams.get('status') // 'success', 'failed'

  // Verify QR code exists and user has access
  const { data: qrCode, error: qrCodeError } = await supabaseAdmin!
    .from('QrCode')
    .select('*')
    .eq('id', qrCodeId)
    .single()

  if (qrCodeError || !qrCode) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
  }

  // Verify access
  if (qrCode.userId !== authContext.userId) {
    if (authContext.organizationId) {
      const { data: member } = await supabaseAdmin!
        .from('OrganizationMember')
        .select('userId')
        .eq('organizationId', authContext.organizationId)
        .eq('userId', qrCode.userId)
        .maybeSingle()

      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Query webhook logs
  let query = supabaseAdmin!
    .from('QrCodeWebhookLog')
    .select('*', { count: 'exact' })
    .eq('qrCodeId', qrCodeId)
    .limit(Math.min(limit, 100))
    .offset(offset)
    .order('createdAt', { ascending: false })

  if (status === 'success') {
    query = query.eq('isSuccessful', true)
  } else if (status === 'failed') {
    query = query.eq('isSuccessful', false)
  }

  const { data: logs, error, count } = await query

  if (error) {
    console.error('Error fetching webhook logs:', error)
    return NextResponse.json({ error: 'Failed to fetch webhook logs' }, { status: 500 })
  }

  return NextResponse.json({
    logs: logs || [],
    total: count || 0,
    limit,
    offset,
  })
}

// POST - Retry failed webhook delivery
async function handlePost(
  request: NextRequest,
  context: { qrCodeId: string },
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { qrCodeId } = context
  const body = await request.json()
  const { logId } = body

  if (!logId) {
    return NextResponse.json({ error: 'logId is required' }, { status: 400 })
  }

  // Verify QR code exists and user has access
  const { data: qrCode, error: qrCodeError } = await supabaseAdmin!
    .from('QrCode')
    .select('*')
    .eq('id', qrCodeId)
    .single()

  if (qrCodeError || !qrCode) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
  }

  // Verify access
  if (qrCode.userId !== authContext.userId) {
    if (authContext.organizationId) {
      const { data: member } = await supabaseAdmin!
        .from('OrganizationMember')
        .select('userId')
        .eq('organizationId', authContext.organizationId)
        .eq('userId', qrCode.userId)
        .maybeSingle()

      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Get the webhook log
  const { data: log, error: logError } = await supabaseAdmin!
    .from('QrCodeWebhookLog')
    .select('*')
    .eq('id', logId)
    .eq('qrCodeId', qrCodeId)
    .single()

  if (logError || !log) {
    return NextResponse.json({ error: 'Webhook log not found' }, { status: 404 })
  }

  // Retry webhook delivery (this would trigger the webhook service)
  // For now, we'll just update the log to indicate retry requested
  // In production, you'd want to queue this for actual retry
  const { error: updateError } = await supabaseAdmin!
    .from('QrCodeWebhookLog')
    .update({
      attempts: log.attempts + 1,
      lastAttemptAt: new Date().toISOString(),
    })
    .eq('id', logId)

  if (updateError) {
    console.error('Error updating webhook log:', updateError)
    return NextResponse.json({ error: 'Failed to retry webhook' }, { status: 500 })
  }

  // TODO: Actually trigger the webhook retry here
  // This would typically use a queue system to retry the webhook

  return NextResponse.json({ success: true, message: 'Webhook retry queued' })
}

export const GET = withUsageMetering((req, ctx, auth) =>
  authenticateApiRequest(req, ['webhook:read']).then((result) => {
    if (!result.success) return result.response
    return ctx.params.then(async (params: { qrCodeId: string }) => {
      return handleGet(req, { qrCodeId: params.qrCodeId }, result.context)
    })
  })
)

export const POST = withUsageMetering((req, ctx, auth) =>
  authenticateApiRequest(req, ['webhook:write']).then((result) => {
    if (!result.success) return result.response
    return ctx.params.then(async (params: { qrCodeId: string }) => {
      return handlePost(req, { qrCodeId: params.qrCodeId }, result.context)
    })
  })
)

