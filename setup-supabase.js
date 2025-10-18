#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Supabase Setup Script\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create .env.local with your Supabase credentials first.');
  console.log('\nExample .env.local content:');
  console.log(`
DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
  `);
  process.exit(1);
}

console.log('✅ .env.local file found');

// Read the .env.local file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check if required variables are present
const requiredVars = [
  'DATABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL', 
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

let missingVars = [];
requiredVars.forEach(varName => {
  if (!envContent.includes(varName)) {
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease add these to your .env.local file.');
  process.exit(1);
}

console.log('✅ All required environment variables found');

// Test database connection
console.log('\n🔗 Testing database connection...');
try {
  execSync('npx prisma db push', { stdio: 'pipe' });
  console.log('✅ Database connection successful!');
  console.log('✅ Database schema pushed to Supabase');
} catch (error) {
  console.log('❌ Database connection failed:');
  console.log('Error:', error.message);
  console.log('\nPlease check your DATABASE_URL in .env.local');
  process.exit(1);
}

// Generate Prisma client
console.log('\n🔧 Generating Prisma client...');
try {
  execSync('npx prisma generate', { stdio: 'pipe' });
  console.log('✅ Prisma client generated successfully');
} catch (error) {
  console.log('❌ Failed to generate Prisma client:');
  console.log('Error:', error.message);
  process.exit(1);
}

console.log('\n🎉 Supabase setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Run "npm run dev" to start the development server');
console.log('   2. Test user registration and QR code generation');
console.log('   3. Check that data is being saved to Supabase');
console.log('   4. Verify dashboard functionality');

console.log('\n🔍 To verify your setup:');
console.log('   - Go to your Supabase dashboard');
console.log('   - Check the "Table Editor" to see your tables');
console.log('   - Look for "User" and "QrCode" tables');
