/**
 * Development seed script
 * Creates minimal test data for local development
 */

import { seedDatabase } from './seed'

async function seedDev() {
  console.log('🌱 Seeding development database...')
  
  await seedDatabase({
    users: 3,
    qrCodes: 5,
    organizations: 1,
    apiKeys: true,
  })
}

if (require.main === module) {
  seedDev()
    .then(() => {
      console.log('\n✅ Development seed completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Development seed failed:', error)
      process.exit(1)
    })
}

