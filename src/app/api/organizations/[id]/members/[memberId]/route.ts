import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { canManageOrgMembers } from "@/lib/rbac"

// PATCH - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, memberId } = await params
    
    if (!(await canManageOrgMembers(session.user.id, id))) {
      return NextResponse.json({ error: "Only owners and admins can update member roles" }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body || {}

    if (!role || !['Owner', 'Admin', 'Member'].includes(role)) {
      return NextResponse.json({ error: "Valid role is required" }, { status: 400 })
    }

    // Don't allow promoting to Owner via this endpoint
    if (role === 'Owner') {
      return NextResponse.json({ error: "Use transfer ownership endpoint" }, { status: 400 })
    }

    // Can't update own role
    const { data: member } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('userId')
      .eq('id', memberId)
      .single()

    if (member?.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot update your own role" }, { status: 400 })
    }

    const { error } = await supabaseAdmin!
      .from('OrganizationMember')
      .update({ role })
      .eq('id', memberId)
      .eq('organizationId', id)

    if (error) {
      return NextResponse.json({ error: "Failed to update member" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, memberId } = await params
    
    if (!(await canManageOrgMembers(session.user.id, id))) {
      return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 })
    }

    // Get member details
    const { data: member } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('userId, role')
      .eq('id', memberId)
      .eq('organizationId', id)
      .single()

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Can't remove owner
    if (member.role === 'Owner') {
      return NextResponse.json({ error: "Cannot remove owner. Transfer ownership first." }, { status: 400 })
    }

    // Can't remove yourself
    if (member.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot remove yourself. Leave organization instead." }, { status: 400 })
    }

    const { error } = await supabaseAdmin!
      .from('OrganizationMember')
      .delete()
      .eq('id', memberId)
      .eq('organizationId', id)

    if (error) {
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

