# Vercel Environment Variables Setup
# Copy these to your Vercel project settings

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# Razorpay Payment Integration (TEST MODE for development)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# For Production (replace test keys with live keys)
# RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
# NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
# RAZORPAY_KEY_SECRET=your-live-razorpay-key-secret
# RAZORPAY_WEBHOOK_SECRET=your-live-razorpay-webhook-secret

