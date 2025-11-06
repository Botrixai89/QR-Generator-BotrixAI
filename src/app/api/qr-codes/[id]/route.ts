import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// GET - Fetch specific QR code details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: qrCode, error } = await supabaseAdmin!
      .from('QrCode')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (error) {
      console.error("Error fetching QR code:", error)
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(qrCode)
  } catch (error) {
    console.error("Error fetching QR code:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - Update QR code content (for dynamic QR codes)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      url, 
      title, 
      dynamicContent, 
      isActive, 
      expiresAt, 
      maxScans,
      redirectUrl 
    } = body

    // First, verify the QR code belongs to the user
    const { data: existingQrCode, error: fetchError } = await supabaseAdmin!
      .from('QrCode')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .single()

    if (fetchError || !existingQrCode) {
      return NextResponse.json(
        { error: "QR code not found" },
        { status: 404 }
      )
    }

    // Update the QR code
    const updateData: {
      updatedAt: string
      url?: string
      title?: string
      dynamicContent?: string
      isActive?: boolean
      expiresAt?: string | null
      maxScans?: number
      redirectUrl?: string
    } = {
      updatedAt: new Date().toISOString()
    }

    if (url !== undefined) updateData.url = url
    if (title !== undefined) updateData.title = title
    if (dynamicContent !== undefined) updateData.dynamicContent = dynamicContent
    if (isActive !== undefined) updateData.isActive = isActive
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt
    if (maxScans !== undefined) updateData.maxScans = maxScans
    if (redirectUrl !== undefined) updateData.redirectUrl = redirectUrl

    const { data: updatedQrCode, error } = await supabaseAdmin!
      .from('QrCode')
      .update(updateData)
      .eq('id', id)
      .eq('userId', session.user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating QR code:", error)
      return NextResponse.json(
        { error: "Failed to update QR code" },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedQrCode)
  } catch (error) {
    console.error("Error updating QR code:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - Delete QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { error } = await supabaseAdmin!
      .from('QrCode')
      .delete()
      .eq('id', id)
      .eq('userId', session.user.id)

    if (error) {
      console.error("Error deleting QR code:", error)
      return NextResponse.json(
        { error: "Failed to delete QR code" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting QR code:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}