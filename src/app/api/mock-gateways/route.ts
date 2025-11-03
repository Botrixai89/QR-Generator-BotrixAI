/**
 * Mock Gateways API (Development Only)
 * Provides access to mock gateway data for testing and development
 */

import { NextRequest, NextResponse } from 'next/server'
import { mockRazorpay, mockEmail, mockWebhook } from '@/../../scripts/mock-gateways'

export async function GET(request: NextRequest) {
  // Only available in development
  if (process.env.NODE_ENV !== 'development' && process.env.USE_MOCK_GATEWAYS !== 'true') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const action = searchParams.get('action')

  // Clear actions
  if (action === 'clear') {
    if (type === 'emails') {
      mockEmail.clearSentEmails()
      return NextResponse.json({ message: 'Emails cleared' })
    }
    if (type === 'webhooks') {
      mockWebhook.clearWebhooks()
      return NextResponse.json({ message: 'Webhooks cleared' })
    }
  }

  // Get data
  if (type === 'emails') {
    return NextResponse.json({
      emails: mockEmail.getSentEmails(),
      count: mockEmail.getSentEmails().length,
    })
  }

  if (type === 'webhooks') {
    const url = searchParams.get('url')
    const webhooks = url ? mockWebhook.getWebhooks(url) : Array.from(mockWebhook.getWebhooks(''))
    return NextResponse.json({
      webhooks,
      count: webhooks.length,
    })
  }

  if (type === 'payments') {
    return NextResponse.json({
      payments: Array.from(mockRazorpay.payments.values()),
      orders: Array.from(mockRazorpay.orders.values()),
    })
  }

  return NextResponse.json({
    available: ['emails', 'webhooks', 'payments'],
    usage: 'GET /api/mock-gateways?type=<type>&action=<clear>',
  })
}

