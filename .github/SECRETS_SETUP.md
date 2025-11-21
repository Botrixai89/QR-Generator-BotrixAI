# GitHub Secrets Configuration Guide

This guide explains how to configure GitHub Secrets for CI/CD testing.

## Required Secrets

The following secrets must be configured in your GitHub repository settings for CI/CD to work properly.

### Accessing GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each secret below

## Supabase Secrets

### `NEXT_PUBLIC_SUPABASE_URL`
- **Description**: Your Supabase project URL
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Format**: `https://xxxxx.supabase.co`
- **Required for**: All jobs (client-side operations)

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Description**: Supabase anonymous/public key
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Required for**: All jobs (client-side operations)

### `SUPABASE_URL`
- **Description**: Supabase project URL (can be same as NEXT_PUBLIC_SUPABASE_URL)
- **Where to find**: Supabase Dashboard → Settings → API → Project URL
- **Format**: `https://xxxxx.supabase.co`
- **Required for**: Integration tests, E2E tests (server-side operations)

### `SUPABASE_SERVICE_ROLE_KEY`
- **Description**: Supabase service role key (⚠️ **KEEP SECRET** - has admin access)
- **Where to find**: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
- **Format**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Required for**: Integration tests, E2E tests (database operations)
- **⚠️ Security Note**: This key bypasses Row Level Security. Never expose it publicly.

## Authentication Secrets

### `NEXTAUTH_SECRET`
- **Description**: Secret key for NextAuth.js session encryption
- **How to generate**: 
  ```bash
  openssl rand -base64 32
  ```
  Or use: https://generate-secret.vercel.app/32
- **Format**: Any random string (32+ characters recommended)
- **Required for**: All jobs (authentication)

### `NEXTAUTH_URL`
- **Description**: Base URL of your application
- **Format**: `https://your-domain.com` or `http://localhost:3000` for local
- **Required for**: All jobs (authentication callbacks)

## Payment Gateway Secrets (Test Mode)

### `RAZORPAY_KEY_ID`
- **Description**: Razorpay test key ID
- **Where to find**: Razorpay Dashboard → Settings → API Keys → Test Key
- **Format**: `rzp_test_xxxxx`
- **Required for**: Integration tests, E2E tests (payment flow)

### `RAZORPAY_KEY_SECRET`
- **Description**: Razorpay test key secret (⚠️ **KEEP SECRET**)
- **Where to find**: Razorpay Dashboard → Settings → API Keys → Test Key Secret
- **Format**: `xxxxx` (alphanumeric string)
- **Required for**: Integration tests, E2E tests (payment verification)
- **⚠️ Security Note**: Never expose this key publicly.

## Optional Secrets

### `E2E_TEST_EMAIL`
- **Description**: Test user email for E2E tests
- **Format**: `test-user-1@example.com`
- **Default**: Uses seeded test user if not set
- **Required for**: E2E tests (optional - uses seed data if not provided)

### `E2E_TEST_PASSWORD`
- **Description**: Test user password for E2E tests
- **Format**: `password123`
- **Default**: Uses seeded test user password if not set
- **Required for**: E2E tests (optional - uses seed data if not provided)

## Recommended Setup: Separate Test Database

For safety, we recommend using a **separate Supabase project** for CI/CD testing:

1. Create a new Supabase project (e.g., "QR Generator - Test")
2. Apply all migrations to the test project
3. Use the test project's credentials in GitHub Secrets
4. This prevents test data from affecting your development/production database

### Setting Up Test Supabase Project

```bash
# 1. Create new Supabase project via dashboard
# 2. Get the project URL and keys
# 3. Apply migrations to test project
npm run apply-migrations  # Use test project credentials

# 4. Seed test data
npm run seed:dev  # Use test project credentials
```

## Verification

After setting up secrets, verify they work:

1. Push a commit or create a PR
2. Check the GitHub Actions tab
3. Verify all jobs pass (especially integration-tests and e2e-tests)
4. Check job logs for any authentication/connection errors

## Troubleshooting

### "Missing Supabase credentials" error
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Check that keys are copied correctly (no extra spaces)

### "Unauthorized" errors in tests
- Verify `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your deployment URL

### Payment tests failing
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
- Ensure you're using **test mode** keys (not production)
- Check Razorpay dashboard for test key status

### Storage tests failing
- Verify `qr-logos` bucket exists in Supabase Storage
- Check bucket permissions (should be public)
- Ensure service role key has storage access

## Security Best Practices

1. ✅ **Never commit secrets to code**
2. ✅ **Use separate test database for CI/CD**
3. ✅ **Rotate secrets periodically**
4. ✅ **Use test mode keys for payment gateway**
5. ✅ **Review GitHub Actions logs regularly**
6. ✅ **Limit access to repository secrets**

## Quick Setup Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- [ ] `SUPABASE_URL` - Supabase project URL (server-side)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `NEXTAUTH_SECRET` - NextAuth secret (generate new)
- [ ] `NEXTAUTH_URL` - Application base URL
- [ ] `RAZORPAY_KEY_ID` - Razorpay test key ID
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay test key secret
- [ ] (Optional) `E2E_TEST_EMAIL` - Test user email
- [ ] (Optional) `E2E_TEST_PASSWORD` - Test user password

## Need Help?

If you encounter issues:
1. Check GitHub Actions logs for specific error messages
2. Verify all secrets are set correctly
3. Ensure test database has migrations applied
4. Check Supabase/Razorpay dashboard for service status

