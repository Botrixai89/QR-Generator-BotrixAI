import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { getUserOrganizations } from "@/lib/rbac"

// GET - List user's organizations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const orgs = await getUserOrganizations(session.user.id)
    return NextResponse.json({ organizations: orgs })
  } catch (e: any) {
    console.error('Error fetching organizations:', e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new organization
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, slug } = body || {}

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Validate slug format (alphanumeric, hyphens, underscores)
    const slugRegex = /^[a-z0-9-_]+$/
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ error: "Slug must be lowercase alphanumeric with hyphens/underscores only" }, { status: 400 })
    }

    // Check if slug exists
    const { data: existing } = await supabaseAdmin!
      .from('Organization')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
    }

    // Create organization
    const { data: org, error: orgError } = await supabaseAdmin!
      .from('Organization')
      .insert({
        name,
        slug,
        description: description || null,
        ownerId: session.user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select('*')
      .single()

    if (orgError) {
      console.error('Error creating organization:', orgError)
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 })
    }

    // Add creator as Owner member
    await supabaseAdmin!.from('OrganizationMember').insert({
      organizationId: org.id,
      userId: session.user.id,
      role: 'Owner',
      joinedAt: new Date().toISOString(),
    })

    return NextResponse.json({ organization: org }, { status: 201 })
  } catch (e: any) {
    console.error('Error creating organization:', e)
    return NextResponse.json({ error: "Internal server error", details: e.message }, { status: 500 })
  }
}

