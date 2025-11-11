#!/bin/bash
# Automated Database Backup Script
# Creates timestamped backup of PostgreSQL database

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "═══════════════════════════════════════════"
echo "  QR Generator - Database Backup Script"
echo "═══════════════════════════════════════════"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
  echo "Please set DATABASE_URL in your .env file"
  exit 1
fi

# Create backup directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamped backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/qr_generator_backup_$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

echo -e "${YELLOW}📦 Creating database backup...${NC}"
echo "Backup file: $BACKUP_FILE_GZ"
echo ""

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo -e "${RED}❌ ERROR: Invalid DATABASE_URL format${NC}"
  echo "Expected format: postgresql://user:password@host:port/database"
  exit 1
fi

echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo ""

# Set password for pg_dump
export PGPASSWORD="$DB_PASS"

# Create backup with pg_dump
echo -e "${YELLOW}⏳ Running pg_dump...${NC}"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --verbose \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  > "$BACKUP_FILE" 2>&1; then
  echo -e "${GREEN}✅ Backup created successfully${NC}"
else
  echo -e "${RED}❌ Backup failed${NC}"
  unset PGPASSWORD
  exit 1
fi

# Compress backup
echo -e "${YELLOW}📦 Compressing backup...${NC}"
gzip -f "$BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
echo -e "${GREEN}✅ Compressed backup size: $BACKUP_SIZE${NC}"

# Verify backup file
echo ""
echo -e "${YELLOW}🔍 Verifying backup integrity...${NC}"
if gunzip -t "$BACKUP_FILE_GZ" 2>/dev/null; then
  echo -e "${GREEN}✅ Backup file integrity verified${NC}"
else
  echo -e "${RED}❌ Backup file is corrupted${NC}"
  unset PGPASSWORD
  exit 1
fi

# List recent backups
echo ""
echo -e "${YELLOW}📋 Recent backups:${NC}"
ls -lh "$BACKUP_DIR" | tail -n 10

# Cleanup old backups (keep last 7 days)
echo ""
echo -e "${YELLOW}🧹 Cleaning up old backups (keeping last 7 days)...${NC}"
find "$BACKUP_DIR" -name "qr_generator_backup_*.sql.gz" -type f -mtime +7 -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "qr_generator_backup_*.sql.gz" -type f -mtime +7 | wc -l)
echo -e "${GREEN}✅ Cleaned up $DELETED_COUNT old backup(s)${NC}"

# Clear password
unset PGPASSWORD

echo ""
echo "═══════════════════════════════════════════"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "Backup file: $BACKUP_FILE_GZ"
echo "Size: $BACKUP_SIZE"
echo "Timestamp: $TIMESTAMP"
echo ""
echo "To restore this backup, run:"
echo "  bash scripts/restore-database.sh $BACKUP_FILE_GZ"
echo ""

