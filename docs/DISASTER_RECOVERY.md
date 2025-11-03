# Disaster Recovery Runbook

## Overview

This document provides procedures for disaster recovery and business continuity for the QR Generator platform.

## Recovery Time Objectives (RTO)

- **Critical Systems**: 4 hours
- **Database**: 1 hour
- **Application**: 30 minutes
- **Full Service Restoration**: 6 hours

## Recovery Point Objectives (RPO)

- **Database**: 1 hour (hourly backups)
- **Application**: Real-time (Git version control)
- **User Data**: 24 hours (daily exports)

## Backup Procedures

### Database Backups

**Automated Daily Backups**

1. **Full Backup**: Daily at 2:00 AM UTC
   - Full database dump
   - Compressed and encrypted
   - Uploaded to S3 backup bucket
   - Retention: 7 days

2. **Incremental Backups**: Hourly
   - Transaction logs
   - Retained for 24 hours

3. **Weekly Backups**: Every Sunday
   - Full backup archive
   - Retention: 4 weeks

4. **Monthly Backups**: First of each month
   - Full backup archive
   - Retention: 12 months

**Manual Backup Procedure**

```bash
# Connect to Supabase/PostgreSQL
# Create full backup
pg_dump -h <host> -U <user> -d <database> | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Encrypt backup
gpg --encrypt --recipient backup-key backup_*.sql.gz

# Upload to backup storage
aws s3 cp backup_*.sql.gz.gpg s3://backups/database/
```

### Application Backups

- **Code**: Git repository with remote backup
- **Environment Variables**: Stored in secure vault (1Password/Vault)
- **Configuration Files**: Version controlled in Git

### File Storage Backups

- **User Uploads**: Daily incremental backup
- **Export Files**: Replicated to secondary region
- **QR Code Images**: Backup to S3 Glacier

## Disaster Recovery Scenarios

### Scenario 1: Database Failure

**Symptoms**:
- Database connection errors
- 500 errors on all API endpoints
- Unable to authenticate users

**Recovery Steps**:

1. **Identify Issue**
   - Check database connection
   - Review database logs
   - Verify database status

2. **Failover to Standby** (if available)
   ```bash
   # Promote standby database
   pg_ctl promote -D /var/lib/postgresql/standby
   # Update connection strings
   ```

3. **Restore from Backup** (if failover unavailable)
   ```bash
   # Stop application
   systemctl stop qr-generator

   # Restore latest backup
   pg_restore -h <host> -U <user> -d <database> backup_*.sql.gz

   # Verify data integrity
   psql -h <host> -U <user> -d <database> -c "SELECT COUNT(*) FROM \"User\";"

   # Restart application
   systemctl start qr-generator
   ```

4. **Verify Restoration**
   - Test authentication
   - Verify QR code generation
   - Check data integrity

**RTO**: 1 hour
**RPO**: Up to 1 hour data loss

### Scenario 2: Application Server Failure

**Symptoms**:
- Application unresponsive
- 502/503 errors
- Cannot access dashboard

**Recovery Steps**:

1. **Check Server Status**
   ```bash
   systemctl status qr-generator
   ```

2. **Restart Application**
   ```bash
   systemctl restart qr-generator
   ```

3. **Deploy to New Server** (if server failed)
   ```bash
   # Clone repository
   git clone <repo-url>
   cd qr-generator

   # Install dependencies
   npm install

   # Set environment variables
   cp .env.example .env
   # Update .env with production values

   # Build and start
   npm run build
   npm start
   ```

4. **Update DNS** (if IP changed)
   - Update A record to new server IP
   - Wait for DNS propagation (TTL dependent)

**RTO**: 30 minutes
**RPO**: Minimal (stateless application)

### Scenario 3: Data Center Outage

**Symptoms**:
- Complete service unavailability
- Cannot reach any infrastructure
- All systems down

**Recovery Steps**:

1. **Activate Secondary Region**
   - Deploy application to secondary region
   - Restore database from latest backup
   - Update DNS to point to secondary region

2. **Restore Services**
   ```bash
   # Deploy application
   # Restore database
   # Configure environment variables
   # Verify all services
   ```

3. **Data Synchronization**
   - Identify data gap since last backup
   - Import any available transaction logs
   - Notify users of potential data loss

4. **Monitor and Stabilize**
   - Monitor system health
   - Check error rates
   - Verify user access

**RTO**: 6 hours
**RPO**: Up to 24 hours (last backup)

### Scenario 4: Security Breach

**Symptoms**:
- Unusual activity in logs
- Unauthorized access detected
- Data exfiltration suspected

**Recovery Steps**:

1. **Immediate Response**
   - Isolate affected systems
   - Revoke all API keys
   - Force password reset for all users
   - Disable compromised accounts

2. **Investigation**
   - Review audit logs
   - Identify breach scope
   - Document affected systems/data

3. **Remediation**
   - Patch vulnerabilities
   - Rotate all secrets
   - Restore from clean backup if needed
   - Re-secure systems

4. **Recovery**
   - Re-enable services gradually
   - Monitor for continued threats
   - Notify affected users
   - Post-incident review

**RTO**: Variable (security dependent)
**RPO**: Variable (restore to pre-breach state)

### Scenario 5: Data Corruption

**Symptoms**:
- Data inconsistencies
- Missing records
- Referential integrity errors

**Recovery Steps**:

1. **Identify Corrupted Data**
   ```sql
   -- Check for orphaned records
   SELECT * FROM "QrCode" WHERE "userId" NOT IN (SELECT id FROM "User");

   -- Check for integrity issues
   SELECT * FROM "QrCodeScan" WHERE "qrCodeId" NOT IN (SELECT id FROM "QrCode");
   ```

2. **Backup Current State**
   ```bash
   pg_dump -h <host> -U <user> -d <database> > corrupted_backup.sql
   ```

3. **Restore from Known Good Backup**
   ```bash
   # Identify last known good backup
   # Restore that backup
   pg_restore -h <host> -U <user> -d <database> backup_YYYYMMDD.sql
   ```

4. **Data Reconciliation**
   - Compare restored data with corrupted backup
   - Identify missing/changed records
   - Manually reconcile if needed

**RTO**: 4 hours
**RPO**: Up to 24 hours (last known good backup)

## Testing and Verification

### Monthly DR Drill

1. **Test Database Restore**
   - Restore to test environment
   - Verify data integrity
   - Document any issues

2. **Test Application Deployment**
   - Deploy to staging
   - Verify functionality
   - Check performance

3. **Review Procedures**
   - Update runbook with learnings
   - Document any changes
   - Train team on procedures

### Quarterly Full DR Test

1. **Simulate Disaster Scenario**
   - Select random scenario
   - Execute recovery procedures
   - Measure RTO/RPO

2. **Document Results**
   - Record actual recovery times
   - Identify improvements
   - Update procedures

## Contact Information

### On-Call Rotation

- **Primary**: [Contact Info]
- **Secondary**: [Contact Info]
- **Escalation**: [Manager Contact]

### Service Providers

- **Hosting**: [Provider Contact]
- **Database**: [Provider Contact]
- **Backup Storage**: [Provider Contact]
- **DNS**: [Provider Contact]

## Post-Recovery Checklist

After any disaster recovery:

- [ ] Verify all services operational
- [ ] Check data integrity
- [ ] Monitor error rates
- [ ] Notify users if data loss occurred
- [ ] Document incident and recovery
- [ ] Update runbook with learnings
- [ ] Schedule post-mortem meeting
- [ ] Review and update procedures

## Maintenance Windows

**Scheduled Maintenance**: First Sunday of each month, 2:00-4:00 AM UTC

**Emergency Maintenance**: As needed, with user notification

## Backup Verification

**Daily**: Automated backup verification
**Weekly**: Manual backup restore test
**Monthly**: Full DR drill

---

**Last Updated**: [Date]
**Next Review**: [Date + 3 months]

