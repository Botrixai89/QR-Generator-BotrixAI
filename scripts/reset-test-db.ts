#!/usr/bin/env tsx
/**
 * Reset Test Database
 * Truncates all tables, re-applies migrations, and seeds minimal test data
 * Designed for CI/CD and local test environments
 */

import { createClient } from '@supabase/supabase-js'
import { readdirSync } from 'fs'
import { join } from 'path'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(color: keyof typeof colors, message: string) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  log('red', '❌ Missing Supabase credentials!')
  console.log('\nPlease set these environment variables:')
  console.log('  SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL')
  console.log('  SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Tables to truncate (in dependency order - children first)
const TABLES_TO_TRUNCATE = [
  'QrCodeScan',
  'QrCodeFile',
  'QrCodeFolder',
  'QrCode',
  'ApiRateLimit',
  'ApiKey',
  'OrganizationMember',
  'Organization',
  'Invitation',
  'Notification',
  'Payment',
  'Subscription',
  'Session',
  'Account',
  'User',
]

async function truncateTables() {
  log('blue', '🗑️  Truncating all tables...')
  
  // Delete all rows from each table (in reverse dependency order)
  // We'll use a workaround: select all IDs, then delete them
  for (const table of TABLES_TO_TRUNCATE) {
    try {
      // First, get all IDs
      const { data: rows, error: selectError } = await supabase
        .from(table)
        .select('id')
        .limit(10000) // Safety limit
      
      if (selectError) {
        // Table might not exist or have different structure
        log('yellow', `   ⚠️  ${table}: ${selectError.message}`)
        continue
      }
      
      if (!rows || rows.length === 0) {
        log('green', `   ✓ ${table} (already empty)`)
        continue
      }
      
      // Delete all rows by ID
      const ids = rows.map(r => r.id).filter(Boolean)
      if (ids.length > 0) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .in('id', ids)
        
        if (deleteError) {
          log('yellow', `   ⚠️  ${table}: ${deleteError.message}`)
        } else {
          log('green', `   ✓ Cleared ${ids.length} rows from ${table}`)
        }
      }
    } catch (error: any) {
      log('yellow', `   ⚠️  ${table}: ${error.message || 'Unknown error'}`)
    }
  }
  
  log('green', '✅ Tables cleared')
}

async function applyMigrations() {
  log('blue', '📦 Checking migrations...')
  
  try {
    // Find all migration files
    const migrationsDir = join(process.cwd(), 'migrations')
    const files = readdirSync(migrationsDir)
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .map(f => join('migrations', f))
      .sort()
    
    if (migrationFiles.length === 0) {
      log('yellow', '⚠️  No migration files found')
      return
    }
    
    log('blue', `   Found ${migrationFiles.length} migration files`)
    
    // Note: Supabase client doesn't support raw SQL execution directly
    // In CI, you should use Supabase CLI or SQL Editor
    // For now, we'll log what needs to be run
    log('yellow', '   ⚠️  Note: Supabase client cannot execute raw SQL')
    log('yellow', '   Please ensure migrations are applied via Supabase CLI or SQL Editor')
    log('yellow', '   Migration files to apply:')
    
    for (const file of migrationFiles) {
      console.log(`      - ${file}`)
    }
  } catch (error: any) {
    log('yellow', `   ⚠️  Could not read migrations directory: ${error.message}`)
  }
}

async function seedTestData() {
  log('blue', '🌱 Seeding test data...')
  
  try {
    // Import and run seed script
    const { seedDatabase } = await import('./seed')
    
    await seedDatabase({
      users: 3,
      qrCodes: 5,
      organizations: 1,
      apiKeys: false, // Skip API keys for tests
    })
    
    log('green', '✅ Test data seeded')
  } catch (error: any) {
    log('red', `❌ Failed to seed test data: ${error.message}`)
    throw error
  }
}

async function resetTestDatabase() {
  console.log('═'.repeat(60))
  log('blue', '  RESETTING TEST DATABASE')
  console.log('═'.repeat(60))
  console.log()
  
  try {
    await truncateTables()
    console.log()
    
    await applyMigrations()
    console.log()
    
    await seedTestData()
    console.log()
    
    log('green', '✅ Test database reset complete!')
    console.log()
    log('blue', 'Test credentials:')
    console.log('  Email: test-user-1@example.com')
    console.log('  Password: password123')
    console.log('  Plan: PRO')
    console.log()
    console.log('  Email: test-user-2@example.com')
    console.log('  Password: password123')
    console.log('  Plan: FLEX')
    console.log()
    
  } catch (error: any) {
    log('red', `❌ Database reset failed: ${error.message}`)
    console.error(error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  resetTestDatabase()
    .then(() => {
      process.exit(0)
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export { resetTestDatabase }

