# 📦 Storage Bucket Setup Guide

This guide will help you set up the `qr-files` storage bucket in Supabase for file storage functionality.

---

## 🚀 **QUICK SETUP (5 Minutes)**

### **Step 1: Open Supabase Dashboard**

1. Go to: **https://supabase.com/dashboard**
2. Log in to your account
3. Click on your **QR Generator project**

---

### **Step 2: Open SQL Editor**

1. Look at the **left sidebar**
2. Click on **"SQL Editor"** (it has a `</>` icon)
   - Or go directly to: `https://supabase.com/dashboard/project/YOUR-PROJECT-REF/sql`

---

### **Step 3: Create New Query**

1. Click the **"+ New Query"** button (top right of the SQL Editor)

---

### **Step 4: Copy and Paste the SQL**

1. **Open the file** in your code editor:
   ```
   supabase-storage-files-setup.sql
   ```

2. **Copy ALL the content**:
   - Press `Ctrl+A` (or `Cmd+A` on Mac) to select all
   - Press `Ctrl+C` (or `Cmd+C` on Mac) to copy

3. **Paste into SQL Editor**:
   - Click in the SQL Editor text area
   - Press `Ctrl+V` (or `Cmd+V` on Mac) to paste

   You should see SQL that looks like this:
   ```sql
   -- Supabase Storage Setup for QR Code Files
   -- Run this in your Supabase SQL Editor
   
   -- Create storage bucket for QR code files
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('qr-files', 'qr-files', true)
   ON CONFLICT (id) DO NOTHING;
   
   -- Set up RLS policies for the bucket
   ...
   ```

---

### **Step 5: Run the SQL**

1. Click the **"RUN"** button (or press `Ctrl+Enter` / `Cmd+Enter`)

2. **Wait for success message**:
   ```
   ✅ Success. No rows returned
   ```
   or
   ```
   ✅ Success. Rows affected: 4
   ```

---

### **Step 6: Verify the Bucket Was Created**

1. In the Supabase dashboard, click **"Storage"** in the left sidebar
2. You should see a bucket named **"qr-files"** in the list
3. Click on it to verify it exists

---

## ✅ **VERIFICATION**

### **Method 1: Check in Storage Dashboard**

1. Go to **Storage** → **Buckets** in Supabase dashboard
2. Look for **"qr-files"** bucket
3. It should be marked as **"Public"**

### **Method 2: Run SQL Query**

In SQL Editor, run this query:

```sql
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'qr-files';
```

**Expected Result:**
- Should return 1 row with:
  - `id`: `qr-files`
  - `name`: `qr-files`
  - `public`: `true`

### **Method 3: Check Policies**

Run this query to verify RLS policies were created:

```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%QR files%';
```

**Expected Result:**
- Should return 4 rows (one for each policy: SELECT, INSERT, UPDATE, DELETE)

---

## 🔧 **TROUBLESHOOTING**

### **Error: "relation storage.buckets does not exist"**

**Solution:** This means you're using an older version of Supabase or the storage extension isn't enabled. Contact Supabase support or check your project settings.

### **Error: "permission denied for schema storage"**

**Solution:** Make sure you're running this as the database owner or with proper permissions. Try running it in the SQL Editor (which has elevated permissions).

### **Error: "duplicate key value violates unique constraint"**

**Solution:** The bucket already exists! This is fine - the `ON CONFLICT DO NOTHING` clause handles this. You can skip this step.

### **Bucket Created But Policies Failed**

**Solution:** If the bucket exists but policies failed, you can run just the policy creation part:

```sql
-- Only run these if bucket exists but policies are missing
CREATE POLICY "Public read access for QR files" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-files');

CREATE POLICY "Authenticated users can upload QR files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'qr-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own QR files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'qr-files' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own QR files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'qr-files' 
  AND auth.role() = 'authenticated'
);
```

---

## 📋 **WHAT THIS SETUP DOES**

1. **Creates Storage Bucket**: Creates a public bucket named `qr-files` for storing uploaded files
2. **Sets Up Security Policies**: 
   - Public read access (anyone can view/download files)
   - Authenticated users can upload files
   - Authenticated users can update their files
   - Authenticated users can delete their files

---

## 🎯 **NEXT STEPS**

After setting up the storage bucket:

1. ✅ **Run the database migration**: `migrations/20250112_me_qr_features.sql`
2. ✅ **Test file upload**: Try uploading a file via the API endpoint `/api/files`
3. ✅ **Verify storage quota**: Check that storage limits are enforced

---

## 💡 **ALTERNATIVE: Manual Setup via Dashboard**

If you prefer using the UI instead of SQL:

1. Go to **Storage** → **Buckets** in Supabase dashboard
2. Click **"New bucket"**
3. Enter:
   - **Name**: `qr-files`
   - **Public bucket**: ✅ Check this box
4. Click **"Create bucket"**
5. Then you still need to run the RLS policies SQL (the policy creation part)

**Note:** The SQL method is recommended as it sets up everything in one go.

---

## ✅ **SUCCESS INDICATORS**

You'll know it worked when:

- ✅ Bucket appears in Storage dashboard
- ✅ Bucket is marked as "Public"
- ✅ No errors in SQL Editor
- ✅ You can upload files via the API (after running the migration)

---

**That's it! Your storage bucket is now ready for file uploads.** 🎉

