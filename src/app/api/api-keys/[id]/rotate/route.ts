import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { rotateApiKey } from '@/lib/api-keys'

// POST - Rotate API key
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, deactivateOld } = body

    // Get API key
    const { data: apiKey, error: fetchError } = await supabaseAdmin!
      .from('ApiKey')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Verify access
    if (apiKey.userId !== session.user.id) {
      if (apiKey.organizationId) {
        const { data: member } = await supabaseAdmin!
          .from('OrganizationMember')
          .select('role')
          .eq('organizationId', apiKey.organizationId)
          .eq('userId', session.user.id)
          .maybeSingle()

        if (!member || !['Owner', 'Admin'].includes(member.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Rotate the key
    const { key, apiKey: newApiKey } = await rotateApiKey(id, name, deactivateOld ?? true)

    return NextResponse.json({
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        keyPrefix: newApiKey.keyPrefix,
        scopes: newApiKey.scopes,
        expiresAt: newApiKey.expiresAt,
        createdAt: newApiKey.createdAt,
      },
      key, // Only returned on rotation
      warning: 'Save this new API key now. You will not be able to see it again.',
      oldKeyDeactivated: deactivateOld ?? true,
    })
  } catch (error: unknown) {
    console.error('Error in POST /api/api-keys/[id]/rotate:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

