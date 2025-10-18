import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import crypto from 'crypto'

// Custom domains management
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { domain, action } = body

    if (!domain || !action) {
      return NextResponse.json(
        { error: "Domain and action are required" },
        { status: 400 }
      )
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 }
      )
    }

    switch (action) {
      case 'add':
        return await addCustomDomain(domain, session.user.id)
      case 'verify':
        return await verifyCustomDomain(domain, session.user.id)
      case 'remove':
        return await removeCustomDomain(domain, session.user.id)
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error managing custom domain:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get custom domains
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { data: customDomains, error } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error("Error fetching custom domains:", error)
      return NextResponse.json(
        { error: "Failed to fetch custom domains" },
        { status: 500 }
      )
    }

    return NextResponse.json(customDomains)
  } catch (error) {
    console.error("Error fetching custom domains:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Add custom domain
async function addCustomDomain(domain: string, userId: string) {
  // Check if domain already exists
  const { data: existingDomain, error: checkError } = await supabaseAdmin!
    .from('QrCodeCustomDomain')
    .select('*')
    .eq('domain', domain)
    .single()

  if (existingDomain) {
    if (existingDomain.userId === userId) {
      return NextResponse.json(
        { error: "Domain already exists in your account" },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { error: "Domain is already in use by another user" },
        { status: 400 }
      )
    }
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex')
  const verificationRecord = `${verificationToken}.${domain}`

  // Add domain to database
  const { data: customDomain, error } = await supabaseAdmin!
    .from('QrCodeCustomDomain')
    .insert({
      userId,
      domain,
      verificationToken,
      isVerified: false
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding custom domain:", error)
    return NextResponse.json(
      { error: "Failed to add custom domain" },
      { status: 500 }
    )
  }

  // Return verification instructions
  return NextResponse.json({
    success: true,
    customDomain,
    verificationInstructions: {
      recordType: 'TXT',
      recordName: domain,
      recordValue: verificationRecord,
      instructions: `Add a TXT record with name "${domain}" and value "${verificationRecord}" to verify domain ownership.`
    }
  })
}

// Verify custom domain
async function verifyCustomDomain(domain: string, userId: string) {
  // Get domain record
  const { data: customDomain, error: fetchError } = await supabaseAdmin!
    .from('QrCodeCustomDomain')
    .select('*')
    .eq('domain', domain)
    .eq('userId', userId)
    .single()

  if (fetchError || !customDomain) {
    return NextResponse.json(
      { error: "Domain not found" },
      { status: 404 }
    )
  }

  if (customDomain.isVerified) {
    return NextResponse.json({
      success: true,
      message: "Domain is already verified",
      customDomain
    })
  }

  // Verify domain ownership by checking DNS record
  const isVerified = await verifyDomainOwnership(domain, customDomain.verificationToken)

  if (isVerified) {
    // Update domain as verified
    const { data: updatedDomain, error: updateError } = await supabaseAdmin!
      .from('QrCodeCustomDomain')
      .update({
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        sslEnabled: true // Auto-enable SSL for verified domains
      })
      .eq('id', customDomain.id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating domain verification:", updateError)
      return NextResponse.json(
        { error: "Failed to update domain verification" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Domain verified successfully",
      customDomain: updatedDomain
    })
  } else {
    return NextResponse.json(
      { error: "Domain verification failed. Please ensure the TXT record is properly configured." },
      { status: 400 }
    )
  }
}

// Remove custom domain
async function removeCustomDomain(domain: string, userId: string) {
  // Check if domain is being used by any QR codes
  const { data: qrCodesUsingDomain, error: checkError } = await supabaseAdmin!
    .from('QrCode')
    .select('id, title')
    .eq('customDomain', domain)
    .eq('userId', userId)

  if (qrCodesUsingDomain && qrCodesUsingDomain.length > 0) {
    return NextResponse.json(
      { 
        error: "Cannot remove domain. It is currently being used by QR codes.",
        qrCodesUsingDomain
      },
      { status: 400 }
    )
  }

  // Remove domain
  const { error } = await supabaseAdmin!
    .from('QrCodeCustomDomain')
    .delete()
    .eq('domain', domain)
    .eq('userId', userId)

  if (error) {
    console.error("Error removing custom domain:", error)
    return NextResponse.json(
      { error: "Failed to remove custom domain" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    message: "Domain removed successfully"
  })
}

// Verify domain ownership by checking DNS record
async function verifyDomainOwnership(domain: string, verificationToken: string): Promise<boolean> {
  try {
    const dns = require('dns').promises
    const expectedValue = `${verificationToken}.${domain}`
    
    // Check TXT records for the domain
    const txtRecords = await dns.resolveTxt(domain)
    
    // Look for our verification record
    for (const record of txtRecords) {
      if (record.includes(expectedValue)) {
        return true
      }
    }
    
    return false
  } catch (error) {
    console.error('DNS verification error:', error)
    return false
  }
}
