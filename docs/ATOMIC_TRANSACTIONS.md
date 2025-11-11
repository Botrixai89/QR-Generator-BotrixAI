# Atomic Transactions for QR Code Creation

## Problem Statement

### Previous Implementation Issue

Before this fix, QR code creation followed a two-step process:

1. Create QR code in database
2. Deduct credit from user

**Critical Flaw**: If step 2 failed, the QR code would still exist, resulting in:
- Free QR codes for users
- Revenue loss
- Data inconsistency
- Difficult reconciliation

```typescript
// OLD CODE - PROBLEMATIC
const { data: qrCode } = await supabase.from('QrCode').insert(data)
// ✅ QR code created

const { error } = await supabase.from('User').update({ credits: credits - 1 })
// ❌ If this fails, QR code still exists but credit not deducted!
```

### Race Condition Risk

Multiple concurrent requests from the same user could also cause issues:
- Request A checks credits: 1 available ✅
- Request B checks credits: 1 available ✅
- Request A creates QR code ✅
- Request B creates QR code ✅
- Request A deducts credit: 0 remaining ✅
- Request B deducts credit: -1 remaining ⚠️

Result: User gets 2 QR codes but only pays for 1.

## Solution: Atomic Database Transactions

### Implementation

We created PostgreSQL functions that execute both operations in a single atomic transaction:

```sql
CREATE OR REPLACE FUNCTION create_qr_code_with_credit_deduction(
  p_qr_data JSONB,
  p_user_id TEXT
) RETURNS JSONB AS $$
BEGIN
  -- Lock user row to prevent race conditions
  SELECT credits FROM "User" WHERE id = p_user_id FOR UPDATE;
  
  -- Check credits
  IF credits <= 0 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  -- Create QR code
  INSERT INTO "QrCode" (...) VALUES (...);
  
  -- Deduct credit
  UPDATE "User" SET credits = credits - 1 WHERE id = p_user_id;
  
  -- Return created QR code
  RETURN qr_code;
END;
$$ LANGUAGE plpgsql;
```

### Key Features

1. **Atomicity**: Both operations succeed or both fail
2. **Row Locking**: `FOR UPDATE` prevents race conditions
3. **Error Handling**: Clear error messages for different failure scenarios
4. **Bulk Support**: Separate function for bulk operations

## Benefits

### Data Consistency ✅
- QR codes are only created if credits can be deducted
- No orphaned QR codes
- No negative credit balances

### Revenue Protection 💰
- No free QR codes due to failed credit deduction
- All QR code creations are properly charged

### Concurrency Safety 🔒
- `FOR UPDATE` lock prevents race conditions
- Multiple concurrent requests handled safely
- No double-spending of credits

### Better Error Handling 🎯
```typescript
// Clear error messages
- "Insufficient credits" → 402 Payment Required
- "User not found" → 404 Not Found
- Other errors → 500 Server Error
```

## API Changes

### Single QR Code Creation

**Before:**
```typescript
// Two separate database calls
await supabase.from('QrCode').insert(data)
await supabase.from('User').update({ credits: credits - 1 })
```

**After:**
```typescript
// Single atomic operation
const { data } = await supabase.rpc('create_qr_code_with_credit_deduction', {
  p_qr_data: data,
  p_user_id: userId
})
```

### Bulk QR Code Creation

**Before:**
```typescript
// Created QR codes one by one without credit checks
for (const qr of qrCodes) {
  await supabase.from('QrCode').insert(qr)
}
// Credits deducted at the end (could fail)
```

**After:**
```typescript
// All QR codes created and credits deducted atomically
const { data } = await supabase.rpc('bulk_create_qr_codes_with_credits', {
  p_qr_data_array: qrCodes,
  p_user_id: userId
})
```

## Migration Guide

### Running the Migration

```bash
# Apply the migration
psql $DATABASE_URL -f migrations/20250111_atomic_qr_creation.sql

# Or using Supabase CLI
supabase db push
```

### Verification

Run the test suite to verify the fix:

```bash
npm run test tests/unit/atomic-transactions.test.ts
```

### Rollback (if needed)

```sql
-- Remove functions if rollback is needed
DROP FUNCTION IF EXISTS create_qr_code_with_credit_deduction;
DROP FUNCTION IF EXISTS bulk_create_qr_codes_with_credits;
```

## Testing

### Unit Tests

Comprehensive test coverage includes:
- ✅ Successful QR creation with credit deduction
- ✅ Failure when insufficient credits
- ✅ Rollback when credit deduction fails
- ✅ Race condition prevention
- ✅ Bulk operation atomicity
- ✅ Concurrent request handling

Run tests:
```bash
npm run test -- atomic-transactions
```

### Manual Testing

1. **Test successful creation:**
```bash
curl -X POST http://localhost:3000/api/qr-codes \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "title": "Test QR"}'
```

2. **Test insufficient credits:**
- Set user credits to 0
- Try creating QR code
- Verify error message and no QR code created

3. **Test race conditions:**
- Use multiple concurrent requests with same user
- Verify only correct number of QR codes created

## Performance Impact

### Positive Impacts ✅
- Reduced database round trips (1 call vs 2)
- Better transaction throughput
- Reduced network latency

### Considerations ⚠️
- `FOR UPDATE` locks may cause contention under high load
- Mitigation: Row-level locks are fast, typically < 1ms hold time

### Monitoring

Monitor these metrics:
- Transaction duration
- Lock wait time
- Failed credit checks
- Rollback frequency

```sql
-- Check for lock contention
SELECT * FROM pg_stat_activity 
WHERE wait_event_type = 'Lock' 
AND query LIKE '%QrCode%';
```

## Security Improvements

1. **No Credit Bypass**: Impossible to create QR without deducting credit
2. **Audit Trail**: All operations logged atomically
3. **Validation**: Credit checks happen at database level
4. **Race Condition Prevention**: Locks prevent concurrent abuse

## Backwards Compatibility

- ✅ API endpoints unchanged (internal implementation only)
- ✅ Response format unchanged
- ✅ Error codes standardized (improvement)
- ✅ No breaking changes for frontend

## Future Enhancements

Potential improvements:
- [ ] Add transaction retry logic for deadlock scenarios
- [ ] Implement optimistic locking for better concurrency
- [ ] Add transaction performance metrics
- [ ] Consider implementing with Supabase RLS policies
- [ ] Add automated reconciliation for any edge cases

## Related Files

- Migration: `migrations/20250111_atomic_qr_creation.sql`
- API Route: `src/app/api/qr-codes/route.ts`
- Bulk API: `src/app/api/qr-codes/bulk/route.ts`
- Tests: `tests/unit/atomic-transactions.test.ts`
- Documentation: This file

## References

- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Row Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- [Atomic Operations](https://en.wikipedia.org/wiki/Atomicity_(database_systems))

---

**Status**: ✅ Implemented and tested
**Priority**: 🚨 Critical
**Impact**: High (prevents revenue loss)
**Risk**: Low (backwards compatible)

