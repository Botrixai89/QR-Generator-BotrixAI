/**
 * Transactional Email Functions
 * Provides functions for sending specific transactional emails
 */

import { sendEmail, getEmailTemplate } from './email'
import { supabaseAdmin } from './supabase'

// Use Web Crypto API for edge runtime compatibility (works in both edge and Node.js)
function generateRandomBytes(length: number): Uint8Array {
  // Web Crypto API is available in both edge runtime and Node.js 15.0.0+
  const array = new Uint8Array(length)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for older environments (shouldn't happen in modern Node.js)
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return array
}

function randomBytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

const APP_NAME = process.env.APP_NAME || 'QR Generator'
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

/**
 * Sends email verification email
 */
export async function sendEmailVerification(
  userId: string,
  email: string,
  name?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Generate verification token
    const token = randomBytesToHex(generateRandomBytes(32))
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    // Store token
    const { error: tokenError } = await supabaseAdmin!.from('EmailVerificationToken').insert({
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
    })

    if (tokenError) {
      return { success: false, error: 'Failed to create verification token' }
    }

    // Get email template or use default
    const template = await getEmailTemplate('email_verification', {
      name: name || 'User',
      verificationUrl: `${APP_URL}/auth/verify-email?token=${token}`,
      appName: APP_NAME,
    })

    const subject = template?.subject || `Verify your ${APP_NAME} account`
    const htmlBody =
      template?.htmlBody ||
      `
      <h1>Verify Your Email</h1>
      <p>Hi ${name || 'User'},</p>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${APP_URL}/auth/verify-email?token=${token}">Verify Email</a></p>
      <p>This link expires in 7 days.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `

    const result = await sendEmail({
      to: email,
      toName: name,
      subject,
      htmlBody,
      templateName: 'email_verification',
      templateVariables: { name: name || 'User', token },
      userId,
    })

    return { success: result.success, token: result.success ? token : undefined, error: result.error }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send verification email',
    }
  }
}

/**
 * Sends password reset email
 */
export async function sendPasswordReset(
  userId: string,
  email: string,
  name?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    // Generate reset token
    const token = randomBytesToHex(generateRandomBytes(32))
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour

    // Store token
    const { error: tokenError } = await supabaseAdmin!.from('PasswordResetToken').insert({
      userId,
      token,
      expiresAt: expiresAt.toISOString(),
    })

    if (tokenError) {
      return { success: false, error: 'Failed to create reset token' }
    }

    // Get email template or use default
    const template = await getEmailTemplate('password_reset', {
      name: name || 'User',
      resetUrl: `${APP_URL}/auth/reset-password?token=${token}`,
      appName: APP_NAME,
    })

    const subject = template?.subject || `Reset your ${APP_NAME} password`
    const htmlBody =
      template?.htmlBody ||
      `
      <h1>Reset Your Password</h1>
      <p>Hi ${name || 'User'},</p>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <p><a href="${APP_URL}/auth/reset-password?token=${token}">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `

    const result = await sendEmail({
      to: email,
      toName: name,
      subject,
      htmlBody,
      templateName: 'password_reset',
      templateVariables: { name: name || 'User', token },
      userId,
    })

    return { success: result.success, token: result.success ? token : undefined, error: result.error }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send password reset email',
    }
  }
}

/**
 * Sends organization invitation email
 */
export async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  role: string,
  token: string,
  organizationId?: string
): Promise<EmailResult> {
  const inviteUrl = `${APP_URL}/invite/${token}`

  const template = await getEmailTemplate('invitation', {
    inviterName,
    organizationName,
    role,
    inviteUrl,
    appName: APP_NAME,
  })

  const subject = template?.subject || `You've been invited to join ${organizationName}`
  const htmlBody =
    template?.htmlBody ||
    `
    <h1>You've Been Invited!</h1>
    <p>Hi,</p>
    <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
    <p><a href="${inviteUrl}">Accept Invitation</a></p>
    <p>This invitation expires in 7 days.</p>
    <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
  `

  return await sendEmail({
    to: email,
    subject,
    htmlBody,
    templateName: 'invitation',
    templateVariables: { inviterName, organizationName, role, token },
    organizationId,
  })
}

/**
 * Sends payment receipt email
 */
export async function sendReceiptEmail(
  userId: string,
  email: string,
  name: string,
  invoice: {
    id: string
    amount: number
    currency: string
    paidAt: string
    plan?: string
  }
): Promise<EmailResult> {
  const template = await getEmailTemplate('receipt', {
    name,
    invoiceId: invoice.id,
    amount: invoice.amount,
    currency: invoice.currency,
    paidAt: invoice.paidAt,
    plan: invoice.plan || 'N/A',
    appName: APP_NAME,
  })

  const subject = template?.subject || `Payment receipt from ${APP_NAME}`
  const htmlBody =
    template?.htmlBody ||
    `
    <h1>Payment Receipt</h1>
    <p>Hi ${name},</p>
    <p>Thank you for your payment!</p>
    <h2>Invoice Details</h2>
    <ul>
      <li>Invoice ID: ${invoice.id}</li>
      <li>Amount: ${invoice.currency} ${invoice.amount}</li>
      <li>Plan: ${invoice.plan || 'N/A'}</li>
      <li>Paid At: ${invoice.paidAt}</li>
    </ul>
    <p><a href="${APP_URL}/dashboard/settings/billing">View Invoice</a></p>
  `

  return await sendEmail({
    to: email,
    toName: name,
    subject,
    htmlBody,
    templateName: 'receipt',
    templateVariables: { name, invoice },
    userId,
  })
}

/**
 * Sends dunning email (failed payment reminder)
 */
export async function sendDunningEmail(
  userId: string,
  email: string,
  name: string,
  invoice: {
    id: string
    amount: number
    currency: string
    dueDate: string
  }
): Promise<EmailResult> {
  const template = await getEmailTemplate('dunning', {
    name,
    invoiceId: invoice.id,
    amount: invoice.amount,
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    paymentUrl: `${APP_URL}/dashboard/settings/billing`,
    appName: APP_NAME,
  })

  const subject = template?.subject || `Payment failed - Action required`
  const htmlBody =
    template?.htmlBody ||
    `
    <h1>Payment Failed</h1>
    <p>Hi ${name},</p>
    <p>We attempted to process your payment but it failed.</p>
    <h2>Invoice Details</h2>
    <ul>
      <li>Invoice ID: ${invoice.id}</li>
      <li>Amount: ${invoice.currency} ${invoice.amount}</li>
      <li>Due Date: ${invoice.dueDate}</li>
    </ul>
    <p><a href="${APP_URL}/dashboard/settings/billing">Update Payment Method</a></p>
    <p>Please update your payment method to avoid service interruption.</p>
  `

  return await sendEmail({
    to: email,
    toName: name,
    subject,
    htmlBody,
    templateName: 'dunning',
    templateVariables: { name, invoice },
    userId,
  })
}

/**
 * Sends usage alert email
 */
export async function sendUsageAlertEmail(
  userId: string,
  email: string,
  name: string,
  alert: {
    type: 'credits_low' | 'scan_threshold' | 'domain_verification' | 'threshold_crossed'
    threshold: number
    currentValue: number
    message: string
  }
): Promise<EmailResult> {
  const template = await getEmailTemplate('usage_alert', {
    name,
    alertType: alert.type,
    threshold: alert.threshold,
    currentValue: alert.currentValue,
    message: alert.message,
    dashboardUrl: `${APP_URL}/dashboard`,
    appName: APP_NAME,
  })

  const subject = template?.subject || `Usage Alert: ${alert.type.replace('_', ' ')}`
  const htmlBody =
    template?.htmlBody ||
    `
    <h1>Usage Alert</h1>
    <p>Hi ${name},</p>
    <p>${alert.message}</p>
    <ul>
      <li>Type: ${alert.type}</li>
      <li>Threshold: ${alert.threshold}</li>
      <li>Current Value: ${alert.currentValue}</li>
    </ul>
    <p><a href="${APP_URL}/dashboard">View Dashboard</a></p>
  `

  return await sendEmail({
    to: email,
    toName: name,
    subject,
    htmlBody,
    templateName: 'usage_alert',
    templateVariables: { name, alert },
    userId,
  })
}

// Re-export EmailResult type
export type { EmailResult } from './email'

