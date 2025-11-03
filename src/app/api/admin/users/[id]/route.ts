/**
 * Admin User Management API
 * Manage individual users
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { isAdmin, getUserById, updateUser, lockUser, unlockUser, grantCredits } from "@/lib/admin"

/**
 * GET - Get user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const routeParams = await params
    const { id } = routeParams
    const user = await getUserById(id)
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // Get additional user data
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Get user's subscriptions
    const { data: subscriptions } = await supabaseAdmin!
      .from('Subscription')
      .select('*')
      .eq('userId', id)
      .order('createdAt', { ascending: false })
    
    // Get user's organizations
    const { data: organizations } = await supabaseAdmin!
      .from('OrganizationMember')
      .select('organizationId, role, organization:Organization(*)')
      .eq('userId', id)
    
    // Get billing adjustments
    const { data: adjustments } = await supabaseAdmin!
      .from('BillingAdjustment')
      .select('*')
      .eq('userId', id)
      .order('createdAt', { ascending: false })
      .limit(10)
    
    return NextResponse.json({
      user,
      subscriptions: subscriptions || [],
      organizations: organizations || [],
      adjustments: adjustments || [],
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const routeParams = await params
    const { id } = routeParams
    const body = await request.json()
    
    await updateUser(id, body, session.user.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST - Perform admin actions on user (lock, unlock, grant credits)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    const routeParams = await params
    const { id } = routeParams
    const body = await request.json()
    const { action, ...actionParams } = body
    
    switch (action) {
      case 'lock':
        await lockUser(id, actionParams.reason || 'Admin lock', session.user.id)
        break
      case 'unlock':
        await unlockUser(id, session.user.id)
        break
      case 'grant_credits':
        await grantCredits(id, actionParams.credits, actionParams.reason || 'Admin grant', session.user.id)
        break
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error performing admin action:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}

