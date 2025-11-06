import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * Payment Configuration Verification Endpoint
 * Checks if all payment-related configurations are properly set up
 */
export async function GET() {
  try {
    const checks: Record<string, { status: 'ok' | 'error' | 'warning', message: string }> = {}

    // 1. Check Razorpay Environment Variables
    checks.razorpayKeyId = process.env.RAZORPAY_KEY_ID
      ? { status: 'ok', message: 'RAZORPAY_KEY_ID is set' }
      : { status: 'error', message: 'RAZORPAY_KEY_ID is missing' }

    checks.razorpayPublicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      ? { status: 'ok', message: 'NEXT_PUBLIC_RAZORPAY_KEY_ID is set' }
      : { status: 'error', message: 'NEXT_PUBLIC_RAZORPAY_KEY_ID is missing' }

    checks.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET
      ? { status: 'ok', message: 'RAZORPAY_KEY_SECRET is set' }
      : { status: 'error', message: 'RAZORPAY_KEY_SECRET is missing' }

    checks.razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
      ? { status: 'ok', message: 'RAZORPAY_WEBHOOK_SECRET is set' }
      : { status: 'warning', message: 'RAZORPAY_WEBHOOK_SECRET is missing (optional but recommended)' }

    // 2. Check if payments table exists
    if (supabaseAdmin) {
      try {
        const { error: tableError } = await supabaseAdmin
          .from('payments')
          .select('id')
          .limit(1)

        if (tableError && tableError.code === 'PGRST116') {
          checks.paymentsTable = {
            status: 'error',
            message: 'Payments table does not exist. Run the database migration.'
          }
        } else if (tableError) {
          checks.paymentsTable = {
            status: 'warning',
            message: `Payments table check failed: ${tableError.message}`
          }
        } else {
          checks.paymentsTable = {
            status: 'ok',
            message: 'Payments table exists'
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        checks.paymentsTable = {
          status: 'error',
          message: `Error checking payments table: ${message}`
        }
      }

      // 3. Check if User table has credits and plan columns
      try {
        const { error: userError } = await supabaseAdmin
          .from('User')
          .select('credits, plan')
          .limit(1)
          .single()

        if (userError && userError.code === 'PGRST116') {
          checks.userTableColumns = {
            status: 'error',
            message: 'User table does not exist'
          }
        } else if (userError && userError.message.includes('column')) {
          checks.userTableColumns = {
            status: 'error',
            message: 'User table missing credits or plan columns. Run the database migration.'
          }
        } else {
          checks.userTableColumns = {
            status: 'ok',
            message: 'User table has credits and plan columns'
          }
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        checks.userTableColumns = {
          status: 'warning',
          message: `Could not verify User table columns: ${message}`
        }
      }
    } else {
      checks.supabaseConnection = {
        status: 'error',
        message: 'Supabase admin client not initialized'
      }
    }

    // 4. Check Razorpay package
    try {
      await import("razorpay")
      checks.razorpayPackage = {
        status: 'ok',
        message: 'Razorpay package is installed'
      }
    } catch {
      checks.razorpayPackage = {
        status: 'error',
        message: 'Razorpay package is not installed. Run: npm install razorpay'
      }
    }

    // Calculate overall status
    const hasErrors = Object.values(checks).some(check => check.status === 'error')
    const hasWarnings = Object.values(checks).some(check => check.status === 'warning')
    const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok'

    return NextResponse.json({
      status: overallStatus,
      checks,
      summary: {
        total: Object.keys(checks).length,
        ok: Object.values(checks).filter(c => c.status === 'ok').length,
        warnings: Object.values(checks).filter(c => c.status === 'warning').length,
        errors: Object.values(checks).filter(c => c.status === 'error').length,
      },
      message: hasErrors
        ? 'Configuration has errors. Please fix them before using payments.'
        : hasWarnings
        ? 'Configuration has warnings. Payments should work, but consider fixing them.'
        : 'All payment configurations are correct!'
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to verify configuration',
        message
      },
      { status: 500 }
    )
  }
}

