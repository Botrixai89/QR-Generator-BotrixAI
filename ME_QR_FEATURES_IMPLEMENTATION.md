# ME-QR-like Features Implementation

This document describes the ME-QR-like functionality that has been added to the QR generator application, following the ME-QR model but using your existing pricing structure.

## 🎯 Features Implemented

### 1. Ad System for Free Plan Users
- **Ad Display**: Free plan users' QR codes show ads to scanners before accessing content
- **Ad Tracking**: Tracks ad impressions and displays for analytics
- **Ad Removal**: Paid plans (FLEX, PRO, BUSINESS) can remove ads from their QR codes
- **Implementation**:
  - `src/components/qr-ad-display.tsx` - Ad display component
  - `src/app/api/qr-codes/[id]/ad-view/route.ts` - Ad view tracking endpoint
  - Updated scan endpoint to check plan and show ads accordingly

### 2. Folder Organization
- **Folders**: Organize QR codes into folders for better management
- **Nested Folders**: Support for subfolders (parent-child relationships)
- **Folder Management**: Create, update, delete, and list folders
- **Implementation**:
  - `migrations/20250112_me_qr_features.sql` - Database schema
  - `src/app/api/folders/route.ts` - Folder CRUD operations
  - `src/app/api/folders/[id]/route.ts` - Individual folder operations
  - Updated QR code creation to support folder assignment

### 3. File Storage
- **File Upload**: Upload files (PDFs, images, documents) linked to QR codes
- **Storage Quotas**: Plan-based storage limits:
  - FREE: 100 MB
  - FLEX: 250 MB
  - PRO: 500 MB
  - BUSINESS: 2000 MB
- **File Management**: Upload, list, and delete files
- **QR Code Linking**: Link QR codes to uploaded files
- **Implementation**:
  - `migrations/20250112_me_qr_features.sql` - Database schema
  - `src/app/api/files/route.ts` - File upload and listing
  - `src/app/api/files/[id]/route.ts` - Individual file operations
  - `supabase-storage-files-setup.sql` - Storage bucket setup
  - Database functions for storage quota checking

### 4. Plan Entitlements Updates
- **removeAdsAllowed**: New entitlement to control ad removal
- **fileStorageMB**: Storage quota per plan
- Updated all plans with new entitlements

## 📁 Database Schema

### New Tables

#### QrCodeFolder
- Stores folder information for organizing QR codes
- Supports nested folder structure via `parentFolderId`
- Includes color coding for UI customization

#### QrCodeFile
- Stores file metadata for uploaded files
- Links to QR codes via `qrCodeId`
- Tracks file size, type, and storage path

#### QrCodeAdView
- Tracks ad impressions when users scan QR codes
- Records ad type, provider, and potential revenue
- Used for analytics and monetization

### Updated Tables

#### QrCode
- Added `folderId` - Links QR code to a folder
- Added `fileId` - Links QR code to an uploaded file
- Added `showAds` - Controls whether ads are shown (default: true)
- Added `adDisplayCount` - Tracks number of ad displays

## 🔧 API Endpoints

### Folders
- `GET /api/folders` - List all folders
- `POST /api/folders` - Create a folder
- `GET /api/folders/[id]` - Get folder details
- `PUT /api/folders/[id]` - Update folder
- `DELETE /api/folders/[id]` - Delete folder

### Files
- `GET /api/files` - List all files (with storage usage)
- `POST /api/files` - Upload a file
- `GET /api/files/[id]` - Get file details
- `DELETE /api/files/[id]` - Delete a file

### Ad Tracking
- `POST /api/qr-codes/[id]/ad-view` - Record an ad view

### Updated Endpoints
- `POST /api/qr-codes` - Now supports `folderId` and `fileId` parameters
- `POST /api/qr-codes/[id]/scan` - Returns `showAds` flag based on plan

## 🚀 How It Works

### Ad Display Flow
1. User scans a QR code created by a free plan user
2. Scan endpoint checks the QR code owner's plan
3. If plan doesn't have `removeAdsAllowed`, `showAds: true` is returned
4. Frontend displays ad component before redirecting
5. Ad view is recorded for analytics
6. User continues to content after ad

### Folder Organization
1. Users create folders via API or UI
2. When creating QR codes, users can assign them to folders
3. QR codes can be filtered and organized by folder
4. Folders can be nested for hierarchical organization

### File Storage
1. Users upload files via the file API
2. System checks storage quota before allowing upload
3. Files are stored in Supabase Storage bucket `qr-files`
4. QR codes can be linked to files, using file URL as QR destination
5. Storage usage is tracked and enforced per plan

## 📋 Migration Steps

1. **Run Database Migration**:
   ```sql
   -- Run migrations/20250112_me_qr_features.sql
   ```

2. **Setup Storage Bucket**:
   ```sql
   -- Run supabase-storage-files-setup.sql
   ```

3. **Update Environment Variables** (if needed):
   - Ensure Supabase storage is configured
   - Verify storage bucket permissions

## 🎨 UI Integration (To Be Implemented)

The following UI components need to be created/updated:

1. **Folder Management UI**:
   - Folder list view
   - Create/edit folder dialog
   - Folder selection in QR code creation

2. **File Management UI**:
   - File upload component
   - File list view
   - Storage usage indicator
   - File selection in QR code creation

3. **Ad Settings UI**:
   - Toggle ad display per QR code (for paid plans)
   - Ad analytics dashboard

## 🔒 Security & Permissions

- All folder and file operations are protected by authentication
- Row Level Security (RLS) policies ensure users can only access their own resources
- Storage quota is enforced at the database level
- File uploads are validated for size and type

## 📊 Analytics

- Ad views are tracked in `QrCodeAdView` table
- Storage usage is calculated via database function
- Ad display count is maintained per QR code

## 🎯 Key Differences from ME-QR

1. **Pricing**: Uses your existing pricing structure (FREE, FLEX, PRO, BUSINESS)
2. **Storage Limits**: Customized to your plan structure
3. **Ad Implementation**: Custom ad system (can be integrated with ad networks later)
4. **File Storage**: Integrated with Supabase Storage instead of custom solution

## 🔄 Next Steps

1. Create UI components for folder and file management
2. Integrate with ad networks (Google AdSense, etc.) for actual ad serving
3. Add bulk operations for folders (move multiple QR codes)
4. Add file preview functionality
5. Implement QR code samples/templates library

