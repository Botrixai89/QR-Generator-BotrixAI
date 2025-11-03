/**
 * Domain Routing Utilities
 * Handles routing for custom domains and vanity URLs
 */

import { getSupabaseAdmin } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import { getErrorPage } from "@/lib/error-pages"

export interface RoutingConfig {
  defaultRedirect?: string
  custom404Page?: string
  customExpiryPage?: string
  allowedPaths?: string[]
  blockedPaths?: string[]
}

/**
 * Get routing configuration for a domain
 */
export async function getDomainRoutingConfig(domain: string): Promise<RoutingConfig | null> {
  try {
    const admin = getSupabaseAdmin()
    if (!admin) return null
    const { data: customDomain, error } = await admin
      .from('QrCodeCustomDomain')
      .select('routingConfig, custom404Page, customExpiryPage')
      .eq('domain', domain)
      .eq('isVerified', true)
      .eq('status', 'active')
      .single()
    
    if (error || !customDomain) {
      return null
    }
    
    return {
      defaultRedirect: customDomain.routingConfig?.defaultRedirect,
      custom404Page: customDomain.custom404Page || customDomain.routingConfig?.custom404Page,
      customExpiryPage: customDomain.customExpiryPage || customDomain.routingConfig?.customExpiryPage,
      allowedPaths: customDomain.routingConfig?.allowedPaths,
      blockedPaths: customDomain.routingConfig?.blockedPaths
    }
  } catch (error) {
    console.error('Error getting domain routing config:', error)
    return null
  }
}

/**
 * Resolve vanity URL to QR code
 */
export async function resolveVanityUrl(
  vanityUrl: string,
  domainId?: string
): Promise<{ qrCodeId: string; domainId?: string } | null> {
  try {
    const admin = getSupabaseAdmin()
    if (!admin) return null
    const baseQuery = admin
      .from('QrCodeVanityUrl')
      .select('qrCodeId, domainId')
      .eq('vanityUrl', vanityUrl.toLowerCase())

    const { data: vanityMapping, error } = await (domainId
      ? baseQuery.eq('domainId', domainId)
      : baseQuery
    ).single()
    
    if (error || !vanityMapping) {
      return null
    }
    
    return {
      qrCodeId: vanityMapping.qrCodeId,
      domainId: vanityMapping.domainId
    }
  } catch (error) {
    console.error('Error resolving vanity URL:', error)
    return null
  }
}

/**
 * Get QR code by custom slug
 */
export async function getQrCodeBySlug(
  slug: string,
  domainId?: string
): Promise<{ qrCodeId: string } | null> {
  try {
    const admin = getSupabaseAdmin()
    if (!admin) return null
    const baseQuery2 = admin
      .from('QrCodeVanityUrl')
      .select('qrCodeId, domainId')
      .eq('customSlug', slug.toLowerCase())

    const { data: mapping, error } = await (domainId
      ? baseQuery2.eq('domainId', domainId)
      : baseQuery2
    ).single()
    
    if (error || !mapping) {
      return null
    }
    
    return {
      qrCodeId: mapping.qrCodeId
    }
  } catch (error) {
    console.error('Error getting QR code by slug:', error)
    return null
  }
}

/**
 * Check if a vanity URL or slug is available
 */
export async function checkVanityUrlAvailability(
  vanityUrl: string,
  qrCodeId?: string,
  domainId?: string
): Promise<{ available: boolean; conflict?: string }> {
  try {
    const admin = getSupabaseAdmin()
    if (!admin) return { available: false, conflict: 'Supabase not configured' }
    let query = admin
      .from('QrCodeVanityUrl')
      .select('qrCodeId, vanityUrl, customSlug')
      .or(`vanityUrl.eq.${vanityUrl.toLowerCase()},customSlug.eq.${vanityUrl.toLowerCase()}`)
    
    if (qrCodeId) {
      query = query.neq('qrCodeId', qrCodeId)
    }
    
    if (domainId) {
      query = query.eq('domainId', domainId)
    }
    
    const { data: conflicts, error } = await query
    
    if (error) {
      return { available: false, conflict: 'Database error' }
    }
    
    if (conflicts && conflicts.length > 0) {
      return {
        available: false,
        conflict: `Vanity URL "${vanityUrl}" is already in use`
      }
    }
    
    return { available: true }
  } catch (error) {
    console.error('Error checking vanity URL availability:', error)
    return { available: false, conflict: 'Error checking availability' }
  }
}

/**
 * Handle custom domain routing
 * This is called by middleware to route requests from custom domains
 */
export async function handleCustomDomainRequest(
  request: NextRequest,
  domain: string,
  pathname: string
): Promise<NextResponse | null> {
  try {
    // Get domain configuration
    const admin = getSupabaseAdmin()
    if (!admin) return null
    const { data: customDomain, error: domainError } = await admin
      .from('QrCodeCustomDomain')
      .select('id, routingConfig, custom404Page, customExpiryPage, status')
      .eq('domain', domain)
      .eq('isVerified', true)
      .single()
    
    if (domainError || !customDomain || customDomain.status !== 'active') {
      return null // Domain not found or not active
    }
    
    // If root path, check for default redirect
    if (pathname === '/') {
      const routingConfig = customDomain.routingConfig as RoutingConfig | null
      if (routingConfig?.defaultRedirect) {
        return NextResponse.redirect(routingConfig.defaultRedirect)
      }
      // Return custom 404 if no default redirect
      const notFoundPage = await getErrorPage('404', {
        domainId: customDomain.id,
        title: 'Page Not Found',
        message: 'No default page configured for this domain.'
      })
      
      return new NextResponse(notFoundPage, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      })
    }
    
    // Extract slug/vanity URL from pathname (remove leading slash)
    const slug = pathname.slice(1)
    
    // Try to resolve as vanity URL first
    const vanityMapping = await resolveVanityUrl(slug, customDomain.id)
    if (vanityMapping) {
      // Redirect to QR code scan endpoint
      const baseUrl = request.nextUrl.origin
      return NextResponse.redirect(`${baseUrl}/qr/${vanityMapping.qrCodeId}`)
    }
    
    // Try to resolve as custom slug
    const slugMapping = await getQrCodeBySlug(slug, customDomain.id)
    if (slugMapping) {
      // Redirect to QR code scan endpoint
      const baseUrl = request.nextUrl.origin
      return NextResponse.redirect(`${baseUrl}/qr/${slugMapping.qrCodeId}`)
    }
    
    // Not found - return custom 404 if available
    const notFoundPage = await getErrorPage('404', {
      domainId: customDomain.id,
      title: 'Page Not Found',
      message: 'The requested page or QR code could not be found on this domain.'
    })
    
    return new NextResponse(notFoundPage, {
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Error handling custom domain request:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

