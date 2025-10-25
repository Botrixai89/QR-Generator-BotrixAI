# 🚀 Vercel Deployment Guide for QR Generator SaaS

## Prerequisites
- Vercel account
- GitHub repository with your code
- Supabase project
- Razorpay account (Test Mode)

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

## Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project settings:**
   - Framework: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next` (default)

## Step 3: Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables:

### Required Variables:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secret-key

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-test-key-secret
RAZORPAY_WEBHOOK_SECRET=your-test-webhook-secret
```

## Step 4: Database Setup

1. **Run the migration on Supabase:**
   ```sql
   -- Copy and run: migrations/20250101_add_credits_and_payments.sql
   ```

2. **Verify tables are created:**
   - User table has `credits` and `plan` columns
   - Payments table exists

## Step 5: Configure Razorpay Webhook

1. **In Razorpay Dashboard → Settings → Webhooks**
2. **Add webhook URL:**
   ```
   https://your-app-name.vercel.app/api/razorpay/webhook
   ```
3. **Select events:** `payment.captured`
4. **Copy webhook secret** to Vercel environment variables

## Step 6: Deploy and Test

1. **Deploy your project**
2. **Test the complete flow:**
   - Register new user
   - Create QR codes (should deduct credits)
   - Run out of credits
   - Purchase Flex plan via Razorpay
   - Verify credits are added

## Step 7: Domain Configuration (Optional)

1. **Add custom domain in Vercel**
2. **Update NEXTAUTH_URL** to your custom domain
3. **Update Razorpay webhook URL**

## Troubleshooting

### Common Issues:

1. **Build Errors:**
   - Check all environment variables are set
   - Verify Razorpay keys are correct

2. **Payment Issues:**
   - Ensure webhook URL is accessible
   - Check Razorpay webhook secret matches

3. **Database Errors:**
   - Verify Supabase connection
   - Check migration was run successfully

## Production Checklist

Before going live:
- [ ] Switch to Razorpay Live Mode
- [ ] Update environment variables with live keys
- [ ] Complete Razorpay business verification
- [ ] Test with real payment (small amount)
- [ ] Set up monitoring and analytics

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints individually
4. Check Supabase logs

Your QR Generator SaaS is now ready for production! 🎉

