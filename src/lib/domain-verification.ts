/**
 * Domain Verification Utilities
 * Handles DNS verification with retry logic and improved error handling
 */

import dns from 'dns/promises'

export interface VerificationResult {
  verified: boolean
  error?: string
  lastChecked?: Date
}

/**
 * Verify domain ownership by checking DNS TXT records
 * Supports retry logic and better error handling
 */
export async function verifyDomainOwnership(
  domain: string,
  verificationToken: string,
  maxRetries: number = 3,
  retryDelay: number = 5000
): Promise<VerificationResult> {
  const expectedValue = `${verificationToken}.${domain}`
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Resolve TXT records for the domain
      const txtRecords = await dns.resolveTxt(domain)
      
      // Look for our verification record
      for (const record of txtRecords) {
        // TXT records can be arrays of strings, flatten if needed
        const recordString = Array.isArray(record) ? record.join('') : record
        
        if (recordString.includes(expectedValue)) {
          return {
            verified: true,
            lastChecked: new Date()
          }
        }
      }
      
      // If we've exhausted retries, return failure
      if (attempt === maxRetries) {
        return {
          verified: false,
          error: `Verification record not found after ${maxRetries} attempts`,
          lastChecked: new Date()
        }
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    } catch (error: any) {
      // Handle DNS resolution errors
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        if (attempt === maxRetries) {
          return {
            verified: false,
            error: `Domain ${domain} does not exist or has no DNS records`,
            lastChecked: new Date()
          }
        }
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        if (attempt === maxRetries) {
          return {
            verified: false,
            error: `DNS lookup timeout for ${domain}. Please check your DNS settings.`,
            lastChecked: new Date()
          }
        }
      } else {
        // Unexpected error
        console.error('DNS verification error:', error)
        if (attempt === maxRetries) {
          return {
            verified: false,
            error: `DNS verification failed: ${error.message}`,
            lastChecked: new Date()
          }
        }
      }
      
      // Wait before retrying on error
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }
  }
  
  return {
    verified: false,
    error: 'Verification failed after all retry attempts',
    lastChecked: new Date()
  }
}

/**
 * Check if a domain's DNS records are properly configured
 */
export async function checkDomainDnsConfiguration(domain: string): Promise<{
  hasRecords: boolean
  records: string[]
  error?: string
}> {
  try {
    const txtRecords = await dns.resolveTxt(domain)
    const flattenedRecords = txtRecords.flat()
    
    return {
      hasRecords: flattenedRecords.length > 0,
      records: flattenedRecords
    }
  } catch (error: any) {
    return {
      hasRecords: false,
      records: [],
      error: error.message
    }
  }
}

