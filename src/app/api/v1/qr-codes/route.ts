import { NextRequest, NextResponse } from 'next/server'
import { withUsageMetering } from '@/lib/api-usage'
import { supabaseAdmin } from '@/lib/supabase'
import { hasScope } from '@/lib/api-keys'

// GET - List QR codes
async function handleGet(
  request: NextRequest,
  _context: unknown,
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const search = searchParams.get('search')

  let query = supabaseAdmin!
    .from('QrCode')
    .select('*', { count: 'exact' })
    .order('createdAt', { ascending: false })

  // Filter by user/org
  if (authContext.organizationId) {
    // For org API keys, need to check if QR codes belong to org members
    // This requires a more complex query - for now, filter by userIds in org
    const { data: members } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('userId')
      .eq('organizationId', authContext.organizationId)

    if (members && members.length > 0) {
      const userIds = members.map((m) => m.userId)
      query = query.in('userId', userIds)
    } else {
      return NextResponse.json({ qrCodes: [], total: 0 })
    }
  } else {
    query = query.eq('userId', authContext.userId)
  }

  // Search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,url.ilike.%${search}%`)
  }

  const { data: qrCodes, error, count } = await query
    .range(offset, offset + Math.min(limit, 100) - 1)

  if (error) {
    console.error('Error fetching QR codes:', error)
    return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 })
  }

  return NextResponse.json({
    qrCodes: qrCodes || [],
    total: count || 0,
    limit,
    offset,
  })
}

// POST - Create QR code
async function handlePost(
  request: NextRequest,
  _context: unknown,
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const body = await request.json()
  const {
    url,
    title,
    description,
    foregroundColor,
    backgroundColor,
    dotType,
    cornerType,
    logoUrl,
    hasWatermark,
    isDynamic,
    expiresAt,
    maxScans,
    redirectUrl,
    webhookUrl,
    webhookSecret,
  } = body

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  // Get userId (for org keys, we need to use a default user or create a service account)
  // For simplicity, if it's an org key, we'll need to specify userId in the request
  let userId = authContext.userId
  if (authContext.organizationId && body.userId) {
    // Verify user is member of org
    const { data: member } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('userId')
      .eq('organizationId', authContext.organizationId)
      .eq('userId', body.userId)
      .maybeSingle()

    if (!member) {
      return NextResponse.json(
        { error: 'User must be a member of the organization' },
        { status: 403 }
      )
    }
    userId = body.userId
  }

  const { data: qrCode, error } = await supabaseAdmin!
    .from('QrCode')
    .insert({
      userId,
      url,
      title,
      description,
      foregroundColor: foregroundColor || '#000000',
      backgroundColor: backgroundColor || '#FFFFFF',
      dotType: dotType || 'square',
      cornerType: cornerType || 'square',
      logoUrl,
      hasWatermark: hasWatermark !== undefined ? hasWatermark : true,
      isDynamic: isDynamic || false,
      expiresAt,
      maxScans,
      redirectUrl,
      webhookUrl,
      webhookSecret,
      isActive: true,
    })
    .select()
    .single()

  if (error || !qrCode) {
    console.error('Error creating QR code:', error)
    return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 })
  }

  return NextResponse.json({ qrCode }, { status: 201 })
}

// Export with usage metering
export const GET = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'qr:read')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: qr:read' }, { status: 403 })
  }

  return handleGet(req, ctx, authContext)
})

export const POST = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'qr:write')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: qr:write' }, { status: 403 })
  }

  return handlePost(req, ctx, authContext)
})

