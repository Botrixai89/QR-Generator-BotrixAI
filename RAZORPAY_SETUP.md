# Razorpay Integration Setup

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Razorpay Payment Integration
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-key-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"
```

## Getting Razorpay Credentials

1. **Sign up for Razorpay**: Go to [razorpay.com](https://razorpay.com) and create an account
2. **Get Test Credentials**: 
   - Go to Settings > API Keys
   - Generate test API keys
   - Copy the Key ID and Key Secret
3. **Set up Webhook**:
   - Go to Settings > Webhooks
   - Add webhook URL: `https://yourdomain.com/api/razorpay/webhook`
   - Select events: `payment.captured`
   - Copy the webhook secret

## Database Migration

Run the SQL migration to add credits and payments tables:

```bash
# Connect to your Supabase database and run:
psql -h db.[project-id].supabase.co -U postgres -d postgres -f migrations/20250101_add_credits_and_payments.sql
```

## Testing the Integration

### 1. Test User Registration
- Register a new user
- Verify they get 10 free credits by default
- Check the User table has `credits = 10` and `plan = 'FREE'`

### 2. Test QR Code Creation
- Create QR codes until credits reach 0
- Verify each QR creation deducts 1 credit
- When credits = 0, verify QR creation returns HTTP 402 with `{ error: 'no_credits' }`
- Verify client redirects to `/pricing` page

### 3. Test Payment Flow
- Go to `/pricing` page
- Click "Buy now — ₹300" button
- Complete Razorpay test payment (use test card: 4111 1111 1111 1111)
- Verify payment success and credits increase by 100
- Verify user plan changes to 'FLEX'

### 4. Test Webhook (Optional)
- Configure webhook URL in Razorpay dashboard
- Test payment and verify webhook processes the payment
- Check idempotency (webhook won't double-credit)

## Test Cards for Development

Use these test card numbers in Razorpay test mode:

- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## Security Notes

- Never expose `RAZORPAY_KEY_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` to client
- Always verify Razorpay signatures server-side
- Use webhooks for production reconciliation
- Log all payment events for debugging

## Troubleshooting

1. **Payment verification fails**: Check signature verification logic
2. **Credits not updating**: Verify service role key has proper permissions
3. **Webhook not working**: Check webhook URL and secret configuration
4. **QR creation fails**: Verify credits check and deduction logic
