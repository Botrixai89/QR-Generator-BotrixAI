import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { optimizeImage, validateImageFile, getImageCacheHeaders } from "@/lib/image-optimization"
import { retryWithTimeout } from "@/lib/retry-with-timeout"
import { createClient } from "@supabase/supabase-js"

/**
 * POST - Upload and optimize image
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

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Optimize image
    const optimizedBuffer = await optimizeImage(buffer, {
      maxWidth: 2048,
      maxHeight: 2048,
      quality: 85,
      format: 'webp',
    })

    // Create unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedFileName.replace(/\.[^.]+$/, '.webp')}`

    // Upload to Supabase Storage with retry
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: uploadData, error: uploadError } = await retryWithTimeout(
      async () => {
        const { data, error } = await supabase.storage
          .from('qr-logos')
          .upload(fileName, optimizedBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600', // 1 hour
            upsert: false,
          })
        return { data, error }
      },
      {
        maxRetries: 3,
        timeout: 30000,
      }
    )

    if (uploadError || !uploadData) {
      console.error("Error uploading image:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('qr-logos')
      .getPublicUrl(fileName)

    const imageUrl = urlData.publicUrl

    // Return optimized image URL with cache headers
    return NextResponse.json(
      { imageUrl },
      {
        headers: getImageCacheHeaders(31536000), // 1 year
      }
    )
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

