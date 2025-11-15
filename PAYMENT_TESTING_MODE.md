# 🧪 Payment Testing Mode - ₹1 Configuration

## ✅ Current Status: TESTING MODE ACTIVE

The payment amount has been set to **₹1 (100 paise)** for testing the payment flow.

## 📝 Files Modified

1. **`src/app/api/razorpay/create/route.ts`**
   - Line 49: `amount: 100` (₹1 in paise)
   - Line 74: `amount: 100` (payment record)

2. **`src/app/pricing/page.tsx`**
   - Line 104: `amount: 100` (Razorpay checkout)
   - Line 243: Display shows "₹1 (Testing Mode)"
   - Line 280: Button shows "Buy now — ₹1 (Testing)"

## 🔄 How to Switch Back to Production (₹300)

When you're ready to go live, change the following:

### 1. Update API Route (`src/app/api/razorpay/create/route.ts`)

```typescript
// Change from:
amount: 100, // ₹1 in paise (TESTING - change to 30000 for production)

// To:
amount: 30000, // ₹300 in paise
```

**Update in 2 places:**
- Line 49: Razorpay order creation
- Line 74: Payment record insertion

### 2. Update Pricing Page (`src/app/pricing/page.tsx`)

```typescript
// Change from:
amount: 100, // ₹1 in paise (TESTING - change to 30000 for production)

// To:
amount: 30000, // ₹300 in paise
```

**Update display:**
```tsx
// Change from:
₹1
<span className="ml-2 text-xs font-normal text-amber-600">(Testing Mode)</span>

// To:
₹300
```

**Update button:**
```tsx
// Change from:
{isLoading ? "Processing..." : "Buy now — ₹1 (Testing)"}

// To:
{isLoading ? "Processing..." : "Buy now — ₹300"}
```

## ✅ Testing Checklist

With ₹1 amount, you can now:

- [ ] Test payment flow with minimal cost
- [ ] Verify Razorpay integration works
- [ ] Check payment verification
- [ ] Confirm credits are added correctly
- [ ] Test webhook processing
- [ ] Verify payment records in database

## 🎯 Test Payment Flow

1. Go to `/pricing` page
2. Click "Buy now — ₹1 (Testing)"
3. Use Razorpay test card:
   - **Card Number**: 4111 1111 1111 1111
   - **CVV**: Any 3 digits (e.g., 123)
   - **Expiry**: Any future date (e.g., 12/25)
4. Complete payment
5. Verify:
   - Payment succeeds
   - 100 credits added to account
   - Payment record created in database

## ⚠️ Important Notes

- **This is for testing only** - Don't forget to change back to ₹300 before production!
- All payment amounts are in **paise** (smallest currency unit)
- ₹1 = 100 paise
- ₹300 = 30000 paise
- The credits given (100 credits) remain the same regardless of amount

## 🔍 Quick Find & Replace

To quickly switch back to production, search for:
- `amount: 100` → Replace with `amount: 30000`
- `₹1` → Replace with `₹300`
- `(Testing Mode)` → Remove
- `(Testing)` → Remove

---

**Last Updated**: Payment testing mode activated
**Status**: ✅ Ready for testing

