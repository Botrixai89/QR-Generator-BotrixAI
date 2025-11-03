/**
 * Mock gateways for local development
 * Provides mock implementations of external services (Razorpay, Email, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Mock Razorpay Gateway
 */
export class MockRazorpayGateway {
  public orders: Map<string, any> = new Map()
  public payments: Map<string, any> = new Map()

  async createOrder(amount: number, currency: string = 'INR') {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const order = {
      id: orderId,
      entity: 'order',
      amount: amount * 100, // Convert to paise
      amount_paid: 0,
      amount_due: amount * 100,
      currency,
      receipt: `receipt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000),
    }
    this.orders.set(orderId, order)
    return order
  }

  async capturePayment(paymentId: string, amount: number) {
    const payment = {
      id: paymentId,
      entity: 'payment',
      amount: amount * 100,
      currency: 'INR',
      status: 'captured',
      order_id: this.orders.values().next().value?.id,
      created_at: Math.floor(Date.now() / 1000),
    }
    this.payments.set(paymentId, payment)
    return payment
  }

  async verifyPayment(orderId: string, paymentId: string, signature: string) {
    // Mock signature verification - always returns true in dev
    const payment = this.payments.get(paymentId)
    if (!payment) {
      return { valid: false, error: 'Payment not found' }
    }
    return { valid: true, payment }
  }

  getPayment(paymentId: string) {
    return this.payments.get(paymentId) || null
  }
}

/**
 * Mock Email Gateway
 */
export class MockEmailGateway {
  private sentEmails: any[] = []

  async sendEmail(options: {
    to: string | string[]
    from?: string
    subject: string
    html?: string
    text?: string
  }) {
    const email = {
      id: `email_${Date.now()}`,
      to: Array.isArray(options.to) ? options.to : [options.to],
      from: options.from || 'noreply@example.com',
      subject: options.subject,
      html: options.html,
      text: options.text,
      sentAt: new Date().toISOString(),
    }
    
    this.sentEmails.push(email)
    
    // Log to console in development
    console.log('\n📧 Mock Email Sent:')
    console.log('  To:', email.to.join(', '))
    console.log('  From:', email.from)
    console.log('  Subject:', email.subject)
    if (email.html) {
      console.log('  HTML:', email.html.substring(0, 100) + '...')
    }
    
    return {
      id: email.id,
      success: true,
      message: 'Email sent successfully (mocked)',
    }
  }

  getSentEmails() {
    return [...this.sentEmails]
  }

  clearSentEmails() {
    this.sentEmails = []
  }
}

/**
 * Mock Webhook Gateway
 */
export class MockWebhookGateway {
  private webhooks: Map<string, any[]> = new Map()

  async sendWebhook(url: string, payload: any, secret?: string) {
    const webhook = {
      id: `webhook_${Date.now()}`,
      url,
      payload,
      secret,
      sentAt: new Date().toISOString(),
      status: 'sent',
      response: {
        status: 200,
        body: { success: true },
      },
    }

    if (!this.webhooks.has(url)) {
      this.webhooks.set(url, [])
    }
    this.webhooks.get(url)!.push(webhook)

    console.log('\n🔗 Mock Webhook Sent:')
    console.log('  URL:', url)
    console.log('  Payload:', JSON.stringify(payload, null, 2).substring(0, 200) + '...')

    return webhook
  }

  getWebhooks(url: string) {
    return this.webhooks.get(url) || []
  }

  clearWebhooks() {
    this.webhooks.clear()
  }
}

// Singleton instances
export const mockRazorpay = new MockRazorpayGateway()
export const mockEmail = new MockEmailGateway()
export const mockWebhook = new MockWebhookGateway()

/**
 * Mock gateway middleware
 * Replaces external service calls with mocks in development
 */
export function useMockGateways() {
  if (process.env.NODE_ENV !== 'development' && process.env.USE_MOCK_GATEWAYS !== 'true') {
    return false
  }

  // Mock Razorpay in development
  if (process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test') || process.env.USE_MOCK_GATEWAYS === 'true') {
    // Replace Razorpay instance with mock
    // This would typically be done through dependency injection
    console.log('🔧 Using Mock Razorpay Gateway')
  }

  // Mock Email in development
  if (process.env.EMAIL_PROVIDER === 'console' || process.env.USE_MOCK_GATEWAYS === 'true') {
    console.log('🔧 Using Mock Email Gateway')
  }

  return true
}

/**
 * API endpoint to view mock gateway data (development only)
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'emails') {
    return NextResponse.json({
      emails: mockEmail.getSentEmails(),
      count: mockEmail.getSentEmails().length,
    })
  }

  if (type === 'webhooks') {
    const url = searchParams.get('url')
    return NextResponse.json({
      webhooks: url ? mockWebhook.getWebhooks(url) : Array.from(mockWebhook.getWebhooks('')),
      count: url ? mockWebhook.getWebhooks(url).length : 0,
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
    usage: 'GET /api/mock-gateways?type=<type>',
  })
}

