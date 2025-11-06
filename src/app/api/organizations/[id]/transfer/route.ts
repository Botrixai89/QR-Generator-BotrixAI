import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { isOrgOwner, getUserOrgRole } from "@/lib/rbac"

// POST - Transfer organization ownership
export async function POST(
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
      return NextResponse.json({ error: "Only owner can transfer ownership" }, { status: 403 })
    }

    const body = await request.json()
    const { newOwnerId } = body || {}

    if (!newOwnerId) {
      return NextResponse.json({ error: "newOwnerId is required" }, { status: 400 })
    }

    // Check if new owner is a member
    const newOwnerRole = await getUserOrgRole(newOwnerId, id)
    if (!newOwnerRole) {
      return NextResponse.json({ error: "New owner must be a member of the organization" }, { status: 400 })
    }

    if (newOwnerId === session.user.id) {
      return NextResponse.json({ error: "Cannot transfer ownership to yourself" }, { status: 400 })
    }

    // Update organization owner
    await supabaseAdmin!
      .from('Organization')
      .update({ ownerId: newOwnerId, updatedAt: new Date().toISOString() })
      .eq('id', id)

    // Update old owner's role to Admin
    await supabaseAdmin!
      .from('OrganizationMember')
      .update({ role: 'Admin' })
      .eq('organizationId', id)
      .eq('userId', session.user.id)

    // Update new owner's role to Owner
    await supabaseAdmin!
      .from('OrganizationMember')
      .update({ role: 'Owner' })
      .eq('organizationId', id)
      .eq('userId', newOwnerId)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error'
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}