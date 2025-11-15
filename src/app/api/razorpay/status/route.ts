import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET - Check payment status for an order
 * Used for polling payment status when user pays via UPI QR code
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('order_id')

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      )
    }

    // Get payment record
    const { data: payment, error } = await supabaseAdmin!
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .eq('user_id', session.user.id)
      .single()

    if (error || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    // If payment is already paid, return success
    if (payment.status === 'paid') {
      return NextResponse.json({
        status: 'paid',
        paid: true,
        credits: payment.metadata?.credits_added || 100,
        message: "Payment completed successfully"
      })
    }

    // Check with Razorpay API for latest status
    try {
      const Razorpay = (await import("razorpay")).default
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      })

      const order = await razorpay.orders.fetch(orderId)
      
      // Check if order has payments - fetch payments for this order
      const payments = await razorpay.orders.fetchPayments(orderId)
      
      // Check if any payment is captured
      let capturedPayment = payments.items?.find((p: any) => p.status === 'captured')
      
      // If payment is authorized but not captured, try to capture it
      if (!capturedPayment && payments.items && payments.items.length > 0) {
        const authorizedPayment = payments.items.find((p: any) => p.status === 'authorized')
        if (authorizedPayment) {
          try {
            console.log(`Attempting to capture authorized payment: ${authorizedPayment.id}`)
            const captured = await razorpay.payments.capture(
              authorizedPayment.id, 
              order.amount, 
              order.currency || 'INR'
            )
            capturedPayment = captured
            console.log(`Payment captured successfully: ${captured.id}`)
          } catch (captureError: any) {
            console.error("Error capturing authorized payment:", captureError)
            // Continue to check if payment was already captured
          }
        }
      }
      
      if (capturedPayment || order.status === 'paid' || (order as any).amount_paid === order.amount) {
        // Payment completed - update our database
        const { data: user } = await supabaseAdmin!
          .from('User')
          .select('credits')
          .eq('id', session.user.id)
          .single()

        const newCredits = ((user?.credits || 0) + 100)

        // Update payment record with payment ID if available
        await supabaseAdmin!
          .from('payments')
          .update({
            status: 'paid',
            razorpay_payment_id: capturedPayment?.id || payment.razorpay_payment_id,
            metadata: {
              ...payment.metadata,
              credits_added: 100,
              verified_at: new Date().toISOString()
            }
          })
          .eq('id', payment.id)

        // Credit user
        await supabaseAdmin!
          .from('User')
          .update({
            credits: newCredits,
            plan: 'FLEX'
          })
          .eq('id', session.user.id)

        return NextResponse.json({
          status: 'paid',
          paid: true,
          credits: newCredits,
          message: "Payment completed successfully"
        })
      }

      // Payment still pending
      return NextResponse.json({
        status: payment.status,
        paid: false,
        message: "Payment pending"
      })
    } catch (razorpayError) {
      console.error("Error checking Razorpay order status:", razorpayError)
      // Return current status from database
      return NextResponse.json({
        status: payment.status,
        paid: payment.status === 'paid',
        message: payment.status === 'paid' ? "Payment completed" : "Payment pending"
      })
    }
  } catch (error) {
    console.error("Error checking payment status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

