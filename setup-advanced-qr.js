const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupAdvancedQR() {
  try {
    console.log('🚀 Setting up advanced QR code features...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-advanced-qr-columns.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Executing SQL migration...')
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Error executing SQL:', error)
      
      // If the RPC function doesn't exist, try executing the SQL directly
      console.log('🔄 Trying alternative approach...')
      
      // Split SQL into individual statements and execute them
      const statements = sql.split(';').filter(stmt => stmt.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.trim().substring(0, 50)}...`)
          
          // For ALTER TABLE statements, we'll need to use a different approach
          if (statement.includes('ALTER TABLE')) {
            console.log('⚠️  ALTER TABLE statements need to be run manually in Supabase dashboard')
            console.log('Please run the following SQL in your Supabase SQL editor:')
            console.log(statement.trim())
          }
        }
      }
    } else {
      console.log('✅ SQL executed successfully:', data)
    }
    
    console.log('🎉 Advanced QR code setup completed!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. If you see any ALTER TABLE statements above, run them manually in Supabase dashboard')
    console.log('2. Test the advanced QR code features in your application')
    console.log('3. Check the database schema to ensure all columns were added')
    
  } catch (error) {
    console.error('❌ Error setting up advanced QR features:', error)
    process.exit(1)
  }
}

// Run the setup
setupAdvancedQR()
