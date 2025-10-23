import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      console.error("Missing Razorpay signature")
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex")

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      )
    }

    const event = JSON.parse(body)

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const order = event.payload.order.entity

      // Find payment record
      const { data: paymentRecord, error: fetchError } = await supabaseAdmin!
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', order.id)
        .single()

      if (fetchError || !paymentRecord) {
        console.error("Payment record not found for webhook:", fetchError)
        return NextResponse.json(
          { error: "Payment record not found" },
          { status: 404 }
        )
      }

      // Check if already processed (idempotency)
      if (paymentRecord.status === 'paid') {
        console.log("Payment already processed, skipping")
        return NextResponse.json({ ok: true, message: "Already processed" })
      }

      // Update payment status
      const { error: updateError } = await supabaseAdmin!
        .from('payments')
        .update({
          status: 'paid',
          razorpay_payment_id: payment.id,
          metadata: {
            ...paymentRecord.metadata,
            credits_added: 100,
            webhook_processed_at: new Date().toISOString()
          }
        })
        .eq('id', paymentRecord.id)

      if (updateError) {
        console.error("Error updating payment from webhook:", updateError)
        return NextResponse.json(
          { error: "Failed to update payment" },
          { status: 500 }
        )
      }

      // Credit user with 100 credits and update plan
      const { data: user, error: userError } = await supabaseAdmin!
        .from('User')
        .select('credits')
        .eq('id', paymentRecord.user_id)
        .single()

      if (userError || !user) {
        console.error("Error fetching user from webhook:", userError)
        return NextResponse.json(
          { error: "Failed to fetch user" },
          { status: 500 }
        )
      }

      const newCredits = (user.credits || 0) + 100

      const { error: creditError } = await supabaseAdmin!
        .from('User')
        .update({
          credits: newCredits,
          plan: 'FLEX'
        })
        .eq('id', paymentRecord.user_id)

      if (creditError) {
        console.error("Error crediting user from webhook:", creditError)
        return NextResponse.json(
          { error: "Failed to credit user" },
          { status: 500 }
        )
      }

      console.log(`Webhook processed: User ${paymentRecord.user_id} credited with 100 credits`)
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
