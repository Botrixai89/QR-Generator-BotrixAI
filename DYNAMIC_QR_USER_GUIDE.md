# 🚀 Dynamic QR Code User Guide

Welcome to the comprehensive guide for using Dynamic QR Codes on our platform! This guide will walk you through everything you need to know to create, manage, and use dynamic QR codes effectively.

## 📋 Table of Contents

1. [What are Dynamic QR Codes?](#what-are-dynamic-qr-codes)
2. [Getting Started](#getting-started)
3. [Creating Your First Dynamic QR Code](#creating-your-first-dynamic-qr-code)
4. [Managing Dynamic QR Codes](#managing-dynamic-qr-codes)
5. [Understanding Analytics](#understanding-analytics)
6. [Testing Your QR Codes](#testing-your-qr-codes)
7. [Use Cases & Examples](#use-cases--examples)
8. [Troubleshooting](#troubleshooting)

---

## 🤔 What are Dynamic QR Codes?

Dynamic QR codes are special QR codes that allow you to **update their content without changing the physical QR code**. Unlike static QR codes that contain fixed information, dynamic QR codes:

- ✅ **Update content in real-time** without reprinting
- ✅ **Track analytics** - see who scans, when, and from where
- ✅ **Set expiration dates** and scan limits
- ✅ **Redirect to different URLs** based on your needs
- ✅ **Store flexible JSON data** for complex use cases

---

## 🚀 Getting Started

### Prerequisites
- ✅ User account (sign up if you haven't already)
- ✅ Access to the QR Generator
- ✅ Basic understanding of URLs and web content

### Access Points
1. **Main Generator**: Go to the homepage and use the QR Generator
2. **Dashboard**: Access your saved QR codes at `/dashboard`
3. **Test Page**: Try out features at `/test-dynamic`

---

## 🎯 Creating Your First Dynamic QR Code

### Step 1: Access the Generator
1. Go to the homepage (`/`)
2. You'll see the QR Code Generator interface
3. Notice the **three tabs**: Basic, Dynamic, and Style

### Step 2: Configure Basic Settings
1. **Basic Tab**:
   - Enter your **URL or text** (e.g., `https://example.com`)
   - Add a **title** (e.g., "My Restaurant Menu")
   - Upload a **logo** (optional)
   - Toggle **watermark** on/off

### Step 3: Enable Dynamic Features
1. Click the **"Dynamic" tab**
2. Toggle **"Dynamic QR Code"** to ON
3. You'll see additional options appear:

#### Dynamic Content (JSON)
```json
{
  "message": "Welcome to our restaurant!",
  "action": "redirect",
  "url": "https://example.com/menu",
  "metadata": {
    "campaign": "summer-2024",
    "version": "1.0"
  }
}
```

#### Redirect URL
- This is where users go when they scan the QR code
- Can be different from the original URL
- Example: `https://example.com/special-offer`

#### Expiration Date (Optional)
- Set when the QR code should stop working
- Format: Date and time
- Example: `2024-12-31 23:59`

#### Maximum Scans (Optional)
- Limit how many times the QR code can be scanned
- Example: `1000` scans

### Step 4: Style Your QR Code
1. Click the **"Style" tab**
2. Choose **colors** (foreground and background)
3. Select **dot style** (square, rounded, etc.)
4. Pick **corner style**

### Step 5: Generate
1. Click **"Generate QR Code"**
2. Your dynamic QR code will be created and saved
3. You can download it as PNG or SVG

---

## 📊 Managing Dynamic QR Codes

### Accessing Your QR Codes
1. Go to **Dashboard** (`/dashboard`)
2. You'll see all your QR codes listed
3. **Dynamic QR codes** have special management interfaces

### Dynamic QR Code Management Features

#### 🎛️ Quick Actions
- **Copy Link**: Get the QR code URL to share
- **Preview**: See how the QR code looks when scanned
- **Analytics**: View detailed scan statistics
- **Edit**: Modify content and settings
- **Delete**: Remove the QR code

#### 📈 Real-time Analytics
- **Total Scans**: How many times it's been scanned
- **Unique Devices**: Number of different devices
- **Countries/Cities**: Geographic distribution
- **Device Types**: Mobile vs Desktop breakdown
- **Recent Scans**: Latest scan activity

#### ⚙️ Edit Options
When you click **"Edit"**, you can modify:
- **Title**: Change the QR code name
- **URL**: Update the original URL
- **Redirect URL**: Change where users go
- **Dynamic Content**: Update the JSON data
- **Expiration Date**: Extend or change expiration
- **Max Scans**: Adjust scan limits
- **Active Status**: Enable/disable the QR code

---

## 📊 Understanding Analytics

### Analytics Dashboard
Each dynamic QR code shows:

#### 📊 Overview Stats
```
Total Scans: 1,247
Unique Devices: 892
Countries: 15
Cities: 47
```

#### 📱 Device Breakdown
- **Mobile**: 65% (810 scans)
- **Desktop**: 35% (437 scans)

#### 🌍 Geographic Data
- **Top Countries**: USA (45%), Canada (20%), UK (15%)
- **Top Cities**: New York (120), Toronto (89), London (67)

#### 📅 Time-based Data
- **Scans by Date**: See daily/weekly trends
- **Peak Hours**: When most scans happen
- **Last Scanned**: Most recent activity

### Using Analytics Data
- **Marketing**: See which campaigns work best
- **Geographic**: Understand your audience location
- **Timing**: Optimize when to promote your QR codes
- **Engagement**: Track user behavior patterns

---

## 🧪 Testing Your QR Codes

### Built-in QR Scanner
1. Go to **Test Dynamic QR** (`/test-dynamic`)
2. Click **"Open Scanner"**
3. Allow camera access
4. Point camera at any QR code
5. See instant results

### Testing Your Dynamic QR Codes
1. **Copy the QR code link** from your dashboard
2. **Paste it in the test URL field**
3. Click **"Test QR Code"**
4. See the redirect and analytics in action

### Sample QR Codes
The test page includes example QR codes for:
- **Restaurant Menu**: Dynamic menu updates
- **Event Information**: Time-based content
- **Product Information**: Inventory tracking

---

## 💡 Use Cases & Examples

### 🍽️ Restaurant Business
**Scenario**: Daily menu updates
```json
{
  "message": "Today's Special: Grilled Salmon",
  "action": "redirect",
  "url": "https://restaurant.com/todays-menu",
  "metadata": {
    "date": "2024-01-15",
    "special": "grilled-salmon"
  }
}
```

### 🎪 Event Management
**Scenario**: Event details that change
```json
{
  "message": "Welcome to Tech Conference 2024",
  "action": "redirect", 
  "url": "https://event.com/schedule",
  "metadata": {
    "event": "tech-conference-2024",
    "day": "day-1",
    "room": "main-hall"
  }
}
```

### 🛍️ E-commerce
**Scenario**: Product information with inventory
```json
{
  "message": "Check product availability",
  "action": "redirect",
  "url": "https://store.com/product/123",
  "metadata": {
    "product_id": "123",
    "in_stock": true,
    "price": "$29.99"
  }
}
```

### 📱 Contact Information
**Scenario**: Updateable contact details
```json
{
  "message": "Contact John Doe",
  "action": "redirect",
  "url": "https://contact.com/john-doe",
  "metadata": {
    "phone": "+1-555-0123",
    "email": "john@example.com",
    "last_updated": "2024-01-15"
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ QR Code Not Working
**Possible Causes**:
- QR code is expired
- Scan limit reached
- QR code is deactivated
- Invalid redirect URL

**Solutions**:
1. Check QR code status in dashboard
2. Verify expiration date
3. Check scan count vs. limit
4. Ensure redirect URL is valid

#### ❌ Analytics Not Showing
**Possible Causes**:
- No scans yet
- Browser blocking analytics
- Network issues

**Solutions**:
1. Wait for first scan
2. Check browser permissions
3. Test with built-in scanner

#### ❌ Camera Not Working (Scanner)
**Possible Causes**:
- Camera permission denied
- Browser not supported
- Hardware issues

**Solutions**:
1. Allow camera access
2. Try different browser
3. Check camera hardware

### Getting Help

#### 📞 Support Channels
1. **Test Page**: Try features at `/test-dynamic`
2. **Dashboard**: Check QR code status
3. **Browser Console**: Look for error messages
4. **Documentation**: Refer to this guide

#### 🔍 Debug Steps
1. **Check QR Code Status**: Active, expired, or limit reached?
2. **Verify URLs**: Are redirect URLs working?
3. **Test Scanner**: Use built-in scanner to test
4. **Check Analytics**: Are scans being recorded?

---

## 🎉 Best Practices

### ✅ Do's
- **Use descriptive titles** for easy identification
- **Set reasonable expiration dates** for time-sensitive content
- **Monitor analytics** to understand user behavior
- **Test your QR codes** before deploying
- **Keep redirect URLs updated** and working
- **Use meaningful JSON structure** for dynamic content

### ❌ Don'ts
- **Don't use overly complex JSON** that's hard to maintain
- **Don't set unrealistic scan limits** unless necessary
- **Don't forget to test** after making changes
- **Don't ignore analytics** - they provide valuable insights
- **Don't use broken redirect URLs**

---

## 🚀 Advanced Features

### JSON Content Structure
```json
{
  "version": "1.0",
  "type": "redirect",
  "data": {
    "url": "https://example.com",
    "title": "Page Title",
    "description": "Page description"
  },
  "analytics": {
    "campaign": "summer-2024",
    "source": "qr-code",
    "medium": "print"
  },
  "conditional": {
    "time_based": true,
    "user_type": "visitor"
  }
}
```

### API Integration
You can update dynamic QR codes programmatically:
```javascript
// Update QR code content
fetch('/api/qr-codes/your-qr-id', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dynamicContent: { message: "Updated content" },
    redirectUrl: "https://new-url.com"
  })
})
```

---

## 📚 Additional Resources

### 🔗 Quick Links
- **Main Generator**: `/` - Create new QR codes
- **Dashboard**: `/dashboard` - Manage existing QR codes  
- **Test Page**: `/test-dynamic` - Test and learn features
- **Documentation**: This guide and `DYNAMIC_QR_FEATURES.md`

### 📖 Related Documentation
- `DYNAMIC_QR_FEATURES.md` - Technical implementation details
- `README.md` - General project information
- API documentation in the codebase

---

## 🎯 Conclusion

Dynamic QR codes are a powerful tool for modern businesses and individuals. They provide flexibility, analytics, and control that static QR codes simply cannot match. 

**Key Takeaways**:
- ✅ Dynamic QR codes can be updated without reprinting
- ✅ Analytics provide valuable insights into user behavior
- ✅ Control features like expiration and scan limits add security
- ✅ JSON-based content allows for complex, flexible data structures
- ✅ Built-in testing tools help ensure everything works correctly

Start with simple use cases and gradually explore more advanced features as you become comfortable with the platform. The test page is your best friend for learning and experimenting!

**Happy QR Code Creating!** 🎉
