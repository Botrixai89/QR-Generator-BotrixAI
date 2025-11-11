#!/usr/bin/env tsx
/**
 * Script to verify database indexes are created and being used
 * Checks index existence, size, and usage statistics
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const EXPECTED_INDEXES = [
  // QR Code indexes
  'idx_qrcode_organization_id',
  'idx_qrcode_is_dynamic',
  'idx_qrcode_expires_at',
  'idx_qrcode_user_created',
  'idx_qrcode_org_created',
  'idx_qrcode_url_hash',
  'idx_qrcode_active_dynamic',
  'idx_qrcode_recent',
  'idx_qrcode_expiring_soon',
  'idx_qrcode_dynamic_content_gin',
  'idx_qrcode_gradient_gin',
  
  // Scan indexes
  'idx_scan_qrcode_created',
  'idx_scan_country_city',
  'idx_scan_device',
  'idx_scan_created_at',
  'idx_scan_user_created',
  'idx_scan_ip_address',
  
  // API Key indexes
  'idx_apikey_hash',
  'idx_apikey_user_active',
  'idx_apikey_expires_at',
  'idx_apikey_org_active',
  
  // User indexes
  'idx_user_credits',
  'idx_user_email_verified',
  'idx_user_plan',
  'idx_user_subscription_status',
  
  // Organization indexes
  'idx_organization_slug',
  'idx_organization_active',
  'idx_org_member_user_org',
  'idx_org_member_role',
  'idx_org_member_active',
  
  // Payment indexes
  'idx_payment_external_id',
  'idx_payment_user_created',
  'idx_payment_failed',
  'idx_payment_subscription',
  
  // System indexes
  'idx_audit_log_user_action',
  'idx_audit_log_resource',
  'idx_audit_log_created',
  'idx_notification_user_unread',
  'idx_notification_type',
  'idx_custom_domain_unique',
  'idx_custom_domain_verified',
  'idx_custom_domain_user',
  'idx_background_job_processing',
  'idx_background_job_failed',
  'idx_webhook_outbox_retry',
  'idx_webhook_outbox_delivered',
  'idx_rate_limit_active',
  'idx_metric_name_timestamp',
  'idx_request_metric_endpoint',
  'idx_request_metric_correlation'
]

async function checkIndexExists() {
  console.log('🔍 Checking index existence...\n')

  const query = `
    SELECT
      indexname,
      tablename,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    ORDER BY tablename, indexname;
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql_query', { query })
    
    if (error) {
      console.error('❌ Failed to query indexes:', error.message)
      return { existing: [], missing: EXPECTED_INDEXES }
    }

    const existingIndexes = (data as Array<{ indexname: string }>).map(row => row.indexname)
    const missing = EXPECTED_INDEXES.filter(idx => !existingIndexes.includes(idx))

    // Display results
    const created = EXPECTED_INDEXES.filter(idx => existingIndexes.includes(idx))
    
    console.log(`✅ Found ${created.length}/${EXPECTED_INDEXES.length} expected indexes`)
    
    if (missing.length > 0) {
      console.log(`\n⚠️  Missing ${missing.length} indexes:`)
      missing.forEach(idx => console.log(`   - ${idx}`))
    }

    return { existing: existingIndexes, missing }
  } catch (error) {
    console.error('Error checking indexes:', error)
    return { existing: [], missing: EXPECTED_INDEXES }
  }
}

async function checkIndexUsage() {
  console.log('\n📊 Checking index usage statistics...\n')

  const query = `
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched,
      pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    ORDER BY idx_scan DESC
    LIMIT 20;
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql_query', { query })
    
    if (error) {
      console.log('⚠️  Could not fetch index usage (this is okay if indexes are new)')
      return
    }

    console.log('Top 20 most used indexes:\n')
    console.log('Index Name'.padEnd(40), 'Scans'.padEnd(10), 'Size')
    console.log('─'.repeat(60))

    for (const row of data as Array<{ indexname: string; scans: number; size: string }>) {
      console.log(
        row.indexname.padEnd(40),
        String(row.scans).padEnd(10),
        row.size
      )
    }
  } catch (error) {
    console.log('⚠️  Could not fetch usage stats (indexes may be newly created)')
  }
}

async function checkUnusedIndexes() {
  console.log('\n🔍 Checking for unused indexes...\n')

  const query = `
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan,
      pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      AND idx_scan = 0
    ORDER BY pg_relation_size(indexrelid) DESC;
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql_query', { query })
    
    if (error) {
      console.log('⚠️  Could not check unused indexes')
      return
    }

    if (!data || (data as Array<unknown>).length === 0) {
      console.log('✅ All indexes are being used!')
      return
    }

    console.log(`⚠️  Found ${(data as Array<unknown>).length} unused indexes:`)
    console.log('(Note: New indexes may show 0 scans initially)\n')
    
    for (const row of data as Array<{ indexname: string; tablename: string; size: string }>) {
      console.log(`   - ${row.indexname} on ${row.tablename} (${row.size})`)
    }
  } catch (error) {
    console.log('⚠️  Could not check unused indexes')
  }
}

async function checkTableStats() {
  console.log('\n📈 Table scan statistics...\n')

  const query = `
    SELECT
      relname as table_name,
      seq_scan as sequential_scans,
      idx_scan as index_scans,
      CASE 
        WHEN idx_scan > 0 THEN ROUND((seq_scan::numeric / idx_scan::numeric), 2)
        ELSE 0
      END as scan_ratio,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
    ORDER BY seq_scan DESC
    LIMIT 10;
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql_query', { query })
    
    if (error) {
      console.log('⚠️  Could not fetch table stats')
      return
    }

    console.log('Table'.padEnd(25), 'Seq Scans'.padEnd(12), 'Index Scans'.padEnd(12), 'Ratio'.padEnd(8), 'Size')
    console.log('─'.repeat(75))

    for (const row of data as Array<{
      table_name: string
      sequential_scans: number
      index_scans: number
      scan_ratio: number
      total_size: string
    }>) {
      const ratioWarning = row.scan_ratio > 1 ? ' ⚠️' : ''
      console.log(
        row.table_name.padEnd(25),
        String(row.sequential_scans).padEnd(12),
        String(row.index_scans).padEnd(12),
        String(row.scan_ratio).padEnd(8) + ratioWarning,
        row.total_size
      )
    }

    console.log('\n💡 Ratio > 1 means more sequential scans than index scans (may need more indexes)')
  } catch (error) {
    console.log('⚠️  Could not fetch table stats')
  }
}

async function checkIndexHealth() {
  console.log('\n🏥 Index health check...\n')

  const query = `
    SELECT
      schemaname,
      tablename,
      indexname,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
      pg_size_pretty(pg_relation_size(relid)) as table_size
    FROM pg_stat_user_indexes
    JOIN pg_stat_user_tables USING (schemaname, relname)
    WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
    ORDER BY pg_relation_size(indexrelid) DESC
    LIMIT 10;
  `

  try {
    const { data, error } = await supabase.rpc('exec_sql_query', { query })
    
    if (error) {
      console.log('⚠️  Could not check index health')
      return
    }

    console.log('Largest indexes:\n')
    console.log('Index Name'.padEnd(40), 'Index Size'.padEnd(12), 'Table Size')
    console.log('─'.repeat(60))

    for (const row of data as Array<{
      indexname: string
      index_size: string
      table_size: string
    }>) {
      console.log(
        row.indexname.padEnd(40),
        row.index_size.padEnd(12),
        row.table_size
      )
    }
  } catch (error) {
    console.log('⚠️  Could not check index health')
  }
}

async function main() {
  console.log('═'.repeat(60))
  console.log('  DATABASE INDEX VERIFICATION')
  console.log('═'.repeat(60))
  console.log()

  // 1. Check if indexes exist
  const { existing, missing } = await checkIndexExists()

  // 2. Check index usage
  await checkIndexUsage()

  // 3. Check for unused indexes
  await checkUnusedIndexes()

  // 4. Check table stats
  await checkTableStats()

  // 5. Check index health
  await checkIndexHealth()

  // Final summary
  console.log('\n' + '═'.repeat(60))
  console.log('  SUMMARY')
  console.log('═'.repeat(60))
  console.log()
  console.log(`✅ Expected indexes: ${EXPECTED_INDEXES.length}`)
  console.log(`✅ Found indexes: ${existing.length}`)
  console.log(`${missing.length > 0 ? '⚠️' : '✅'} Missing indexes: ${missing.length}`)
  
  if (missing.length > 0) {
    console.log('\n⚠️  Run migration to create missing indexes:')
    console.log('   npm run db:migrate')
  } else {
    console.log('\n🎉 All expected indexes are present!')
  }

  console.log('\n💡 Tips:')
  console.log('   - New indexes may show 0 scans initially')
  console.log('   - Run ANALYZE to update table statistics')
  console.log('   - Monitor index usage over time')
  console.log('   - Drop unused indexes after 2-4 weeks if still at 0 scans')
  console.log()
}

main().catch(console.error)

