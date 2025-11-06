import { NextRequest, NextResponse } from 'next/server'
import { withUsageMetering } from '@/lib/api-usage'
import { supabaseAdmin } from '@/lib/supabase'
import { hasScope } from '@/lib/api-keys'
import crypto from 'crypto'

// GET - List webhooks for user/org's QR codes
async function handleGet(
  request: NextRequest,
  context: unknown,
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { searchParams } = new URL(request.url)
  const qrCodeId = searchParams.get('qrCodeId')

  // Get QR codes owned by user/org
  let qrCodeQuery = supabaseAdmin!.from('QrCode').select('id')

  if (authContext.organizationId) {
    const { data: members } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('userId')
      .eq('organizationId', authContext.organizationId)

    if (members && members.length > 0) {
      const userIds = members.map((m) => m.userId)
      qrCodeQuery = qrCodeQuery.in('userId', userIds)
    } else {
      return NextResponse.json({ webhooks: [] })
    }
  } else {
    qrCodeQuery = qrCodeQuery.eq('userId', authContext.userId)
  }

  if (qrCodeId) {
    qrCodeQuery = qrCodeQuery.eq('id', qrCodeId)
  }

  const { data: qrCodes } = await qrCodeQuery

  if (!qrCodes || qrCodes.length === 0) {
    return NextResponse.json({ webhooks: [] })
  }

  const qrCodeIds = qrCodes.map((q) => q.id)

  // Get webhook logs grouped by QR code
  const { data: webhooks, error } = await supabaseAdmin!
    .from('QrCode')
    .select('id, webhookUrl, webhookSecret, title, "createdAt"')
    .in('id', qrCodeIds)
    .not('webhookUrl', 'is', null)

  if (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 })
  }

  // Return webhook configs (don't return secret, just indicate it exists)
  const webhookConfigs = (webhooks || []).map((w) => ({
    qrCodeId: w.id,
    qrCodeTitle: w.title,
    webhookUrl: w.webhookUrl,
    hasSecret: !!w.webhookSecret,
    createdAt: w.createdAt,
  }))

  return NextResponse.json({ webhooks: webhookConfigs })
}

// POST - Create/update webhook for a QR code
async function handlePost(
  request: NextRequest,
  context: unknown,
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const body = await request.json()
  const { qrCodeId, webhookUrl, regenerateSecret } = body

  if (!qrCodeId || !webhookUrl) {
    return NextResponse.json(
      { error: 'qrCodeId and webhookUrl are required' },
      { status: 400 }
    )
  }

  // Validate URL
  try {
    new URL(webhookUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 })
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

  // Generate new secret if requested or if not exists
  let webhookSecret = qrCode.webhookSecret
  if (regenerateSecret || !webhookSecret) {
    webhookSecret = crypto.randomBytes(32).toString('hex')
  }

  // Update QR code with webhook config
  const { data: updatedQrCode, error } = await supabaseAdmin!
    .from('QrCode')
    .update({
      webhookUrl,
      webhookSecret,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', qrCodeId)
    .select()
    .single()

  if (error || !updatedQrCode) {
    console.error('Error updating webhook:', error)
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }

  return NextResponse.json({
    qrCodeId: updatedQrCode.id,
    webhookUrl: updatedQrCode.webhookUrl,
    secret: webhookSecret, // Only returned on creation/update
    warning: 'Save this webhook secret now. You will not be able to see it again.',
  })
}

// DELETE - Remove webhook from QR code
async function handleDelete(
  request: NextRequest,
  context: unknown,
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { searchParams } = new URL(request.url)
  const qrCodeId = searchParams.get('qrCodeId')

  if (!qrCodeId) {
    return NextResponse.json({ error: 'qrCodeId is required' }, { status: 400 })
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

  // Remove webhook config
  const { error } = await supabaseAdmin!
    .from('QrCode')
    .update({
      webhookUrl: null,
      webhookSecret: null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', qrCodeId)

  if (error) {
    console.error('Error removing webhook:', error)
    return NextResponse.json({ error: 'Failed to remove webhook' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export const GET = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'webhook:read')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: webhook:read' }, { status: 403 })
  }

  return handleGet(req, ctx, authContext)
})

export const POST = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'webhook:write')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: webhook:write' }, { status: 403 })
  }

  return handlePost(req, ctx, authContext)
})

export const DELETE = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'webhook:delete')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: webhook:delete' }, { status: 403 })
  }

  return handleDelete(req, ctx, authContext)
})

