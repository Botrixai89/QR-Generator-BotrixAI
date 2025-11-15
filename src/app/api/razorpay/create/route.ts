import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

// Dynamic import for Razorpay to avoid SSR issues
const getRazorpay = async () => {
  const Razorpay = (await import("razorpay")).default
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function POST(request: NextRequest) {
  try {
    // Validate required env vars early for clearer errors
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay env not configured: RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET')
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }
    const session = await getServerSession(authOptions) as { user?: { id: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { plan = 'FLEX' } = await request.json()

    if (plan !== 'FLEX') {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      )
    }

    // Create Razorpay order for ₹1 (100 paise) - TESTING MODE
    // TODO: Change back to 30000 (₹300) for production
    const razorpay = await getRazorpay()
    let order: any
    try {
      // Get base URL for callback - use localhost in development, production URL in production
      const baseUrl = process.env.NODE_ENV === 'production'
        ? (process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://qr-generator.botrixai.com'))
        : (process.env.NEXTAUTH_URL || 'http://localhost:3000')
      
      order = await razorpay.orders.create({
        amount: 100, // ₹1 in paise (TESTING - change to 30000 for production)
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          plan: 'FLEX',
          user_id: session.user.id
        },
        // Add callback URL for UPI payments (Razorpay will replace {order_id} with actual order ID)
        // Note: callback_url may not be in TypeScript types but is supported by Razorpay API
        callback_url: `${baseUrl}/payment/success?order_id={order_id}`,
        // Enable automatic capture (1 = true, 0 = false)
        payment_capture: 1 as any // Razorpay accepts 1/0 but TypeScript expects boolean
      } as any)
    } catch (e: unknown) {
      // Surface a precise error to the client while keeping secrets safe
      const statusCode = (e as { statusCode?: number })?.statusCode || 500
      if (statusCode === 401) {
        console.error('Razorpay authentication failed when creating order')
        return NextResponse.json({ error: 'Razorpay authentication failed' }, { status: 502 })
      }
      console.error('Razorpay order.create failed:', e)
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 502 })
    }

    // Insert payment record
    const { data: payment, error } = await supabaseAdmin!
      .from('payments')
      .insert({
        user_id: session.user.id,
        razorpay_order_id: order.id,
        amount: 100, // ₹1 in paise (TESTING - change to 30000 for production)
        currency: 'INR',
        status: 'created',
        metadata: {
          plan: 'FLEX',
          receipt: order.receipt
        }
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating payment record:", error)
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      payment_id: payment.id
    })

  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
