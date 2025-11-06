import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

function isAdmin(email?: string | null): boolean {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return !!email && list.includes(email.toLowerCase())
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { email?: string } } | null
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { userId, type, amountCents, plan, reason } = body || {}
    if (!userId || !type) {
      return NextResponse.json({ error: "userId and type are required" }, { status: 400 })
    }

    // Perform adjustment
    if (type === 'credit_grant') {
      const { data: userRow } = await supabaseAdmin!.from('User').select('credits').eq('id', userId).single()
      const nextCredits = (userRow?.credits || 0) + Math.round((amountCents || 0) / 100)
      await supabaseAdmin!.from('User').update({ credits: nextCredits }).eq('id', userId)
    } else if (type === 'plan_override') {
      if (!plan) {
        return NextResponse.json({ error: "plan is required for plan_override" }, { status: 400 })
      }
      await supabaseAdmin!.from('User').update({ plan: String(plan).toUpperCase() }).eq('id', userId)
    } else if (type === 'refund') {
      // Record refund in adjustments; actual gateway refund should be handled via operator action or separate integration
    }

    await supabaseAdmin!.from('BillingAdjustment').insert({
      userId,
      type,
      amountCents: amountCents || null,
      plan: plan || null,
      reason: reason || null,
      createdBy: session.user.email,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 })
  }
}


