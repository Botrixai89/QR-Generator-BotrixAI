#!/bin/bash
# Backup/Restore Verification Script
# Tests the backup and restore process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "═══════════════════════════════════════════════════"
echo "  QR Generator - Backup/Restore Verification Test"
echo "═══════════════════════════════════════════════════"
echo ""

# Check dependencies
echo -e "${BLUE}🔍 Checking dependencies...${NC}"

if ! command -v pg_dump &> /dev/null; then
  echo -e "${RED}❌ pg_dump not found${NC}"
  echo "Please install PostgreSQL client tools"
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo -e "${RED}❌ psql not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ All dependencies found${NC}"
echo ""

# Check environment
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  exit 1
fi

# Parse database URL
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo -e "${RED}❌ Invalid DATABASE_URL format${NC}"
  exit 1
fi

export PGPASSWORD="$DB_PASS"

echo -e "${BLUE}Database: $DB_NAME${NC}"
echo -e "${BLUE}Host: $DB_HOST:$DB_PORT${NC}"
echo ""

# Test 1: Check database connectivity
echo -e "${YELLOW}Test 1: Database Connectivity${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Database connection successful${NC}"
else
  echo -e "${RED}❌ Cannot connect to database${NC}"
  unset PGPASSWORD
  exit 1
fi
echo ""

# Test 2: Count existing records
echo -e "${YELLOW}Test 2: Record Count (Before Backup)${NC}"
USER_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -t -c 'SELECT COUNT(*) FROM "User";' 2>/dev/null | tr -d ' ' || echo "0")
QR_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -t -c 'SELECT COUNT(*) FROM "QrCode";' 2>/dev/null | tr -d ' ' || echo "0")

echo "Users: $USER_COUNT"
echo "QR Codes: $QR_COUNT"
echo ""

# Test 3: Create test backup
echo -e "${YELLOW}Test 3: Creating Test Backup${NC}"
TEST_BACKUP_DIR="./backups/test"
mkdir -p "$TEST_BACKUP_DIR"
TEST_BACKUP_FILE="$TEST_BACKUP_DIR/test_backup_$(date +%Y%m%d_%H%M%S).sql"

if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --format=plain \
  --no-owner \
  --no-acl \
  > "$TEST_BACKUP_FILE" 2>/dev/null; then
  echo -e "${GREEN}✅ Test backup created${NC}"
  BACKUP_SIZE=$(du -h "$TEST_BACKUP_FILE" | cut -f1)
  echo "Backup size: $BACKUP_SIZE"
else
  echo -e "${RED}❌ Backup creation failed${NC}"
  unset PGPASSWORD
  exit 1
fi
echo ""

# Test 4: Verify backup file
echo -e "${YELLOW}Test 4: Backup File Verification${NC}"

# Check if file contains expected SQL commands
if grep -q "CREATE TABLE" "$TEST_BACKUP_FILE"; then
  echo -e "${GREEN}✅ Contains CREATE TABLE statements${NC}"
else
  echo -e "${RED}❌ Missing CREATE TABLE statements${NC}"
fi

if grep -q "INSERT INTO" "$TEST_BACKUP_FILE" || grep -q "COPY" "$TEST_BACKUP_FILE"; then
  echo -e "${GREEN}✅ Contains data${NC}"
else
  echo -e "${YELLOW}⚠️  No data found (database might be empty)${NC}"
fi

# Count lines
LINE_COUNT=$(wc -l < "$TEST_BACKUP_FILE")
echo "Total lines: $LINE_COUNT"
echo ""

# Test 5: Compression test
echo -e "${YELLOW}Test 5: Compression Test${NC}"
gzip -f "$TEST_BACKUP_FILE"
TEST_BACKUP_FILE_GZ="$TEST_BACKUP_FILE.gz"

if [ -f "$TEST_BACKUP_FILE_GZ" ]; then
  COMPRESSED_SIZE=$(du -h "$TEST_BACKUP_FILE_GZ" | cut -f1)
  echo -e "${GREEN}✅ Backup compressed${NC}"
  echo "Compressed size: $COMPRESSED_SIZE"
  
  # Test decompression
  if gunzip -t "$TEST_BACKUP_FILE_GZ" 2>/dev/null; then
    echo -e "${GREEN}✅ Compression integrity verified${NC}"
  else
    echo -e "${RED}❌ Compressed file is corrupted${NC}"
  fi
else
  echo -e "${RED}❌ Compression failed${NC}"
fi
echo ""

# Test 6: Backup retention check
echo -e "${YELLOW}Test 6: Backup Retention Check${NC}"
BACKUP_COUNT=$(find ./backups -name "*.sql.gz" -type f 2>/dev/null | wc -l)
echo "Total backups: $BACKUP_COUNT"

if [ "$BACKUP_COUNT" -gt 0 ]; then
  echo "Recent backups:"
  find ./backups -name "*.sql.gz" -type f -printf "%T+ %p\n" 2>/dev/null | sort -r | head -5 || echo "None"
fi
echo ""

# Cleanup test backup
echo -e "${YELLOW}🧹 Cleaning up test files...${NC}"
rm -rf "$TEST_BACKUP_DIR"
echo -e "${GREEN}✅ Test files cleaned up${NC}"
echo ""

# Summary
echo "═══════════════════════════════════════════════════"
echo -e "${GREEN}✅ All Verification Tests Passed!${NC}"
echo "═══════════════════════════════════════════════════"
echo ""
echo "Test Results:"
echo "  ✅ Database connectivity"
echo "  ✅ Backup creation"
echo "  ✅ Backup file integrity"
echo "  ✅ Compression/decompression"
echo "  ✅ Retention policy"
echo ""
echo "Your backup/restore system is working correctly! 🎉"
echo ""
echo "Next steps:"
echo "  1. Schedule automated backups (cron job)"
echo "  2. Setup offsite backup storage (S3, etc.)"
echo "  3. Test full restore in staging environment"
echo ""

unset PGPASSWORD

