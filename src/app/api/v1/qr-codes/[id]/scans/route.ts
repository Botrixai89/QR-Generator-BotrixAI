import { NextRequest, NextResponse } from 'next/server'
import { withUsageMetering } from '@/lib/api-usage'
import { supabaseAdmin } from '@/lib/supabase'
import { hasScope } from '@/lib/api-keys'

// GET - List scans for a QR code
async function handleGet(
  request: NextRequest,
  context: { id: string },
  authContext: { apiKeyId: string; userId: string; organizationId: string | null }
) {
  const { id: qrCodeId } = context
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

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

  // Query scans
  let query = supabaseAdmin!
    .from('QrCodeScan')
    .select('*', { count: 'exact' })
    .eq('qrCodeId', qrCodeId)
    .order('scannedAt', { ascending: false })

  if (startDate) {
    query = query.gte('scannedAt', startDate)
  }
  if (endDate) {
    query = query.lte('scannedAt', endDate)
  }

  const { data: scans, error, count } = await query
    .range(offset, offset + Math.min(limit, 100) - 1)

  if (error) {
    console.error('Error fetching scans:', error)
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 })
  }

  return NextResponse.json({
    scans: scans || [],
    total: count || 0,
    limit,
    offset,
  })
}

export const GET = withUsageMetering(async (req, ctx: unknown, authContext) => {
  // Check scope
  const { data: apiKey } = await supabaseAdmin!.from('ApiKey').select('*').eq('id', authContext.apiKeyId).single()
  if (!apiKey || !hasScope(apiKey, 'scan:read')) {
    return NextResponse.json({ error: 'Forbidden', message: 'Missing required scope: scan:read' }, { status: 403 })
  }

  const context = ctx as { params: Promise<{ id: string }> }
  const params = await context.params
  return handleGet(req, { id: params.id }, authContext)
})

