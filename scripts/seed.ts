/**
 * Seed script for local development and testing
 * Populates the database with test data
 */

import { supabaseAdmin } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

interface SeedOptions {
  users?: number
  qrCodes?: number
  organizations?: number
  apiKeys?: boolean
}

async function seedDatabase(options: SeedOptions = {}) {
  const {
    users = 5,
    qrCodes = 10,
    organizations = 2,
    apiKeys = true,
  } = options

  console.log('🌱 Starting database seed...')

  try {
    // Seed users
    console.log(`Creating ${users} test users...`)
    const testUsers = []
    for (let i = 0; i < users; i++) {
      const email = `test-user-${i + 1}@example.com`
      const password = await bcrypt.hash('password123', 10)
      
      const { data: user, error } = await supabaseAdmin!
        .from('User')
        .insert({
          email,
          name: `Test User ${i + 1}`,
          password,
          plan: i === 0 ? 'PRO' : i === 1 ? 'FLEX' : 'FREE',
          credits: i === 1 ? 1000 : 0,
          emailVerified: i < 2, // First 2 users verified
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error(`Error creating user ${email}:`, error)
      } else if (user) {
        testUsers.push(user)
        console.log(`✓ Created user: ${email}`)
      }
    }

    // Seed organizations
    console.log(`Creating ${organizations} test organizations...`)
    const testOrgs = []
    for (let i = 0; i < organizations && i < testUsers.length; i++) {
      const { data: org, error } = await supabaseAdmin!
        .from('Organization')
        .insert({
          name: `Test Organization ${i + 1}`,
          slug: `test-org-${i + 1}`,
          ownerId: testUsers[i].id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (error && error.code !== '23505') {
        console.error(`Error creating organization:`, error)
      } else if (org) {
        testOrgs.push(org)
        console.log(`✓ Created organization: ${org.name}`)
      }
    }

    // Seed QR codes
    console.log(`Creating ${qrCodes} test QR codes...`)
    for (let i = 0; i < qrCodes; i++) {
      const userId = testUsers[i % testUsers.length]?.id
      if (!userId) continue

      const { data: qrCode, error } = await supabaseAdmin!
        .from('QrCode')
        .insert({
          userId,
          url: `https://example.com/${i + 1}`,
          title: `Test QR Code ${i + 1}`,
          isActive: true,
          scanCount: Math.floor(Math.random() * 100),
          isDynamic: i % 3 === 0,
          hasWatermark: i % 2 === 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (error && error.code !== '23505') {
        console.error(`Error creating QR code:`, error)
      } else if (qrCode) {
        console.log(`✓ Created QR code: ${qrCode.title}`)
      }
    }

    // Seed API keys (if enabled)
    if (apiKeys && testUsers.length > 0) {
      console.log('Creating test API keys...')
      const { data: apiKey, error } = await supabaseAdmin!
        .from('ApiKey')
        .insert({
          userId: testUsers[0].id,
          name: 'Test API Key',
          keyHash: 'test-key-hash',
          scopes: ['qr:read', 'qr:write'],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single()

      if (error && error.code !== '23505') {
        console.error(`Error creating API key:`, error)
      } else if (apiKey) {
        console.log(`✓ Created API key: ${apiKey.name}`)
      }
    }

    console.log('✅ Database seed completed successfully!')
    console.log('\nTest credentials:')
    console.log('  Email: test-user-1@example.com')
    console.log('  Password: password123')
    console.log('\n  Email: test-user-2@example.com')
    console.log('  Password: password123')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase({
    users: 5,
    qrCodes: 10,
    organizations: 2,
    apiKeys: true,
  })
    .then(() => {
      console.log('\n✅ Seed script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error)
      process.exit(1)
    })
}

export { seedDatabase }

