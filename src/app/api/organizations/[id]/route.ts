import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { canManageOrgSettings, isOrgOwner, getUserOrgRole } from "@/lib/rbac"

// GET - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const role = await getUserOrgRole(session.user.id, id)
    
    if (!role) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 })
    }

    const { data: org } = await supabaseAdmin!
      .from('Organization')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ organization: org, userRole: role })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    if (!(await canManageOrgSettings(session.user.id, id))) {
      return NextResponse.json({ error: "Only owners can update organization settings" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, slug } = body || {}

    const updates: { name?: string; description?: string | null; slug?: string; updatedAt: string } = {
      updatedAt: new Date().toISOString(),
    }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description || null
    if (slug !== undefined) {
      // Validate slug
      const slugRegex = /^[a-z0-9-_]+$/
      if (!slugRegex.test(slug)) {
        return NextResponse.json({ error: "Invalid slug format" }, { status: 400 })
      }
      
      // Check if slug exists for another org
      const { data: existing } = await supabaseAdmin!
        .from('Organization')
        .select('id')
        .eq('slug', slug)
        .neq('id', id)
        .maybeSingle()
      
      if (existing) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
      updates.slug = slug
    }

    const { data: org, error } = await supabaseAdmin!
      .from('Organization')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update organization" }, { status: 500 })
    }

    return NextResponse.json({ organization: org })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete organization (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    if (!(await isOrgOwner(session.user.id, id))) {
      return NextResponse.json({ error: "Only owners can delete organization" }, { status: 403 })
    }

    // Delete organization (cascade will handle members and invitations)
    const { error } = await supabaseAdmin!
      .from('Organization')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

