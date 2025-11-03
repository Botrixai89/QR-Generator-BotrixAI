import { NextRequest, NextResponse } from 'next/server'
import { sendDailyEmailDigests, sendWeeklyEmailDigests } from '@/lib/email-digest'
import { addSecurityHeaders } from '@/lib/security-headers'

/**
 * POST /api/cron/email-digest
 * Cron endpoint for sending email digests
 * Should be called by a cron job service
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (optional security measure)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { frequency } = body

    if (frequency === 'daily') {
      await sendDailyEmailDigests()
    } else if (frequency === 'weekly') {
      await sendWeeklyEmailDigests()
    } else {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
    }

    const response = NextResponse.json({ success: true, message: 'Email digests sent' })
    return addSecurityHeaders(response, request)
  } catch (error) {
    console.error('Error in POST /api/cron/email-digest:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

