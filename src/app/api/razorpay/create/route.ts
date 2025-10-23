import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
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

    // Create Razorpay order for ₹300 (30000 paise)
    const order = await razorpay.orders.create({
      amount: 30000, // ₹300 in paise
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        plan: 'FLEX',
        user_id: session.user.id
      }
    })

    // Insert payment record
    const { data: payment, error } = await supabaseAdmin!
      .from('payments')
      .insert({
        user_id: session.user.id,
        razorpay_order_id: order.id,
        amount: 30000,
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
