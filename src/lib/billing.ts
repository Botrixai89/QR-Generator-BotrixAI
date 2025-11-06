import { supabaseAdmin } from '@/lib/supabase'

export async function getActiveSubscription(userId: string) {
  const { data } = await supabaseAdmin!
    .from('Subscription')
    .select('*')
    .eq('userId', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

export function isInGracePeriod(sub: { graceUntil?: string | null } | null): boolean {
  if (!sub?.graceUntil) return false
  return new Date(sub.graceUntil).getTime() > Date.now()
}

export function isLockedOut(sub: { status?: string | null; graceUntil?: string | null } | null): boolean {
  if (!sub) return false
  if (sub.status && ['canceled', 'incomplete'].includes(sub.status)) {
    return !isInGracePeriod(sub)
  }
  if (sub.status === 'past_due') {
    return false // allow while past_due; rely on graceUntil if needed
  }
  return false
}

export async function recordIdempotentWebhook(gateway: string, eventId: string): Promise<boolean> {
  // returns true if newly recorded; false if already processed
  const { error } = await supabaseAdmin!
    .from('WebhookIdempotency')
    .insert({ gateway, eventId })
  if (error) {
    // unique violation means already processed
    return false
  }
  return true
}


