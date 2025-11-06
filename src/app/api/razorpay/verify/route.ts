import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id: string } } | null
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      console.error("Invalid Razorpay signature")
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      )
    }

    // Get payment record
    const { data: payment, error: fetchError } = await supabaseAdmin!
      .from('payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError || !payment) {
      console.error("Payment record not found:", fetchError)
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      )
    }

    // Check if already processed
    if (payment.status === 'paid') {
      return NextResponse.json({
        ok: true,
        credits: payment.metadata?.credits_added || 0,
        message: "Payment already processed"
      })
    }

    // Update payment status
    const { error: updateError } = await supabaseAdmin!
      .from('payments')
      .update({
        status: 'paid',
        razorpay_payment_id: razorpay_payment_id,
        metadata: {
          ...payment.metadata,
          credits_added: 100,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', payment.id)

    if (updateError) {
      console.error("Error updating payment:", updateError)
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      )
    }

    // Credit user with 100 credits and update plan
    const { data: user, error: userError } = await supabaseAdmin!
      .from('User')
      .select('credits')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      console.error("Error fetching user:", userError)
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
      .eq('id', session.user.id)

    if (creditError) {
      console.error("Error crediting user:", creditError)
      return NextResponse.json(
        { error: "Failed to credit user" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      credits: newCredits,
      message: "Payment verified and credits added successfully"
    })

  } catch (error) {
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
