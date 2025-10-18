const fs = require('fs');
const path = require('path');

// Create .env.local file with default values
const envContent = `# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-this-in-production"

# OAuth Providers (optional - for social login)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
`;

const envPath = path.join(__dirname, '.env.local');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file with default values');
  console.log('⚠️  Please update NEXTAUTH_SECRET with a secure random string');
} else {
  console.log('ℹ️  .env.local already exists, skipping creation');
}

console.log('\n🚀 Setup complete! You can now run:');
console.log('   npm run dev');
console.log('\n📝 Next steps:');
console.log('   1. Update NEXTAUTH_SECRET in .env.local');
console.log('   2. Optionally configure OAuth providers');
console.log('   3. Visit http://localhost:3000');
