import { supabaseAdmin } from '@/lib/supabase'

export interface RateLimitOptions {
  key: string // user:<id> or ip:<ip>
  route: string
  windowSeconds: number
  maxRequests: number
}

export async function rateLimit(options: RateLimitOptions): Promise<{ allowed: boolean; retryAfter?: number }> {
  const { key, route, windowSeconds, maxRequests } = options

  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()

  // Try to find an existing record in the current window
  const { data: existing } = await supabaseAdmin!
    .from('ApiRateLimit')
    .select('*')
    .eq('key', key)
    .eq('route', route)
    .gte('windowStart', windowStart)
    .order('windowStart', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    if (existing.requestCount >= maxRequests) {
      const retryAfter = Math.ceil((new Date(existing.windowStart).getTime() + windowSeconds * 1000 - Date.now()) / 1000)
      return { allowed: false, retryAfter }
    }
    await supabaseAdmin!
      .from('ApiRateLimit')
      .update({ requestCount: existing.requestCount + 1, lastRequestAt: new Date().toISOString() })
      .eq('id', existing.id)
    return { allowed: true }
  }

  await supabaseAdmin!
    .from('ApiRateLimit')
    .insert({ key, route, requestCount: 1, windowStart: new Date().toISOString(), lastRequestAt: new Date().toISOString() })

  return { allowed: true }
}


