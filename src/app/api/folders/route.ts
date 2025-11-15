import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - List all folders for the authenticated user
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

    const { searchParams } = new URL(request.url)
    const parentFolderId = searchParams.get('parentFolderId') // Optional: filter by parent

    let query = supabaseAdmin!
      .from('QrCodeFolder')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (parentFolderId) {
      query = query.eq('parentFolderId', parentFolderId)
    } else {
      query = query.is('parentFolderId', null) // Root folders only
    }

    const { data: folders, error } = await query

    if (error) {
      console.error("Error fetching folders:", error)
      return NextResponse.json(
        { error: "Failed to fetch folders" },
        { status: 500 }
      )
    }

    return NextResponse.json({ folders: folders || [] })
  } catch (error) {
    console.error("Error in GET /api/folders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new folder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description, color, parentFolderId } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      )
    }

    // Validate parent folder exists and belongs to user (if provided)
    if (parentFolderId) {
      const { data: parentFolder } = await supabaseAdmin!
        .from('QrCodeFolder')
        .select('id')
        .eq('id', parentFolderId)
        .eq('userId', session.user.id)
        .single()

      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found" },
          { status: 404 }
        )
      }
    }

    const { data: folder, error } = await supabaseAdmin!
      .from('QrCodeFolder')
      .insert({
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        parentFolderId: parentFolderId || null
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating folder:", error)
      return NextResponse.json(
        { error: "Failed to create folder" },
        { status: 500 }
      )
    }

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/folders:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

