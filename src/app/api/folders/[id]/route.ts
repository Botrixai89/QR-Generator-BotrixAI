import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - Get a specific folder
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const { data: folder, error } = await supabaseAdmin!
      .from('QrCodeFolder')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (error || !folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ folder })
  } catch (error) {
    console.error("Error in GET /api/folders/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update a folder
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { name, description, color, parentFolderId } = body

    // Verify folder exists and belongs to user
    const { data: existingFolder } = await supabaseAdmin!
      .from('QrCodeFolder')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (!existingFolder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    // Validate parent folder if provided
    if (parentFolderId && parentFolderId !== id) {
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

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (color !== undefined) updateData.color = color || null
    if (parentFolderId !== undefined) updateData.parentFolderId = parentFolderId || null

    const { data: folder, error } = await supabaseAdmin!
      .from('QrCodeFolder')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error("Error updating folder:", error)
      return NextResponse.json(
        { error: "Failed to update folder" },
        { status: 500 }
      )
    }

    return NextResponse.json({ folder })
  } catch (error) {
    console.error("Error in PUT /api/folders/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a folder
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify folder exists and belongs to user
    const { data: folder } = await supabaseAdmin!
      .from('QrCodeFolder')
      .select('id')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      )
    }

    // Check if folder has child folders
    const { data: childFolders } = await supabaseAdmin!
      .from('QrCodeFolder')
      .select('id')
      .eq('parentFolderId', id)
      .limit(1)

    if (childFolders && childFolders.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder with subfolders. Please delete or move subfolders first." },
        { status: 400 }
      )
    }

    // Check if folder has QR codes
    const { data: qrCodes } = await supabaseAdmin!
      .from('QrCode')
      .select('id')
      .eq('folderId', id)
      .limit(1)

    if (qrCodes && qrCodes.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete folder with QR codes. Please move or delete QR codes first." },
        { status: 400 }
      )
    }

    // Delete the folder
    const { error } = await supabaseAdmin!
      .from('QrCodeFolder')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("Error deleting folder:", error)
      return NextResponse.json(
        { error: "Failed to delete folder" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/folders/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

