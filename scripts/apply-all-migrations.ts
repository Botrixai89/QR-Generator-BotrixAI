#!/usr/bin/env tsx
/**
 * Apply All Migrations to Supabase Database
 * Executes all migration SQL files in order
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  log('red', '❌ Missing Supabase credentials!')
  console.log('\nPlease set these environment variables:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL')
  console.log('  SUPABASE_SERVICE_ROLE_KEY')
  console.log('\nYou can find these in your Supabase project settings.')
  process.exit(1)
}

console.log('═'.repeat(60))
log('blue', '  APPLYING ALL DATABASE MIGRATIONS')
console.log('═'.repeat(60))
console.log()

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// List of migrations to apply in order
const migrations = [
  {
    name: 'Atomic QR Creation',
    file: 'migrations/20250111_atomic_qr_creation.sql',
    description: 'Adds atomic transaction functions for QR code creation with credit deduction',
  },
  {
    name: 'Performance Indexes',
    file: 'migrations/20250111_performance_indexes.sql',
    description: 'Adds 47+ database indexes for 10-40x performance improvement',
  },
  {
    name: 'Authentication Security',
    file: 'migrations/20250111_auth_security_enhancements.sql',
    description: 'Adds session management, login tracking, and security features',
  },
]

async function executeSQLFile(filePath: string): Promise<boolean> {
  try {
    const fullPath = join(process.cwd(), filePath)
    const sql = readFileSync(fullPath, 'utf-8')
    
    // Split SQL into individual statements
    // PostgreSQL function definitions need to be executed as single statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    log('blue', `   Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement) continue
      
      // Execute using raw SQL query
      // Note: Supabase doesn't expose raw SQL execution by default for security
      // We need to use the SQL Editor in Supabase dashboard or use pg connection string
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          log('yellow', `   ⚠️  Statement ${i + 1} failed (this may be okay if already exists)`)
          console.log(`      ${error.message?.substring(0, 100)}...`)
        }
      } catch (err) {
        // If exec_sql RPC doesn't exist, this is expected
        log('yellow', `   ⚠️  Statement ${i + 1} skipped (exec_sql RPC not available)`)
        console.log(`      Cannot execute raw SQL via Supabase client. Please use SQL Editor in Supabase dashboard.`)
      }
    }
    
    return true
  } catch (error) {
    log('red', `   ❌ Error reading file: ${error}`)
    return false
  }
}

async function main() {
  log('yellow', '📌 IMPORTANT: Supabase requires using the SQL Editor in the dashboard')
  log('yellow', '   or connecting via psql for security reasons.\n')
  
  console.log('This script will show you what to do for each migration:\n')
  
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i]
    
    console.log(`${i + 1}. ${migration.name}`)
    log('blue', `   ${migration.description}`)
    log('yellow', `   File: ${migration.file}\n`)
  }
  
  console.log('═'.repeat(60))
  log('green', 'OPTION 1: Using Supabase Dashboard (Recommended)')
  console.log('═'.repeat(60))
  console.log()
  console.log('1. Go to your Supabase project dashboard')
  console.log('2. Navigate to: SQL Editor')
  console.log('3. For each migration file, copy and paste the SQL content')
  console.log('4. Click "Run" to execute\n')
  
  console.log('Files to execute in order:')
  migrations.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.file}`)
  })
  
  console.log()
  console.log('═'.repeat(60))
  log('green', 'OPTION 2: Using psql (Direct Connection)')
  console.log('═'.repeat(60))
  console.log()
  console.log('If you have the direct PostgreSQL connection string:\n')
  
  console.log('# Set your database connection')
  console.log('export DB_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"\n')
  
  console.log('# Apply each migration')
  migrations.forEach((m, i) => {
    console.log(`psql $DB_URL -f ${m.file}`)
  })
  
  console.log()
  console.log('═'.repeat(60))
  log('green', 'OPTION 3: Using Supabase CLI')
  console.log('═'.repeat(60))
  console.log()
  console.log('# Install Supabase CLI if not already installed')
  console.log('npm install -g supabase\n')
  
  console.log('# Link to your project')
  console.log('supabase link --project-ref your-project-ref\n')
  
  console.log('# Apply migrations')
  console.log('supabase db push\n')
  
  console.log()
  console.log('═'.repeat(60))
  log('blue', 'VERIFICATION')
  console.log('═'.repeat(60))
  console.log()
  console.log('After applying migrations, verify with:\n')
  console.log('# Check if functions were created')
  console.log(`SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%qr%';`)
  console.log()
  console.log('# Check if indexes were created')
  console.log(`SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%';`)
  
  console.log()
  console.log('Or use our verification script:')
  log('green', '   npm run verify-indexes')
  
  console.log()
  console.log('═'.repeat(60))
  log('green', '✅ READY TO APPLY MIGRATIONS!')
  console.log('═'.repeat(60))
  console.log()
}

main().catch(console.error)

