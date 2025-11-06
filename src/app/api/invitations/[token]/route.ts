import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET - Get invitation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    
    const { data: invitation } = await supabaseAdmin!
      .from('OrganizationInvitation')
      .select('*, Organization(*)')
      .eq('token', token)
      .maybeSingle()

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 409 })
    }

    return NextResponse.json({ invitation })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Accept invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params
    
    // Get invitation
    const { data: invitation } = await supabaseAdmin!
      .from('OrganizationInvitation')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Invitation expired" }, { status: 410 })
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Invitation already accepted" }, { status: 409 })
    }

    // Check if email matches
    const { data: user } = await supabaseAdmin!
      .from('User')
      .select('email')
      .eq('id', session.user.id)
      .single()

    if (user?.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({ error: "Invitation email does not match your account" }, { status: 403 })
    }

    // Check if already a member
    const { data: existingMember } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('id')
      .eq('organizationId', invitation.organizationId)
      .eq('userId', session.user.id)
      .maybeSingle()

    if (existingMember) {
      // Mark as accepted anyway
      await supabaseAdmin!
        .from('OrganizationInvitation')
        .update({ acceptedAt: new Date().toISOString() })
        .eq('id', invitation.id)
      return NextResponse.json({ ok: true, message: "Already a member" })
    }

    // Add as member
    await supabaseAdmin!.from('OrganizationMember').insert({
      organizationId: invitation.organizationId,
      userId: session.user.id,
      role: invitation.role,
      joinedAt: new Date().toISOString(),
    })

    // Mark invitation as accepted
    await supabaseAdmin!
      .from('OrganizationInvitation')
      .update({ acceptedAt: new Date().toISOString() })
      .eq('id', invitation.id)

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error'
    console.error('Error accepting invitation:', e)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}

