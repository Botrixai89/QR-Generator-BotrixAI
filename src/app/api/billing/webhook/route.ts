import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { recordIdempotentWebhook } from '@/lib/billing'

function verifyRazorpaySignature(body: string, secret: string, signature: string | null): boolean {
  if (!signature) return false
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return expected === signature
}

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
    }

    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    if (!verifyRazorpaySignature(body, secret, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    let evt
    try {
      evt = JSON.parse(body)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }
    const eventId = evt?.payload?.payment?.entity?.id || evt?.payload?.subscription?.entity?.id || evt?.id || 'unknown'
    const recorded = await recordIdempotentWebhook('razorpay', String(eventId))
    if (!recorded) {
      return NextResponse.json({ ok: true, message: 'Duplicate webhook, ignored' })
    }

    // Handle subscription and invoice-like events
    const eventType = evt?.event
    switch (eventType) {
      case 'subscription.activated':
      case 'subscription.renewed': {
        const sub = evt.payload.subscription.entity
        const { data: existing } = await supabaseAdmin!
          .from('Subscription')
          .select('*')
          .eq('gatewaySubscriptionId', sub.id)
          .maybeSingle()
        if (existing) {
          await supabaseAdmin!.from('Subscription').update({
            status: 'active',
            currentPeriodStart: new Date(sub.current_start * 1000).toISOString(),
            currentPeriodEnd: new Date(sub.current_end * 1000).toISOString(),
            graceUntil: null,
            updatedAt: new Date().toISOString(),
          }).eq('id', existing.id)
        }
        break
      }
      case 'subscription.halted':
      case 'subscription.paused': {
        const sub = evt.payload.subscription.entity
        const { data: existing } = await supabaseAdmin!
          .from('Subscription')
          .select('*')
          .eq('gatewaySubscriptionId', sub.id)
          .maybeSingle()
        if (existing) {
          const graceUntil = sub.end_at ? new Date((sub.end_at + 7 * 24 * 60 * 60) * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          await supabaseAdmin!.from('Subscription').update({
            status: 'past_due',
            graceUntil,
            updatedAt: new Date().toISOString(),
          }).eq('id', existing.id)
        }
        break
      }
      case 'subscription.completed':
      case 'subscription.cancelled': {
        const sub = evt.payload.subscription.entity
        const { data: existing } = await supabaseAdmin!
          .from('Subscription')
          .select('*')
          .eq('gatewaySubscriptionId', sub.id)
          .maybeSingle()
        if (existing) {
          const graceUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          await supabaseAdmin!.from('Subscription').update({
            status: 'canceled',
            canceledAt: new Date().toISOString(),
            graceUntil,
            updatedAt: new Date().toISOString(),
          }).eq('id', existing.id)
          
          // Optionally downgrade user after grace period
          await supabaseAdmin!.from('User').select('plan').eq('id', existing.userId).maybeSingle()
          // Keep plan during grace period, downgrade handled separately if needed
        }
        break
      }
      case 'invoice.paid': {
        const inv = evt.payload.payment.entity
        // If linked subscription payment, try to attach and record invoice
        const subscriptionId = evt?.payload?.subscription?.entity?.id || inv.subscription_id || null
        let userId: string | null = null
        if (subscriptionId) {
          const { data: subRow } = await supabaseAdmin!
            .from('Subscription')
            .select('id, userId')
            .eq('gatewaySubscriptionId', subscriptionId)
            .maybeSingle()
          userId = subRow?.userId || null
        }
        if (userId) {
          const invoiceData = await supabaseAdmin!.from('Invoice').insert({
            userId,
            subscriptionId: (await supabaseAdmin!.from('Subscription').select('id').eq('gatewaySubscriptionId', subscriptionId!).maybeSingle()).data?.id || null,
            gateway: 'razorpay',
            gatewayInvoiceId: inv.id,
            amountCents: inv.amount || 0,
            currency: (inv.currency || 'INR').toUpperCase(),
            status: 'paid',
            pdfUrl: inv.invoice_url || null,
            paidAt: new Date().toISOString(),
          }).select().single()

          // Send receipt email
          try {
            const { data: user } = await supabaseAdmin!
              .from('User')
              .select('email, name')
              .eq('id', userId)
              .single()

            const { data: subscription } = await supabaseAdmin!
              .from('Subscription')
              .select('plan')
              .eq('userId', userId)
              .maybeSingle()

            if (user?.email && invoiceData.data) {
              const { sendReceiptEmail } = await import('@/lib/transactional-emails')
              await sendReceiptEmail(
                userId,
                user.email,
                user.name || 'User',
                {
                  id: invoiceData.data.id,
                  amount: invoiceData.data.amountCents / 100, // Convert from cents
                  currency: invoiceData.data.currency,
                  paidAt: invoiceData.data.paidAt || new Date().toISOString(),
                  plan: subscription?.plan || undefined,
                }
              )
            }
          } catch (error) {
            // Don't fail webhook if email fails
            console.error('Failed to send receipt email:', error)
          }
        }
        break
      }
      case 'payment.failed': {
        const payment = evt.payload.payment.entity
        // Find subscription/user for failed payment
        const subscriptionId = payment.subscription_id || null
        let userId: string | null = null
        if (subscriptionId) {
          const { data: subRow } = await supabaseAdmin!
            .from('Subscription')
            .select('userId')
            .eq('gatewaySubscriptionId', subscriptionId)
            .maybeSingle()
          userId = subRow?.userId || null
        }
        
        if (userId) {
          // Send dunning email
          try {
            const { data: user } = await supabaseAdmin!
              .from('User')
              .select('email, name')
              .eq('id', userId)
              .single()

            const { data: subscription } = await supabaseAdmin!
              .from('Subscription')
              .select('currentPeriodEnd')
              .eq('userId', userId)
              .maybeSingle()

            if (user?.email) {
              const { sendDunningEmail } = await import('@/lib/transactional-emails')
              await sendDunningEmail(
                userId,
                user.email,
                user.name || 'User',
                {
                  id: payment.id,
                  amount: (payment.amount || 0) / 100, // Convert from paise to rupees
                  currency: (payment.currency || 'INR').toUpperCase(),
                  dueDate: subscription?.currentPeriodEnd || new Date().toISOString(),
                }
              )
            }
          } catch (error) {
            // Don't fail webhook if email fails
            console.error('Failed to send dunning email:', error)
          }
        }
        break
      }
      default:
        // ignore unhandled events
        break
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Billing webhook error', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// mapRazorpaySubStatus not used currently; remove to satisfy linter


