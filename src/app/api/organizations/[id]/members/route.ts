import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { getOrganizationMembers, canManageOrgMembers, getUserOrgRole, isOrgOwner } from "@/lib/rbac"

// GET - List organization members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const role = await getUserOrgRole(session.user.id, id)
    
    if (!role) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 })
    }

    const members = await getOrganizationMembers(id)
    
    // Enrich with user details
    const userIds = members.map(m => m.userId)
    const { data: users } = await supabaseAdmin!
      .from('User')
      .select('id, email, name, image')
      .in('id', userIds)

    const membersWithDetails = members.map(member => ({
      ...member,
      user: users?.find(u => u.id === member.userId) || null,
    }))

    return NextResponse.json({ members: membersWithDetails })
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Invite member or update role
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    if (!(await canManageOrgMembers(session.user.id, id))) {
      return NextResponse.json({ error: "Only owners and admins can manage members" }, { status: 403 })
    }

    const body = await request.json()
    const { email, role, userId } = body || {}

    if (!email && !userId) {
      return NextResponse.json({ error: "Email or userId is required" }, { status: 400 })
    }

    const memberRole = (role || 'Member') as 'Owner' | 'Admin' | 'Member'
    if (!['Owner', 'Admin', 'Member'].includes(memberRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Don't allow promoting to Owner via this endpoint (use transfer endpoint)
    if (memberRole === 'Owner') {
      return NextResponse.json({ error: "Use transfer ownership endpoint to change owner" }, { status: 400 })
    }

    if (userId) {
      // Direct member addition (user already exists)
      const { error: memberError } = await supabaseAdmin!
        .from('OrganizationMember')
        .upsert({
          organizationId: id,
          userId,
          role: memberRole,
          joinedAt: new Date().toISOString(),
        }, { onConflict: 'organizationId,userId' })

      if (memberError) {
        return NextResponse.json({ error: "Failed to add member" }, { status: 500 })
      }

      return NextResponse.json({ ok: true })
    } else {
      // Invite by email
      const crypto = await import('crypto')
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

      const { error: inviteError } = await supabaseAdmin!
        .from('OrganizationInvitation')
        .insert({
          organizationId: id,
          email: email.toLowerCase(),
          role: memberRole,
          invitedBy: session.user.id,
          token,
          expiresAt: expiresAt.toISOString(),
        })

      if (inviteError) {
        return NextResponse.json({ error: "Failed to send invitation" }, { status: 500 })
      }

      // TODO: Send invitation email with token
      // For now, return the invitation link
      const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite/${token}`

      return NextResponse.json({ 
        ok: true, 
        invitation: { token, expiresAt: expiresAt.toISOString(), link: inviteLink }
      })
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Internal server error", details: e.message }, { status: 500 })
  }
}

