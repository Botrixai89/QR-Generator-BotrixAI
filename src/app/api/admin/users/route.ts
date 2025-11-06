/**
 * Admin Users API
 * Manage users and organizations
 */

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { isAdmin, getUsers } from "@/lib/admin"

/**
 * GET - Get all users with pagination
 */
export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || undefined
    
    const result = await getUsers(page, limit, search)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

