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
      // Prepare order data
      // Note: callback_url is not supported by Razorpay orders.create API
      // Payment success is handled via the frontend handler function
      const orderData: any = {
        amount: 100, // ₹1 in paise (TESTING - change to 30000 for production)
        currency: 'INR',
        receipt: `order_${Date.now()}`,
        notes: {
          plan: 'FLEX',
          user_id: session.user.id
        },
        // Enable automatic capture (1 = true, 0 = false)
        payment_capture: 1
      }
      
      order = await razorpay.orders.create(orderData)
      
      // Validate order was created successfully
      if (!order || !order.id) {
        console.error('Razorpay order creation returned invalid response:', order)
        return NextResponse.json({ error: 'Invalid order response from payment gateway' }, { status: 502 })
      }
    } catch (e: unknown) {
      // Surface a precise error to the client while keeping secrets safe
      const error = e as any
      const statusCode = error?.statusCode || error?.status || 500
      const errorMessage = error?.error?.description || error?.message || 'Unknown error'
      
      console.error('Razorpay order.create failed:', {
        statusCode,
        error: errorMessage,
        // Don't log sensitive data
        hasKeyId: !!process.env.RAZORPAY_KEY_ID,
        hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET
      })
      
      if (statusCode === 401) {
        return NextResponse.json({ 
          error: 'Payment gateway authentication failed. Please contact support.' 
        }, { status: 502 })
      }
      
      return NextResponse.json({ 
        error: `Failed to create payment order: ${errorMessage}` 
      }, { status: 502 })
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
