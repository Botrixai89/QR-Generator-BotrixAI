const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  console.log('Make sure you have:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Running database migration for dynamic QR codes...')
  
  try {
    // Read the migration SQL
    const fs = require('fs')
    const migrationSQL = fs.readFileSync('add-dynamic-qr-columns.sql', 'utf8')
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n${i + 1}. Executing: ${statement.substring(0, 100)}...`)
      
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement })
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error)
        // Continue with other statements
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`)
      }
    }
    
    console.log('\n🎉 Migration completed!')
    console.log('\nNext steps:')
    console.log('1. Try generating a QR code again')
    console.log('2. Check the dashboard for your QR codes')
    console.log('3. Test dynamic features at /test-dynamic')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('\nAlternative: Run the SQL manually in your Supabase dashboard')
    console.log('Copy the contents of add-dynamic-qr-columns.sql and run it in the SQL editor')
  }
}

runMigration()
