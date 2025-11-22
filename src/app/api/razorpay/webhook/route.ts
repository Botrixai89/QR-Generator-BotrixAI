import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"

// Helper function to process payment success
async function processPaymentSuccess(paymentRecord: any, paymentId: string) {
  // Check if already processed (idempotency)
  if (paymentRecord.status === 'paid') {
    console.log("Payment already processed, skipping")
    return { ok: true, message: "Already processed" }
  }

  // Update payment status
  const { error: updateError } = await supabaseAdmin!
    .from('payments')
    .update({
      status: 'paid',
      razorpay_payment_id: paymentId,
      metadata: {
        ...paymentRecord.metadata,
        credits_added: 100,
        webhook_processed_at: new Date().toISOString()
      }
    })
    .eq('id', paymentRecord.id)

  if (updateError) {
    console.error("Error updating payment from webhook:", updateError)
    throw new Error("Failed to update payment")
  }

  // Credit user with 100 credits and update plan
  const { data: user, error: userError } = await supabaseAdmin!
    .from('User')
    .select('credits')
    .eq('id', paymentRecord.user_id)
    .single()

  if (userError || !user) {
    console.error("Error fetching user from webhook:", userError)
    throw new Error("Failed to fetch user")
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
    throw new Error("Failed to credit user")
  }

  console.log(`Webhook processed: User ${paymentRecord.user_id} credited with 100 credits`)
  return { ok: true }
}

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

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error("Razorpay webhook secret not configured")
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 503 }
      )
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex")

    if (expectedSignature !== signature) {
      console.error("Invalid webhook signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      )
    }

    let event
    try {
      event = JSON.parse(body)
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }
    console.log(`Webhook received: ${event.event}`)

    // Handle payment.authorized event (for UPI and other payment methods)
    if (event.event === 'payment.authorized') {
      const payment = event.payload.payment.entity
      const order = event.payload.order.entity

      console.log(`Payment authorized: ${payment.id} for order: ${order.id}`)

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

      // If payment is already captured/paid, skip
      if (paymentRecord.status === 'paid') {
        console.log("Payment already processed, skipping")
        return NextResponse.json({ ok: true, message: "Already processed" })
      }

      // Try to capture the payment if it's authorized but not captured
      try {
        const Razorpay = (await import("razorpay")).default
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID!,
          key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })

        // Capture the payment
        const capturedPayment = await razorpay.payments.capture(
          payment.id, 
          payment.amount, 
          payment.currency || 'INR'
        )
        console.log(`Payment captured: ${capturedPayment.id}`)

        // Process the payment (same as payment.captured)
        try {
          await processPaymentSuccess(paymentRecord, capturedPayment.id)
        } catch (processError) {
          console.error("Error processing payment success:", processError)
          // Payment was captured but processing failed - log for manual review
        }
      } catch (captureError: any) {
        console.error("Error capturing payment:", captureError)
        // If capture fails, still update payment record with authorized status
        // The payment might already be captured or will be captured automatically
        await supabaseAdmin!
          .from('payments')
          .update({
            razorpay_payment_id: payment.id,
            metadata: {
              ...paymentRecord.metadata,
              authorized_at: new Date().toISOString(),
              capture_error: captureError?.message || 'Unknown error'
            }
          })
          .eq('id', paymentRecord.id)
      }
    }

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const order = event.payload.order.entity

      console.log(`Payment captured: ${payment.id} for order: ${order.id}`)

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

      // Process the payment
      try {
        await processPaymentSuccess(paymentRecord, payment.id)
      } catch (processError) {
        console.error("Error processing payment success:", processError)
        return NextResponse.json(
          { error: "Failed to process payment" },
          { status: 500 }
        )
      }
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
