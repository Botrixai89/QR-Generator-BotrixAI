import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

const getRazorpay = async () => {
  const Razorpay = (await import("razorpay")).default
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

const PLAN_PRICES: Record<string, number> = {
  PRO: 1999, // ₹19.99/month
  BUSINESS: 4999, // ₹49.99/month
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { plan, trialDays } = body || {}
    const planUpper = String(plan || '').toUpperCase()
    
    if (!planUpper || !['PRO', 'BUSINESS'].includes(planUpper)) {
      return NextResponse.json({ error: "Valid plan (PRO or BUSINESS) is required" }, { status: 400 })
    }

    const price = PLAN_PRICES[planUpper]
    if (!price) {
      return NextResponse.json({ error: "Plan pricing not configured" }, { status: 400 })
    }

    // Create Razorpay subscription
    const razorpay = await getRazorpay()
    const now = Date.now()
    const trialEnd = trialDays && trialDays > 0
      ? Math.floor(now / 1000) + trialDays * 24 * 60 * 60
      : undefined

    const subscription = await razorpay.subscriptions.create({
      plan_id: `plan_${planUpper.toLowerCase()}`,
      customer_notify: 1,
      total_count: 12, // 12 months
      notes: {
        plan: planUpper,
        user_id: session.user.id
      },
      ...(trialEnd ? { start_at: trialEnd } : {})
    })

    // Get customer or create billing profile
    let customerId: string | null = null
    const { data: profile } = await supabaseAdmin!
      .from('BillingProfile')
      .select('customerId')
      .eq('userId', session.user.id)
      .maybeSingle()

    if (!profile?.customerId) {
      // Create Razorpay customer if needed
      const customer = await razorpay.customers.create({
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        notes: {
          user_id: session.user.id
        }
      })
      customerId = customer.id
      await supabaseAdmin!.from('BillingProfile').upsert({
        userId: session.user.id,
        customerId: customer.id,
        billingEmail: session.user.email || null,
      })
    } else {
      customerId = profile.customerId
    }

    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date(currentPeriodStart)
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

    // Create subscription record
    const { data: sub, error } = await supabaseAdmin!
      .from('Subscription')
      .insert({
        userId: session.user.id,
        plan: planUpper,
        status: trialEnd ? 'trialing' : 'active',
        gatewaySubscriptionId: subscription.id,
        currentPeriodStart: currentPeriodStart.toISOString(),
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        trialEnd: trialEnd ? new Date(trialEnd * 1000).toISOString() : null,
        createdAt: currentPeriodStart.toISOString(),
        updatedAt: currentPeriodStart.toISOString(),
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating subscription record:', error)
      return NextResponse.json({ error: "Failed to create subscription record" }, { status: 500 })
    }

    // Update user plan
    await supabaseAdmin!.from('User').update({ plan: planUpper }).eq('id', session.user.id)

    return NextResponse.json({
      subscription: sub,
      razorpay_subscription_id: subscription.id,
      razorpay_key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    })
  } catch (e: any) {
    console.error('Subscription creation error:', e)
    return NextResponse.json({ error: "Internal server error", details: e.message }, { status: 500 })
  }
}


