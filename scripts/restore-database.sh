#!/bin/bash
# Database Restore Script
# Restores database from backup file

set -e # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "═══════════════════════════════════════════"
echo "  QR Generator - Database Restore Script"
echo "═══════════════════════════════════════════"
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ ERROR: No backup file specified${NC}"
  echo ""
  echo "Usage: bash scripts/restore-database.sh <backup-file>"
  echo "Example: bash scripts/restore-database.sh backups/qr_generator_backup_20250111_120000.sql.gz"
  echo ""
  exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ ERROR: Backup file not found: $BACKUP_FILE${NC}"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
  exit 1
fi

# Extract connection details
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo -e "${RED}❌ ERROR: Invalid DATABASE_URL format${NC}"
  exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will REPLACE all data in the database!${NC}"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"
echo ""

# Confirmation
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled"
  exit 0
fi

export PGPASSWORD="$DB_PASS"

# Decompress backup if needed
TEMP_SQL_FILE=""
if [[ $BACKUP_FILE == *.gz ]]; then
  echo -e "${YELLOW}📦 Decompressing backup...${NC}"
  TEMP_SQL_FILE="${BACKUP_FILE%.gz}"
  gunzip -c "$BACKUP_FILE" > "$TEMP_SQL_FILE"
  SQL_FILE="$TEMP_SQL_FILE"
else
  SQL_FILE="$BACKUP_FILE"
fi

# Create backup of current database before restore (safety)
echo -e "${YELLOW}💾 Creating safety backup of current database...${NC}"
SAFETY_BACKUP="./backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" | gzip > "$SAFETY_BACKUP"
echo -e "${GREEN}✅ Safety backup created: $SAFETY_BACKUP${NC}"
echo ""

# Restore database
echo -e "${YELLOW}⏳ Restoring database...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"; then
  echo -e "${GREEN}✅ Database restored successfully${NC}"
else
  echo -e "${RED}❌ Restore failed${NC}"
  echo -e "${YELLOW}ℹ️  You can restore from safety backup: $SAFETY_BACKUP${NC}"
  
  # Cleanup temp file
  if [ -n "$TEMP_SQL_FILE" ] && [ -f "$TEMP_SQL_FILE" ]; then
    rm "$TEMP_SQL_FILE"
  fi
  
  unset PGPASSWORD
  exit 1
fi

# Cleanup temp file
if [ -n "$TEMP_SQL_FILE" ] && [ -f "$TEMP_SQL_FILE" ]; then
  rm "$TEMP_SQL_FILE"
fi

# Verify restore
echo ""
echo -e "${YELLOW}🔍 Verifying restore...${NC}"

# Check if tables exist
TABLES_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo "Tables found: $(echo $TABLES_COUNT | tr -d ' ')"

if [ "$(echo $TABLES_COUNT | tr -d ' ')" -gt 0 ]; then
  echo -e "${GREEN}✅ Restore verified - tables exist${NC}"
else
  echo -e "${RED}❌ Verification failed - no tables found${NC}"
fi

unset PGPASSWORD

echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}✅ Restore completed successfully!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "Safety backup (in case of issues): $SAFETY_BACKUP"
echo ""

