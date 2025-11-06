import { NextRequest, NextResponse } from 'next/server'
import { withUsageMetering } from '@/lib/api-usage'
import { supabaseAdmin } from '@/lib/supabase'
import { hasScope } from '@/lib/api-keys'

// GET - Get QR code by ID
async function handleGet(
  request: NextRequest,
  context: { id: string },
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { id } = context

  const { data: qrCode, error } = await supabaseAdmin!
    .from('QrCode')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !qrCode) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
  }

  // Verify access
  if (qrCode.userId !== authContext.userId) {
    if (authContext.organizationId) {
      // Check if QR code owner is member of org
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

  return NextResponse.json({ qrCode })
}

// PUT - Update QR code
async function handlePut(
  request: NextRequest,
  context: { id: string },
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { id } = context
  const body = await request.json()

  // Get existing QR code
  const { data: existingQrCode, error: fetchError } = await supabaseAdmin!
    .from('QrCode')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !existingQrCode) {
    return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
  }

  // Verify access
  if (existingQrCode.userId !== authContext.userId) {
    if (authContext.organizationId) {
      const { data: member } = await supabaseAdmin!
        .from('OrganizationMember')
        .select('userId')
        .eq('organizationId', authContext.organizationId)
        .eq('userId', existingQrCode.userId)
        .maybeSingle()

      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Build update object
  const updateData: Record<string, unknown> & { updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  }

  const allowedFields = [
    'url',
    'title',
    'description',
    'foregroundColor',
    'backgroundColor',
    'dotType',
    'cornerType',
    'logoUrl',
    'hasWatermark',
    'isDynamic',
    'expiresAt',
    'maxScans',
    'redirectUrl',
    'webhookUrl',
    'webhookSecret',
    'isActive',
  ]

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field]
    }
  }

  const { data: qrCode, error } = await supabaseAdmin!
    .from('QrCode')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error || !qrCode) {
    console.error('Error updating QR code:', error)
    return NextResponse.json({ error: 'Failed to update QR code' }, { status: 500 })
  }

  return NextResponse.json({ qrCode })
}

// DELETE - Delete QR code
async function handleDelete(
  request: NextRequest,
  context: { id: string },
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { id } = context

  // Get existing QR code
  const { data: qrCode, error: fetchError } = await supabaseAdmin!
    .from('QrCode')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !qrCode) {
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

  const { error } = await supabaseAdmin!.from('QrCode').delete().eq('id', id)

  if (error) {
    console.error('Error deleting QR code:', error)
    return NextResponse.json({ error: 'Failed to delete QR code' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export const GET = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'qr:read')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: qr:read' }, { status: 403 })
  }

  const context = ctx as { params: Promise<{ id: string }> }
  const params = await context.params
  return handleGet(req, { id: params.id }, authContext)
})

export const PUT = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'qr:write')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: qr:write' }, { status: 403 })
  }

  const context = ctx as { params: Promise<{ id: string }> }
  const params = await context.params
  return handlePut(req, { id: params.id }, authContext)
})

export const DELETE = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'qr:delete')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: qr:delete' }, { status: 403 })
  }

  const context = ctx as { params: Promise<{ id: string }> }
  const params = await context.params
  return handleDelete(req, { id: params.id }, authContext)
})

