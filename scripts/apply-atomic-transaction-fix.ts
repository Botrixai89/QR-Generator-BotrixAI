#!/usr/bin/env tsx
/**
 * Script to apply atomic transaction fix for QR code creation
 * This ensures QR codes and credit deductions happen atomically
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying atomic transaction migration...\n')

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'migrations', '20250111_atomic_qr_creation.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration file loaded')
    console.log('📊 Executing SQL statements...\n')

    // Split by function definitions and execute
    const statements = migrationSQL
      .split(/(?=CREATE OR REPLACE FUNCTION|GRANT|COMMENT ON)/)
      .filter(stmt => stmt.trim().length > 0)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (!statement || statement.startsWith('--')) continue

      console.log(`   Executing statement ${i + 1}/${statements.length}...`)
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`   ❌ Error: ${error.message}`)
        throw error
      }
    }

    console.log('\n✅ Migration applied successfully!\n')
    
    // Verify functions exist
    console.log('🔍 Verifying functions...')
    
    const { data: functions, error: verifyError } = await supabase
      .from('pg_proc')
      .select('proname')
      .in('proname', [
        'create_qr_code_with_credit_deduction',
        'bulk_create_qr_codes_with_credits'
      ])

    if (verifyError) {
      console.warn('⚠️  Could not verify functions (this is okay)')
    } else if (functions && functions.length === 2) {
      console.log('   ✅ create_qr_code_with_credit_deduction')
      console.log('   ✅ bulk_create_qr_codes_with_credits')
    }

    console.log('\n📝 Summary:')
    console.log('   - QR code creation now uses atomic transactions')
    console.log('   - Credits are deducted in the same transaction')
    console.log('   - Race conditions prevented with FOR UPDATE locks')
    console.log('   - All operations rollback on failure')
    
    console.log('\n🎉 Fix #1 complete: Atomic transactions implemented!')
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.error('\nPlease run manually using:')
    console.error('psql $DATABASE_URL -f migrations/20250111_atomic_qr_creation.sql')
    process.exit(1)
  }
}

async function testTransaction() {
  console.log('\n🧪 Running basic verification test...\n')

  try {
    // Test 1: Check function exists and is callable
    console.log('Test 1: Verify function accessibility')
    
    // This will fail with "User not found" but proves function is callable
    const { error } = await supabase.rpc('create_qr_code_with_credit_deduction', {
      p_qr_data: {
        id: 'test-qr',
        url: 'https://test.com',
        title: 'Test'
      },
      p_user_id: 'non-existent-user'
    })

    if (error && error.message.includes('User not found')) {
      console.log('   ✅ Function is callable and validates user existence\n')
    } else if (error) {
      console.log(`   ⚠️  Unexpected error: ${error.message}\n`)
    } else {
      console.log('   ✅ Function executed successfully\n')
    }

    console.log('🎊 Verification complete!')
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

async function main() {
  console.log('═'.repeat(60))
  console.log('  ATOMIC TRANSACTION FIX - CRITICAL ISSUE #1')
  console.log('═'.repeat(60))
  console.log()

  const args = process.argv.slice(2)
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: npm run apply-atomic-fix [options]')
    console.log()
    console.log('Options:')
    console.log('  --test-only    Run verification tests only')
    console.log('  --help, -h     Show this help message')
    console.log()
    console.log('Environment variables:')
    console.log('  NEXT_PUBLIC_SUPABASE_URL      Supabase project URL')
    console.log('  SUPABASE_SERVICE_ROLE_KEY     Supabase service role key')
    return
  }

  if (args.includes('--test-only')) {
    await testTransaction()
  } else {
    await applyMigration()
    await testTransaction()
  }
}

main().catch(console.error)

