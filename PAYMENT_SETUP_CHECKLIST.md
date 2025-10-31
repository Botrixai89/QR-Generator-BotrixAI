# ✅ Payment Setup Checklist

This guide will help you verify and test the payment integration step by step.

## 📋 Step 1: Verify Configuration

First, check if all your configurations are correct:

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Visit the verification endpoint:**
   ```
   http://localhost:3000/api/payment/verify-config
   ```

3. **Check the response** - You should see:
   ```json
   {
     "status": "ok",
     "checks": {
       "razorpayKeyId": { "status": "ok", "message": "..." },
       "razorpayPublicKeyId": { "status": "ok", "message": "..." },
       "razorpayKeySecret": { "status": "ok", "message": "..." },
       "paymentsTable": { "status": "ok", "message": "..." },
       "userTableColumns": { "status": "ok", "message": "..." }
     },
     "summary": {
       "total": 7,
       "ok": 7,
       "warnings": 0,
       "errors": 0
     }
   }
   ```

4. **If you see errors**, fix them:
   - ❌ Missing environment variables → Add them to `.env.local`
   - ❌ Payments table missing → Run database migration (Step 2)
   - ❌ User table missing columns → Run database migration (Step 2)

## 🗄️ Step 2: Run Database Migration

**IMPORTANT:** You must run this migration if you haven't already!

### Option A: Using Supabase Dashboard (Easiest)

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `migrations/20250101_add_credits_and_payments.sql`
3. Paste and run the SQL script
4. Verify by checking:
   - The `payments` table exists
   - The `User` table has `credits` and `plan` columns

### Option B: Using psql (Command Line)

```bash
psql -h db.[your-project-id].supabase.co -U postgres -d postgres -f migrations/20250101_add_credits_and_payments.sql
```

### Option C: Using Supabase Client (Alternative)

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const sql = fs.readFileSync('migrations/20250101_add_credits_and_payments.sql', 'utf8');
// Execute via Supabase REST API or direct connection
"
```

**After running migration**, verify again with `/api/payment/verify-config`

## 🔗 Step 3: Configure Razorpay Webhook (Production/Live)

**For your live site (`qr-generator-botrix-ai.vercel.app`):**

1. Go to **Razorpay Dashboard** → **Settings** → **Webhooks**
2. Click **"Create Webhook"** or **"Add New Webhook"**
3. Set:
   - **Webhook URL**: `https://qr-generator-botrix-ai.vercel.app/api/razorpay/webhook`
   - **Secret**: Set a strong secret (copy it to `RAZORPAY_WEBHOOK_SECRET`)
   - **Active Events**: Select `payment.captured` ✅
   - **Alert Email**: Your email (optional)
4. Click **"Create Webhook"**
5. **Copy the webhook secret** and add it to your Vercel environment variables

**For localhost testing:**
- Use a tool like **ngrok** to expose `http://localhost:3000` temporarily
- Or skip webhook testing for now (payment verification will still work client-side)

## 🧪 Step 4: Test the Complete Flow

### Test 1: User Registration & Credits

1. **Register a new user:**
   - Go to `/auth/signup`
   - Create a test account
   - Sign in

2. **Verify credits:**
   - Go to `/dashboard`
   - You should see **10 credits** displayed
   - Check in Supabase: `User` table → `credits = 10`, `plan = 'FREE'`

### Test 2: QR Code Creation & Credit Deduction

1. **Create QR codes:**
   - Go to the home page or `/dashboard`
   - Generate a few QR codes
   - Each QR should deduct **1 credit**

2. **Check credits decrease:**
   - Dashboard should show decreasing credits
   - After 10 QR codes, you should have **0 credits**

3. **Test credit limit:**
   - Try to create another QR code
   - Should show error: "You have no credits left"
   - Should redirect to `/pricing` page

### Test 3: Payment Flow (Main Test)

1. **Go to pricing page:**
   - Visit `/pricing`
   - You should see two plans: **Free** and **Flex Plan (₹300)**

2. **Click "Buy now — ₹300":**
   - Razorpay checkout should open
   - Use test card: **4111 1111 1111 1111**
   - **CVV**: Any 3 digits (e.g., 123)
   - **Expiry**: Any future date (e.g., 12/25)
   - **Name**: Any name

3. **Complete payment:**
   - Click **Pay**
   - Payment should process successfully
   - You should see: **"Payment successful! 100 credits added"**
   - Should redirect to `/dashboard`

4. **Verify credits updated:**
   - Dashboard should show **100 credits** (or 100 + any remaining)
   - Check Supabase: `User` table → `credits = 100`, `plan = 'FLEX'`

5. **Verify payment record:**
   - Check `payments` table in Supabase
   - Should have a record with:
     - `status = 'paid'`
     - `amount = 30000` (₹300 in paise)
     - `user_id` matching your user

### Test 4: Webhook Verification (If Configured)

1. **Check Razorpay dashboard:**
   - Go to **Payments** → Find your test payment
   - Check **Webhook Logs** section
   - Should show webhook was sent successfully

2. **Verify webhook processed:**
   - Check your server logs (Vercel logs or console)
   - Should see: `"Webhook processed: User [id] credited with 100 credits"`
   - Payment record should already be marked as paid

3. **Test idempotency:**
   - Manually trigger webhook again (from Razorpay dashboard)
   - Should not double-credit (check logs for "Already processed")

## 🐛 Troubleshooting

### Issue: "Failed to initiate payment"
- ✅ Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set correctly
- ✅ Check Razorpay key ID matches in dashboard
- ✅ Check browser console for errors

### Issue: "Payment verification failed"
- ✅ Check `RAZORPAY_KEY_SECRET` matches Razorpay dashboard
- ✅ Check server logs for signature verification errors
- ✅ Ensure payment wasn't already processed

### Issue: "Credits not updating"
- ✅ Check `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- ✅ Verify database migration ran successfully
- ✅ Check Supabase logs for permission errors
- ✅ Verify user table has `credits` column

### Issue: "Payments table doesn't exist"
- ✅ Run database migration: `migrations/20250101_add_credits_and_payments.sql`
- ✅ Verify migration completed without errors

### Issue: "Webhook not working"
- ✅ Check webhook URL is correct and accessible
- ✅ Verify `RAZORPAY_WEBHOOK_SECRET` matches Razorpay dashboard
- ✅ Check webhook event is `payment.captured`
- ✅ For localhost, use ngrok or skip webhook testing

## ✅ Success Criteria

Your payment integration is working if:

- ✅ Configuration check passes (`/api/payment/verify-config` shows all green)
- ✅ New users get 10 free credits
- ✅ QR creation deducts credits correctly
- ✅ Payment checkout opens successfully
- ✅ Test payment completes successfully
- ✅ Credits increase by 100 after payment
- ✅ User plan changes to 'FLEX'
- ✅ Payment record is created in database
- ✅ Webhook processes payments (if configured)

## 🚀 Next Steps

Once all tests pass:

1. **Deploy to production** with all environment variables set
2. **Update webhook URL** in Razorpay to your live domain
3. **Test with real payment** (small amount first)
4. **Switch to Razorpay Live Mode** when ready
5. **Update environment variables** to live keys

---

**Need help?** Check:
- `RAZORPAY_SETUP.md` - Detailed Razorpay setup
- `VERCEL_DEPLOYMENT_GUIDE.md` - Production deployment
- Server logs for detailed error messages

