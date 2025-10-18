#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 QR Generator - Comprehensive Test Suite\n');

// Test 1: Check if all required files exist
console.log('1️⃣ Checking required files...');
const requiredFiles = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'prisma/schema.prisma',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/components/qr-generator.tsx',
  'src/lib/auth.ts',
  'src/lib/prisma.ts',
  'src/middleware.ts'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Test 2: Check package.json dependencies
console.log('\n2️⃣ Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'next',
  'react',
  'react-dom',
  'typescript',
  'tailwindcss',
  'next-auth',
  'prisma',
  '@prisma/client',
  'qr-code-styling',
  'bcryptjs'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`   ✅ ${dep}`);
  } else {
    console.log(`   ❌ ${dep} - MISSING`);
  }
});

// Test 3: Check TypeScript compilation
console.log('\n3️⃣ Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('   ✅ TypeScript compilation successful');
} catch (error) {
  console.log('   ❌ TypeScript compilation failed');
  console.log('   Error:', error.message);
}

// Test 4: Check Prisma schema
console.log('\n4️⃣ Checking Prisma schema...');
try {
  execSync('npx prisma validate', { stdio: 'pipe' });
  console.log('   ✅ Prisma schema is valid');
} catch (error) {
  console.log('   ❌ Prisma schema validation failed');
  console.log('   Error:', error.message);
}

// Test 5: Check if database exists
console.log('\n5️⃣ Checking database...');
if (fs.existsSync('prisma/dev.db')) {
  console.log('   ✅ Database file exists');
} else {
  console.log('   ⚠️  Database file not found - run "npx prisma db push" to create it');
}

// Test 6: Check environment setup
console.log('\n6️⃣ Checking environment setup...');
if (fs.existsSync('.env.local')) {
  console.log('   ✅ .env.local file exists');
} else {
  console.log('   ⚠️  .env.local file not found - copy from env.example and configure');
}

// Test 7: Check build process
console.log('\n7️⃣ Testing build process...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('   ✅ Build successful');
} catch (error) {
  console.log('   ❌ Build failed');
  console.log('   Error:', error.message);
}

console.log('\n🎉 Test suite completed!');
console.log('\n📋 Next steps:');
console.log('   1. Run "npm run dev" to start the development server');
console.log('   2. Visit http://localhost:3000 to test the application');
console.log('   3. Test user registration and QR code generation');
console.log('   4. Check dashboard functionality');
console.log('   5. Test dark mode toggle');
console.log('   6. Verify responsive design on different screen sizes');

console.log('\n🚀 Ready for deployment!');
console.log('   - See DEPLOYMENT.md for deployment instructions');
console.log('   - Configure environment variables for production');
console.log('   - Set up a production database');
console.log('   - Deploy to Vercel, Railway, or your preferred platform');
