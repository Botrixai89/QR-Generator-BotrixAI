/**
 * Admin Stats API
 * Provides overview statistics for admin dashboard
 */

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { isAdmin } from "@/lib/admin"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - Get admin statistics
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
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
    
    // Get statistics
    const [
      { count: totalUsers },
      { count: lockedUsers },
      { count: totalOrganizations },
      { data: revenueData },
      { count: pendingRefunds },
      { count: activeFeatureFlags },
      { count: pendingEmails },
    ] = await Promise.all([
      supabaseAdmin!.from('User').select('id', { count: 'exact', head: true }),
      supabaseAdmin!.from('User').select('id', { count: 'exact', head: true }).eq('role', 'locked'),
      supabaseAdmin!.from('Organization').select('id', { count: 'exact', head: true }),
      supabaseAdmin!.from('Invoice').select('amountCents').eq('status', 'paid'),
      supabaseAdmin!.from('Invoice').select('id', { count: 'exact', head: true }).eq('status', 'refunded').is('refundedAt', null),
      supabaseAdmin!.from('FeatureFlag').select('id', { count: 'exact', head: true }).eq('enabled', true),
      supabaseAdmin!.from('EmailQueue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    
    // Calculate total revenue
    const totalRevenue = revenueData?.reduce((sum: number, invoice: { amountCents: number | null }) => {
      return sum + (invoice.amountCents || 0)
    }, 0) || 0
    
    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: (totalUsers || 0) - (lockedUsers || 0),
      lockedUsers: lockedUsers || 0,
      totalOrganizations: totalOrganizations || 0,
      totalRevenue: totalRevenue / 100, // Convert cents to currency units
      pendingRefunds: pendingRefunds || 0,
      activeFeatureFlags: activeFeatureFlags || 0,
      pendingEmails: pendingEmails || 0,
    })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

