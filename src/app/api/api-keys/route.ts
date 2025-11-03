import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateApiKey, rotateApiKey } from '@/lib/api-keys'

// GET - List API keys for current user/org
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    let query = supabaseAdmin!.from('ApiKey').select('*')

    if (organizationId) {
      // Verify user has access to organization
      const { data: member } = await supabaseAdmin!
        .from('OrganizationMember')
        .select('role')
        .eq('organizationId', organizationId)
        .eq('userId', session.user.id)
        .maybeSingle()

      if (!member) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      query = query.eq('organizationId', organizationId).is('userId', null)
    } else {
      query = query.eq('userId', session.user.id).is('organizationId', null)
    }

    const { data: apiKeys, error } = await query.order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching API keys:', error)
      return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
    }

    // Don't return key hashes, only safe data
    const safeApiKeys = apiKeys?.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      scopes: key.scopes,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      isActive: key.isActive,
      createdAt: key.createdAt,
      userId: key.userId,
      organizationId: key.organizationId,
    }))

    return NextResponse.json({ apiKeys: safeApiKeys || [] })
  } catch (error) {
    console.error('Error in GET /api/api-keys:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, scopes, organizationId, expiresAt } = body

    if (!name || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, scopes' },
        { status: 400 }
      )
    }

    // Validate scopes
    const validScopes = [
      'qr:read',
      'qr:write',
      'qr:delete',
      'scan:read',
      'webhook:read',
      'webhook:write',
      'webhook:delete',
      '*', // Admin scope
    ]
    const invalidScopes = scopes.filter((scope: string) => !validScopes.includes(scope))
    if (invalidScopes.length > 0) {
      return NextResponse.json(
        { error: `Invalid scopes: ${invalidScopes.join(', ')}` },
        { status: 400 }
      )
    }

    let userId: string | null = session.user.id
    let orgId: string | null = null

    if (organizationId) {
      // Verify user has permission to create org API keys
      const { data: member } = await supabaseAdmin!
        .from('OrganizationMember')
        .select('role')
        .eq('organizationId', organizationId)
        .eq('userId', session.user.id)
        .maybeSingle()

      if (!member || !['Owner', 'Admin'].includes(member.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to create organization API keys' },
          { status: 403 }
        )
      }

      userId = null
      orgId = organizationId
    }

    // Generate API key
    const { key, apiKey } = await generateApiKey(userId, orgId, name, scopes, expiresAt)

    // Return the key only once (user should save it immediately)
    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        scopes: apiKey.scopes,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      key, // Only returned on creation
      warning: 'Save this API key now. You will not be able to see it again.',
    })
  } catch (error: any) {
    console.error('Error in POST /api/api-keys:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

