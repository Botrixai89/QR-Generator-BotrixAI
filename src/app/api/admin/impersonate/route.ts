/**
 * Admin Impersonation API
 * Allows admins to impersonate users with audit trail
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin, getUserById } from "@/lib/admin"
import { supabaseAdmin } from "@/lib/supabase"
import { logAuditEvent } from "@/lib/audit-log"

/**
 * POST - Start impersonation session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    if (!await isAdmin(session.user.id)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { targetUserId, reason } = body
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      )
    }
    
    // Verify target user exists
    const targetUser = await getUserById(targetUserId)
    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      )
    }
    
    // Prevent impersonating other admins (unless explicitly allowed)
    if (targetUser.role === 'admin' && process.env.ALLOW_ADMIN_IMPERSONATION !== 'true') {
      return NextResponse.json(
        { error: "Cannot impersonate admin users" },
        { status: 403 }
      )
    }
    
    // Create impersonation session
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
    const userAgent = request.headers.get('user-agent') || null
    
    const { data: impersonationSession, error } = await supabaseAdmin!
      .from('ImpersonationSession')
      .insert({
        adminUserId: session.user.id,
        targetUserId,
        reason: reason || 'Admin impersonation',
        ipAddress,
        userAgent,
        metadata: {
          adminEmail: session.user.email,
          targetEmail: targetUser.email,
        },
      })
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create impersonation session: ${error.message}`)
    }
    
    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'impersonate_start',
      resourceType: 'user',
      resourceId: targetUserId,
      ipAddress,
      userAgent,
      metadata: {
        impersonationSessionId: impersonationSession.id,
        reason,
        targetEmail: targetUser.email,
      },
    })
    
    // Create a special impersonation token/session
    // In production, you'd want to create a proper session token
    // For now, we'll return the impersonation session ID
    return NextResponse.json({
      success: true,
      impersonationSessionId: impersonationSession.id,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    })
  } catch (error) {
    console.error("Error starting impersonation:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - End impersonation session
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    if (!await isAdmin(session.user.id)) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      )
    }
    
    // Get impersonation session
    const { data: impersonationSession, error: fetchError } = await supabaseAdmin!
      .from('ImpersonationSession')
      .select('*')
      .eq('id', sessionId)
      .eq('adminUserId', session.user.id)
      .is('endedAt', null)
      .single()
    
    if (fetchError || !impersonationSession) {
      return NextResponse.json(
        { error: "Impersonation session not found" },
        { status: 404 }
      )
    }
    
    // End session
    const { error: updateError } = await supabaseAdmin!
      .from('ImpersonationSession')
      .update({
        endedAt: new Date().toISOString(),
      })
      .eq('id', sessionId)
    
    if (updateError) {
      throw new Error(`Failed to end impersonation session: ${updateError.message}`)
    }
    
    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'impersonate_end',
      resourceType: 'user',
      resourceId: impersonationSession.targetUserId,
      metadata: {
        impersonationSessionId: sessionId,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error ending impersonation:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

