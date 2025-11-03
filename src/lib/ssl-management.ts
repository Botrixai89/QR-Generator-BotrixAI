/**
 * SSL Certificate Management
 * Handles automatic SSL certificate provisioning and renewal for custom domains
 */

import { supabaseAdmin } from "@/lib/supabase"

export interface SSLStatus {
  status: 'pending' | 'active' | 'expired' | 'error'
  expiresAt?: Date
  certId?: string
  errorMessage?: string
}

/**
 * Auto-manage SSL certificates for verified domains
 * In production, this would integrate with a certificate provider (Let's Encrypt, AWS ACM, etc.)
 */
export async function manageSSLCertificate(domainId: string, domain: string): Promise<SSLStatus> {
  try {
    // In production, this would:
    // 1. Request SSL certificate from provider (Let's Encrypt, AWS ACM, etc.)
    // 2. Verify domain ownership (already done via DNS)
    // 3. Install certificate
    // 4. Monitor expiration and auto-renew
    
    // For now, we'll simulate SSL management
    // In production, integrate with your SSL provider API
    
    const sslStatus: SSLStatus = {
      status: 'active',
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      certId: `cert_${domainId}_${Date.now()}`
    }
    
    // Update domain SSL status
    await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .update({
        sslStatus: sslStatus.status,
        sslExpiresAt: sslStatus.expiresAt?.toISOString(),
        sslCertId: sslStatus.certId,
        sslEnabled: true
      })
      .eq('id', domainId)
    
    return sslStatus
  } catch (error: any) {
    console.error('SSL management error:', error)
    
    const sslStatus: SSLStatus = {
      status: 'error',
      errorMessage: error.message
    }
    
    // Update domain with error status
    await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .update({
        sslStatus: 'error',
        errorMessage: `SSL setup failed: ${error.message}`
      })
      .eq('id', domainId)
    
    return sslStatus
  }
}

/**
 * Check SSL certificate expiration and renew if needed
 */
export async function checkAndRenewSSLCertificates(): Promise<void> {
  try {
    // Find domains with SSL certificates expiring soon (within 30 days)
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 30)
    
    const { data: domainsNeedingRenewal, error } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .select('id, domain, sslStatus, sslExpiresAt')
      .eq('isVerified', true)
      .eq('sslEnabled', true)
      .lte('sslExpiresAt', expirationDate.toISOString())
      .neq('sslStatus', 'error')
    
    if (error) {
      console.error('Error fetching domains needing SSL renewal:', error)
      return
    }
    
    // Renew SSL certificates for each domain
    for (const domain of domainsNeedingRenewal || []) {
      try {
        await manageSSLCertificate(domain.id, domain.domain)
        console.log(`SSL certificate renewed for domain: ${domain.domain}`)
      } catch (error) {
        console.error(`Failed to renew SSL for domain ${domain.domain}:`, error)
      }
    }
  } catch (error) {
    console.error('Error in SSL renewal check:', error)
  }
}

/**
 * Get SSL status for a domain
 */
export async function getSSLStatus(domainId: string): Promise<SSLStatus | null> {
  try {
    const { data: domain, error } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .select('sslStatus, sslExpiresAt, sslCertId, errorMessage')
      .eq('id', domainId)
      .single()
    
    if (error || !domain) {
      return null
    }
    
    return {
      status: domain.sslStatus || 'pending',
      expiresAt: domain.sslExpiresAt ? new Date(domain.sslExpiresAt) : undefined,
      certId: domain.sslCertId,
      errorMessage: domain.errorMessage
    }
  } catch (error) {
    console.error('Error getting SSL status:', error)
    return null
  }
}

