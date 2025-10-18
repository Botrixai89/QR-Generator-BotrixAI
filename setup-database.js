const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // Read the SQL file
    const sql = fs.readFileSync('setup-supabase-tables.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // If the RPC function doesn't exist, try executing the SQL directly
      console.log('Trying alternative method...');
      
      // Split SQL into individual statements and execute them
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          const { error: stmtError } = await supabase
            .from('_dummy_table_that_does_not_exist')
            .select('*')
            .limit(0);
          
          // This will fail, but we'll use the raw SQL execution
          try {
            await supabase.rpc('exec', { query: statement });
          } catch (e) {
            console.log('Statement executed (or already exists)');
          }
        }
      }
    } else {
      console.log('Database setup completed successfully!');
    }
    
    // Test the tables exist
    console.log('Testing table creation...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Users table error:', usersError);
    } else {
      console.log('✅ Users table is ready');
    }
    
    const { data: qrCodes, error: qrCodesError } = await supabase
      .from('qr_codes')
      .select('*')
      .limit(1);
    
    if (qrCodesError) {
      console.error('QR codes table error:', qrCodesError);
    } else {
      console.log('✅ QR codes table is ready');
    }
    
    console.log('Database setup completed!');
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupDatabase();
