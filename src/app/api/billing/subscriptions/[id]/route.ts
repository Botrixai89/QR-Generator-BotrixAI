import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

const getRazorpay = async () => {
  const Razorpay = (await import("razorpay")).default
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

// GET - Get subscription details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { data: sub } = await supabaseAdmin!
      .from('Subscription')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .maybeSingle()

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({ subscription: sub })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Cancel or resume subscription
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body || {}

    const { data: sub } = await supabaseAdmin!
      .from('Subscription')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .maybeSingle()

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    if (!sub.gatewaySubscriptionId) {
      return NextResponse.json({ error: "Subscription not linked to gateway" }, { status: 400 })
    }

    const razorpay = await getRazorpay()

    if (action === 'cancel') {
      // Cancel at period end
      await razorpay.subscriptions.cancel(sub.gatewaySubscriptionId, true)
      await supabaseAdmin!.from('Subscription').update({
        cancelAtPeriodEnd: true,
        updatedAt: new Date().toISOString(),
      }).eq('id', id)
      return NextResponse.json({ ok: true, message: "Subscription will cancel at period end" })
    }

    if (action === 'resume') {
      // Resume subscription - cancel the cancellation
      await razorpay.subscriptions.cancel(sub.gatewaySubscriptionId, false)
      await supabaseAdmin!.from('Subscription').update({
        cancelAtPeriodEnd: false,
        status: 'active',
        graceUntil: null,
        updatedAt: new Date().toISOString(),
      }).eq('id', id)
      return NextResponse.json({ ok: true, message: "Subscription resumed" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error'
    console.error('Subscription management error:', e)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}

// DELETE - Cancel immediately
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { data: sub } = await supabaseAdmin!
      .from('Subscription')
      .select('*')
      .eq('id', id)
      .eq('userId', session.user.id)
      .maybeSingle()

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    if (sub.gatewaySubscriptionId) {
      const razorpay = await getRazorpay()
      await razorpay.subscriptions.cancel(sub.gatewaySubscriptionId)
    }

    await supabaseAdmin!.from('Subscription').update({
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).eq('id', id)

    // Downgrade user to FREE
    await supabaseAdmin!.from('User').update({ plan: 'FREE' }).eq('id', session.user.id)

    return NextResponse.json({ ok: true, message: "Subscription canceled" })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Internal server error'
    console.error('Subscription cancellation error:', e)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}

