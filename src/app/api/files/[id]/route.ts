import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - Get a specific file
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

    const { data: file, error } = await supabaseAdmin!
      .from('QrCodeFile')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (error || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ file })
  } catch (error) {
    console.error("Error in GET /api/files/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a file
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

    // Get file record
    const { data: file, error: fetchError } = await supabaseAdmin!
      .from('QrCodeFile')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (fetchError || !file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }

    // Check if file is linked to any QR codes
    const { data: linkedQRCodes } = await supabaseAdmin!
      .from('QrCode')
      .select('id')
      .eq('fileId', id)
      .limit(1)

    if (linkedQRCodes && linkedQRCodes.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete file that is linked to QR codes. Please unlink it first." },
        { status: 400 }
      )
    }

    // Delete file from storage
    const { error: storageError } = await supabaseAdmin!
      .storage
      .from('qr-files')
      .remove([file.storagePath])

    if (storageError) {
      console.error("Error deleting file from storage:", storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete file record
    const { error: dbError } = await supabaseAdmin!
      .from('QrCodeFile')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error("Error deleting file record:", dbError)
      return NextResponse.json(
        { error: "Failed to delete file record" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/files/[id]:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

