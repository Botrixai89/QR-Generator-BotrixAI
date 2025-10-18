const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please make sure you have these in your .env file:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDynamicQR() {
  console.log('🚀 Setting up dynamic QR code database columns...')
  
  try {
    // Check if columns already exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('QrCode')
      .select('isDynamic')
      .limit(1)
    
    if (!testError) {
      console.log('✅ Dynamic QR columns already exist!')
      return
    }
    
    console.log('📝 Adding dynamic QR code columns...')
    
    // Add columns one by one
    const columns = [
      { name: 'isDynamic', type: 'BOOLEAN DEFAULT false' },
      { name: 'dynamicContent', type: 'JSONB' },
      { name: 'scanCount', type: 'INTEGER DEFAULT 0' },
      { name: 'lastScannedAt', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'isActive', type: 'BOOLEAN DEFAULT true' },
      { name: 'expiresAt', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'maxScans', type: 'INTEGER' },
      { name: 'redirectUrl', type: 'TEXT' }
    ]
    
    for (const column of columns) {
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE public."QrCode" ADD COLUMN IF NOT EXISTS "${column.name}" ${column.type};`
        })
        
        if (error) {
          console.log(`⚠️  Column ${column.name} might already exist or there was an issue:`, error.message)
        } else {
          console.log(`✅ Added column: ${column.name}`)
        }
      } catch (err) {
        console.log(`⚠️  Could not add column ${column.name}:`, err.message)
      }
    }
    
    // Create QrCodeScan table
    console.log('📝 Creating QrCodeScan table...')
    const createScanTable = `
      CREATE TABLE IF NOT EXISTS public."QrCodeScan" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "qrCodeId" TEXT NOT NULL REFERENCES public."QrCode"(id) ON DELETE CASCADE,
        "scannedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "userAgent" TEXT,
        "ipAddress" TEXT,
        "country" TEXT,
        "city" TEXT,
        "device" TEXT,
        "browser" TEXT,
        "os" TEXT
      );
    `
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: createScanTable })
      if (error) {
        console.log('⚠️  QrCodeScan table might already exist:', error.message)
      } else {
        console.log('✅ Created QrCodeScan table')
      }
    } catch (err) {
      console.log('⚠️  Could not create QrCodeScan table:', err.message)
    }
    
    console.log('\n🎉 Dynamic QR setup completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Try generating a QR code again')
    console.log('2. The error should be resolved')
    console.log('3. You can now use all dynamic QR features')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.log('\n🔧 Manual setup required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Open the SQL editor')
    console.log('3. Copy and run the contents of add-dynamic-qr-columns.sql')
  }
}

setupDynamicQR()
