# Dynamic QR Code Features

This document outlines the comprehensive dynamic QR code functionality that has been added to your QR generator application.

## 🚀 Features Overview

### 1. Dynamic QR Code Generation
- **Static vs Dynamic**: Users can choose between static QR codes (fixed content) and dynamic QR codes (editable content)
- **Real-time Updates**: Dynamic QR codes can be updated without changing the physical QR code
- **JSON-based Content**: Flexible content structure using JSON format

### 2. Advanced Analytics & Tracking
- **Scan Analytics**: Track every scan with detailed information
- **Device Detection**: Identify mobile vs desktop users
- **Geographic Data**: Track country and city information
- **Real-time Dashboard**: Live analytics in the user dashboard

### 3. Control & Management
- **Expiration Dates**: Set automatic expiration for QR codes
- **Scan Limits**: Limit the number of times a QR code can be scanned
- **Activation Control**: Enable/disable QR codes without deletion
- **Redirect Management**: Custom redirect URLs for dynamic content

### 4. QR Code Scanning
- **Camera Integration**: Built-in QR code scanner using device camera
- **Real-time Detection**: Instant QR code recognition using jsQR library
- **Cross-platform**: Works on both mobile and desktop devices

## 📁 New Files Created

### API Endpoints
- `src/app/api/qr-codes/[id]/route.ts` - Individual QR code management (GET, PUT, DELETE)
- `src/app/api/qr-codes/[id]/scan/route.ts` - Scan tracking and analytics

### Components
- `src/components/dynamic-qr-manager.tsx` - Dynamic QR code management interface
- `src/components/qr-scanner.tsx` - QR code scanning component

### Pages
- `src/app/qr/[id]/page.tsx` - QR code redirect and analytics page
- `src/app/test-dynamic/page.tsx` - Testing and demonstration page

### Database
- `add-dynamic-qr-columns.sql` - Database migration for dynamic features

## 🗄️ Database Schema Updates

### QrCode Table Additions
```sql
-- New columns for dynamic functionality
"isDynamic" BOOLEAN DEFAULT false
"dynamicContent" JSONB
"scanCount" INTEGER DEFAULT 0
"lastScannedAt" TIMESTAMP WITH TIME ZONE
"isActive" BOOLEAN DEFAULT true
"expiresAt" TIMESTAMP WITH TIME ZONE
"maxScans" INTEGER
"redirectUrl" TEXT
```

### New QrCodeScan Table
```sql
-- Analytics tracking table
CREATE TABLE "QrCodeScan" (
    id TEXT PRIMARY KEY,
    "qrCodeId" TEXT REFERENCES "QrCode"(id),
    "scannedAt" TIMESTAMP WITH TIME ZONE,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "country" TEXT,
    "city" TEXT,
    "device" TEXT,
    "browser" TEXT,
    "os" TEXT
);
```

## 🎯 How It Works

### 1. Creating Dynamic QR Codes
1. User selects "Dynamic QR Code" option in the generator
2. Configures dynamic content (JSON format)
3. Sets optional parameters (expiration, scan limits, redirect URL)
4. QR code is generated with a unique ID
5. QR code points to `/qr/[id]` endpoint

### 2. Scanning Process
1. User scans QR code with any QR scanner
2. Redirected to `/qr/[id]` page
3. System records scan analytics
4. Checks QR code status (active, expired, scan limits)
5. Redirects to final destination or shows error

### 3. Content Updates
1. User accesses dashboard
2. Selects dynamic QR code to edit
3. Updates content, settings, or redirect URL
4. Changes take effect immediately
5. No need to regenerate QR code

## 🔧 API Endpoints

### QR Code Management
- `GET /api/qr-codes/[id]` - Get QR code details
- `PUT /api/qr-codes/[id]` - Update QR code
- `DELETE /api/qr-codes/[id]` - Delete QR code

### Analytics
- `POST /api/qr-codes/[id]/scan` - Record a scan
- `GET /api/qr-codes/[id]/scan` - Get analytics data

## 📱 User Interface Updates

### QR Generator
- **Tabbed Interface**: Basic, Dynamic, and Style tabs
- **Dynamic Options**: Toggle for dynamic QR codes
- **Advanced Settings**: Expiration dates, scan limits, redirect URLs
- **JSON Content Editor**: Textarea for dynamic content

### Dashboard
- **Dynamic QR Manager**: Special interface for dynamic QR codes
- **Analytics Display**: Real-time scan statistics
- **Status Indicators**: Active, expired, limit reached badges
- **Quick Actions**: Edit, copy link, view analytics, delete

### QR Scanner
- **Camera Integration**: Access device camera
- **Real-time Detection**: Instant QR code recognition
- **Result Display**: Shows scanned content
- **Action Buttons**: Copy, open link, etc.

## 🧪 Testing

### Test Page Features
- **QR Scanner**: Test the built-in scanner
- **Sample QR Codes**: Pre-configured examples
- **Feature Overview**: Comprehensive feature list
- **URL Testing**: Test dynamic QR code redirects

### Access Test Page
Navigate to `/test-dynamic` to access the testing interface.

## 🚀 Getting Started

### 1. Run Database Migration
Execute the SQL in `add-dynamic-qr-columns.sql` in your Supabase database.

### 2. Install Dependencies
```bash
npm install qrcode @types/qrcode qr-scanner jsqr
```

### 3. Test the Features
1. Go to the main QR generator
2. Switch to the "Dynamic" tab
3. Enable "Dynamic QR Code"
4. Configure your settings
5. Generate and test the QR code

## 💡 Use Cases

### Business Applications
- **Restaurant Menus**: Update daily specials without reprinting
- **Event Information**: Change details as events evolve
- **Product Catalogs**: Update prices and availability
- **Marketing Campaigns**: Track engagement and modify content

### Personal Use
- **Contact Information**: Update phone numbers or addresses
- **Social Media**: Change profile links
- **Event RSVPs**: Track attendance and send updates
- **Portfolio Links**: Update project showcases

## 🔒 Security Features

- **User Authentication**: Only authenticated users can create dynamic QR codes
- **Ownership Validation**: Users can only edit their own QR codes
- **Rate Limiting**: Built-in protection against abuse
- **Data Privacy**: Analytics data is user-specific

## 📊 Analytics Features

### Real-time Metrics
- Total scan count
- Unique devices
- Geographic distribution
- Device type breakdown
- Browser and OS statistics

### Historical Data
- Scan trends over time
- Peak usage periods
- Geographic heat maps
- Device preference analysis

## 🎨 Customization

### Dynamic Content Structure
```json
{
  "message": "Welcome to our store!",
  "action": "redirect",
  "url": "https://example.com",
  "metadata": {
    "campaign": "summer-sale",
    "version": "1.0"
  }
}
```

### Styling Options
- All existing QR code styling options
- Custom colors and patterns
- Logo integration
- Watermark support

## 🔄 Future Enhancements

### Planned Features
- **Webhook Integration**: Real-time notifications for scans
- **A/B Testing**: Multiple content versions
- **Scheduled Updates**: Time-based content changes
- **Bulk Management**: Manage multiple QR codes
- **Export Analytics**: Download scan data
- **Custom Domains**: Branded redirect URLs

## 📞 Support

For questions or issues with the dynamic QR code functionality:
1. Check the test page at `/test-dynamic`
2. Review the API documentation
3. Test with the built-in scanner
4. Check browser console for errors

## 🎉 Conclusion

The dynamic QR code functionality transforms your QR generator from a simple static tool into a powerful, flexible platform for content management and analytics. Users can now create QR codes that adapt to their needs, track engagement in real-time, and maintain control over their content without the need to regenerate physical codes.

This implementation provides a solid foundation for advanced QR code use cases while maintaining the simplicity and ease of use that users expect from your application.
