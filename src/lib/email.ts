/**
 * Email Service
 * Provides abstraction for sending transactional emails with support for multiple providers
 */

import { supabaseAdmin } from './supabase'

export type EmailProvider = 'resend' | 'sendgrid' | 'ses' | 'smtp' | 'console'

export interface EmailOptions {
  to: string
  toName?: string
  from?: string
  fromName?: string
  subject: string
  htmlBody: string
  textBody?: string
  templateName?: string
  templateVariables?: Record<string, unknown>
  userId?: string
  organizationId?: string
  scheduledFor?: Date
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Gets the email provider from environment
 */
function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'console'
  return provider as EmailProvider
}

/**
 * Sends email using Resend
 */
async function sendWithResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || process.env.EMAIL_FROM || 'noreply@your-domain.com',
        to: options.to,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return {
        success: false,
        error: data.message || 'Failed to send email',
      }
    }

    return {
      success: true,
      messageId: data.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sends email using SendGrid
 */
async function sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured')
  }

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: options.from || process.env.EMAIL_FROM || 'noreply@your-domain.com',
          name: options.fromName || 'QR Generator',
        },
        personalizations: [
          {
            to: [{ email: options.to, name: options.toName }],
            subject: options.subject,
          },
        ],
        content: [
          {
            type: 'text/html',
            value: options.htmlBody,
          },
        ],
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      return {
        success: false,
        error: error || 'Failed to send email',
      }
    }

    return {
      success: true,
      messageId: res.headers.get('x-message-id') || undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sends email using AWS SES
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendWithSES(_: EmailOptions): Promise<EmailResult> {
  // AWS SES implementation would use AWS SDK
  // For now, return error to indicate it needs AWS SDK
  return {
    success: false,
    error: 'AWS SES requires AWS SDK - not implemented yet',
  }
}

/**
 * Sends email using SMTP
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendWithSMTP(_: EmailOptions): Promise<EmailResult> {
  // SMTP implementation would use nodemailer
  // For now, return error to indicate it needs nodemailer configuration
  return {
    success: false,
    error: 'SMTP requires nodemailer configuration - not fully implemented yet',
  }
}

/**
 * Console provider (for development)
 */
async function sendWithConsole(options: EmailOptions): Promise<EmailResult> {
  console.log('=== EMAIL (Console Provider) ===')
  console.log('To:', options.to)
  console.log('Subject:', options.subject)
  console.log('HTML Body:', options.htmlBody)
  console.log('===============================')
  
  return {
    success: true,
    messageId: `console-${Date.now()}`,
  }
}

/**
 * Sends an email via the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Queue email for async sending
  try {
    const { data: queueItem, error: queueError } = await supabaseAdmin!
      .from('EmailQueue')
      .insert({
        toEmail: options.to,
        toName: options.toName || null,
        fromEmail: options.from || process.env.EMAIL_FROM || 'noreply@your-domain.com',
        fromName: options.fromName || 'QR Generator',
        subject: options.subject,
        htmlBody: options.htmlBody,
        textBody: options.textBody || null,
        templateName: options.templateName || null,
        templateVariables: options.templateVariables || null,
        userId: options.userId || null,
        organizationId: options.organizationId || null,
        scheduledFor: options.scheduledFor?.toISOString() || new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single()

    if (queueError || !queueItem) {
      console.error('Failed to queue email:', queueError)
      // Try to send directly if queue fails
      return await sendEmailDirectly(options)
    }

    // Send email directly (in production, use a queue worker)
    return await sendEmailDirectly(options)
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Sends email directly (bypasses queue)
 */
async function sendEmailDirectly(options: EmailOptions): Promise<EmailResult> {
  const provider = getEmailProvider()
  let result: EmailResult

  switch (provider) {
    case 'resend':
      result = await sendWithResend(options)
      break
    case 'sendgrid':
      result = await sendWithSendGrid(options)
      break
    case 'ses':
      result = await sendWithSES(options)
      break
    case 'smtp':
      result = await sendWithSMTP(options)
      break
    case 'console':
    default:
      result = await sendWithConsole(options)
      break
  }

  // Log email result
  try {
    const { data: queueItem } = await supabaseAdmin!
      .from('EmailQueue')
      .select('id')
      .eq('toEmail', options.to)
      .eq('subject', options.subject)
      .order('createdAt', { ascending: false })
      .limit(1)
      .maybeSingle()

    await supabaseAdmin!.from('EmailLog').insert({
      queueId: queueItem?.id || null,
      toEmail: options.to,
      fromEmail: options.from || process.env.EMAIL_FROM || 'noreply@your-domain.com',
      subject: options.subject,
      templateName: options.templateName || null,
      userId: options.userId || null,
      organizationId: options.organizationId || null,
      provider,
      providerMessageId: result.messageId || null,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error || null,
    })

    if (queueItem) {
      await supabaseAdmin!
        .from('EmailQueue')
        .update({
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date().toISOString() : null,
          errorMessage: result.error || null,
          attempts: 1,
        })
        .eq('id', queueItem.id)
    }
  } catch (error) {
    console.error('Failed to log email:', error)
  }

  return result
}

/**
 * Gets email template and renders with variables
 */
export async function getEmailTemplate(
  templateName: string,
  variables: Record<string, unknown> = {}
): Promise<{ subject: string; htmlBody: string; textBody?: string } | null> {
  try {
    const { data: template, error } = await supabaseAdmin!
      .from('EmailTemplate')
      .select('*')
      .eq('name', templateName)
      .eq('isActive', true)
      .maybeSingle()

    if (error || !template) {
      return null
    }

    // Simple variable replacement ({{variable}})
    let subject = template.subject
    let htmlBody = template.htmlBody
    let textBody = template.textBody || undefined

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      subject = subject.replace(regex, String(value))
      htmlBody = htmlBody.replace(regex, String(value))
      if (textBody) {
        textBody = textBody.replace(regex, String(value))
      }
    }

    return { subject, htmlBody, textBody }
  } catch (error) {
    console.error('Error getting email template:', error)
    return null
  }
}

