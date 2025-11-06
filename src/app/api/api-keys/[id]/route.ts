import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET - Get API key details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { data: apiKey, error } = await supabaseAdmin!
      .from('ApiKey')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !apiKey) {
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

        if (!member) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Return safe data (no key hash)
    const safeApiKey = {
      id: apiKey.id,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      scopes: apiKey.scopes,
      lastUsedAt: apiKey.lastUsedAt,
      expiresAt: apiKey.expiresAt,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      userId: apiKey.userId,
      organizationId: apiKey.organizationId,
    }

    return NextResponse.json({ apiKey: safeApiKey })
  } catch (error) {
    console.error('Error in GET /api/api-keys/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update API key (name, scopes, expiresAt, isActive)
export async function PATCH(
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
    const { name, scopes, expiresAt, isActive } = body

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

    // Validate scopes if provided
    if (scopes && Array.isArray(scopes)) {
      const validScopes = [
        'qr:read',
        'qr:write',
        'qr:delete',
        'scan:read',
        'webhook:read',
        'webhook:write',
        'webhook:delete',
        '*',
      ]
      const invalidScopes = scopes.filter((scope: string) => !validScopes.includes(scope))
      if (invalidScopes.length > 0) {
        return NextResponse.json(
          { error: `Invalid scopes: ${invalidScopes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: {
      name?: string
      scopes?: string[]
      expiresAt?: string | null
      isActive?: boolean
      updatedAt: string
    } = {
      updatedAt: new Date().toISOString(),
    }
    if (name !== undefined) updateData.name = name
    if (scopes !== undefined) updateData.scopes = scopes
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt
    if (isActive !== undefined) updateData.isActive = isActive

    const { data: updatedKey, error: updateError } = await supabaseAdmin!
      .from('ApiKey')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedKey) {
      console.error('Error updating API key:', updateError)
      return NextResponse.json({ error: 'Failed to update API key' }, { status: 500 })
    }

    const safeApiKey = {
      id: updatedKey.id,
      name: updatedKey.name,
      keyPrefix: updatedKey.keyPrefix,
      scopes: updatedKey.scopes,
      lastUsedAt: updatedKey.lastUsedAt,
      expiresAt: updatedKey.expiresAt,
      isActive: updatedKey.isActive,
      createdAt: updatedKey.createdAt,
    }

    return NextResponse.json({ apiKey: safeApiKey })
  } catch (error) {
    console.error('Error in PATCH /api/api-keys/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

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

    // Delete API key
    const { error: deleteError } = await supabaseAdmin!.from('ApiKey').delete().eq('id', id)

    if (deleteError) {
      console.error('Error deleting API key:', deleteError)
      return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/api-keys/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

