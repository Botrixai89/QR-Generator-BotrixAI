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
    const { invoiceId, amountCents, reason } = body || {}
    
    if (!invoiceId) {
      return NextResponse.json({ error: "invoiceId is required" }, { status: 400 })
    }

    // Get invoice
    const { data: invoice } = await supabaseAdmin!
      .from('Invoice')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle()

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status !== 'paid') {
      return NextResponse.json({ error: "Invoice must be paid to refund" }, { status: 400 })
    }

    // Process Razorpay refund
    const razorpay = await getRazorpay()
    const refundAmount = amountCents || invoice.amountCents
    
    const refund = await razorpay.payments.refund(invoice.gatewayInvoiceId || '', {
      amount: refundAmount,
      notes: {
        reason: reason || 'Admin refund',
        invoice_id: invoice.id
      }
    })

    // Update invoice status
    await supabaseAdmin!.from('Invoice').update({
      status: 'refunded',
    }).eq('id', invoiceId)

    // Record adjustment
    await supabaseAdmin!.from('BillingAdjustment').insert({
      userId: invoice.userId,
      type: 'refund',
      amountCents: refundAmount,
      reason: reason || 'Admin refund',
      createdBy: session.user.email,
    })

    return NextResponse.json({
      ok: true,
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status
      }
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('Refund error:', e)
    return NextResponse.json({ error: "Internal server error", details: message }, { status: 500 })
  }
}

