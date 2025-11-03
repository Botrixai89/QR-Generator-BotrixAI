import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - Stream QR codes (route-level streaming)
 * Uses Next.js streaming to send data as it's processed
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return new Response(null, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Send initial response
          controller.enqueue(encoder.encode(JSON.stringify({ start: true }) + '\n'))

          // Stream QR codes in batches
          const batchSize = 20
          let currentOffset = offset
          let hasMore = true

          while (hasMore && currentOffset < offset + limit) {
            const batchLimit = Math.min(batchSize, offset + limit - currentOffset)
            
            const { data: qrCodes, error } = await supabaseAdmin!
              .from('QrCode')
              .select('id, title, url, createdAt, scanCount')
              .eq('userId', session.user.id)
              .order('createdAt', { ascending: false })
              .range(currentOffset, currentOffset + batchLimit - 1)

            if (error) {
              throw error
            }

            if (!qrCodes || qrCodes.length === 0) {
              hasMore = false
              break
            }

            // Stream batch
            for (const qrCode of qrCodes) {
              controller.enqueue(encoder.encode(JSON.stringify(qrCode) + '\n'))
            }

            currentOffset += qrCodes.length
            hasMore = qrCodes.length === batchLimit

            // Small delay to prevent overwhelming the client
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Send completion
          controller.enqueue(encoder.encode(JSON.stringify({ end: true }) + '\n'))
          controller.close()
        } catch (error) {
          const errorMsg = JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
          controller.enqueue(encoder.encode(errorMsg + '\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error("Error streaming QR codes:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

