import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react'

// Blog post data with full content
const blogPosts: Record<string, {
  title: string
  description: string
  date: string
  readTime: string
  category: string
  keywords: string[]
  content: string
}> = {
  'how-to-create-upi-qr-code-free': {
    title: 'How to Create UPI QR Code for Free in 2025 - Complete Guide',
    description: 'Learn how to create free UPI QR codes for payments. Step-by-step guide for Google Pay, PhonePe, Paytm, and BHIM UPI QR code generation.',
    date: '2025-11-27',
    readTime: '7 min',
    category: 'Tutorial',
    keywords: ['upi qr code', 'free upi qr code generator', 'google pay qr code', 'phonepe qr code', 'paytm qr code', 'bhim upi qr'],
    content: `
## What is a UPI QR Code?

A UPI (Unified Payments Interface) QR code is a scannable code that allows instant money transfers in India. When someone scans your UPI QR code with any UPI-enabled app like Google Pay, PhonePe, Paytm, or BHIM, they can instantly send money to your account.

## Why Create a UPI QR Code?

- **Instant Payments**: Receive payments in seconds
- **No Transaction Fees**: Most UPI transactions are free
- **Universal Compatibility**: Works with all UPI apps
- **Professional Look**: Great for businesses and freelancers
- **Contactless**: No need to share bank details

## Step-by-Step: Create Free UPI QR Code

### Step 1: Get Your UPI ID
Your UPI ID looks like: \`yourname@paytm\`, \`9876543210@ybl\`, or \`yourname@okicici\`

### Step 2: Use BotrixAI QR Generator
1. Go to [BotrixAI QR Generator](https://qr-generator.botrixai.com)
2. Click on the **"UPI"** tab
3. Enter your UPI ID
4. Add merchant name (optional)
5. Set amount (optional - leave blank for any amount)
6. Click **Generate**
7. Download your QR code

### Step 3: Test Your QR Code
- Open any UPI app on your phone
- Scan the QR code
- Verify the payment details are correct

## UPI QR Code Best Practices

1. **Always test** your QR code before sharing
2. **Print in high quality** for physical display
3. **Add your business name** for professional look
4. **Keep it visible** at payment counters
5. **Use dynamic QR codes** to track payments

## Supported UPI Apps

Your UPI QR code works with:
- Google Pay (GPay)
- PhonePe
- Paytm
- BHIM
- Amazon Pay
- WhatsApp Pay
- Bank apps (SBI, HDFC, ICICI, etc.)

## Conclusion

Creating a UPI QR code is free and takes less than 2 minutes with BotrixAI QR Generator. Start accepting digital payments today!

[Create Your Free UPI QR Code Now →](https://qr-generator.botrixai.com)
    `
  },
  'free-qr-code-generator-with-logo': {
    title: 'Free QR Code Generator with Logo - Add Your Brand in 2025',
    description: 'Create professional QR codes with your logo for free. Step-by-step guide to add custom logos, colors, and branding to your QR codes.',
    date: '2025-11-26',
    readTime: '6 min',
    category: 'Tutorial',
    keywords: ['qr code with logo', 'free qr code generator with logo', 'custom qr code', 'branded qr code', 'qr code maker with logo'],
    content: `
## Why Add a Logo to Your QR Code?

Adding your logo to a QR code makes it:
- **More recognizable** - People trust branded codes
- **Professional looking** - Great for business cards and marketing
- **Higher scan rates** - Branded codes get 30% more scans
- **Brand consistent** - Match your company identity

## How to Create QR Code with Logo (Free)

### Step 1: Prepare Your Logo
- Use PNG or SVG format
- Square logos work best
- Keep file size under 5MB
- Transparent background recommended

### Step 2: Generate Your QR Code
1. Visit [BotrixAI QR Generator](https://qr-generator.botrixai.com)
2. Enter your URL or text
3. Click **"Upload Logo"**
4. Select your logo file
5. Adjust colors to match your brand
6. Click **Generate**

### Step 3: Download & Use
- Download as PNG for web/print
- Download as SVG for scalable graphics

## Logo Placement Tips

- **Center placement** is most common
- Logo should be **20-30%** of QR code size
- Ensure **high contrast** between logo and QR code
- Test scannability after adding logo

## Color Customization

Match your brand colors:
- **Foreground**: Your primary brand color
- **Background**: White or light color (for scannability)
- Avoid low contrast combinations

## Best Practices

1. Always test your QR code after adding logo
2. Keep important QR code patterns visible
3. Use high-resolution logos
4. Maintain minimum quiet zone around QR code

## Examples of Branded QR Codes

- **Business cards**: Add company logo
- **Product packaging**: Brand logo + product URL
- **Marketing materials**: Campaign-specific branding
- **Social media**: Platform logos (Instagram, Facebook, etc.)

## Conclusion

Creating a QR code with your logo is free and easy with BotrixAI. Make your QR codes stand out and increase brand recognition!

[Create QR Code with Logo →](https://qr-generator.botrixai.com)
    `
  },
  'qr-code-for-business-cards': {
    title: 'QR Code for Business Cards - Complete Guide 2025',
    description: 'Learn how to create and use QR codes on business cards. Best practices, design tips, and what information to include.',
    date: '2025-11-25',
    readTime: '5 min',
    category: 'Business',
    keywords: ['qr code business card', 'vcard qr code', 'digital business card', 'business card qr code generator'],
    content: `
## Why Use QR Codes on Business Cards?

QR codes on business cards offer:
- **Instant contact saving** - One scan adds all details
- **More information** - Link to portfolio, LinkedIn, website
- **Modern impression** - Shows tech-savviness
- **Space saving** - No need to print every detail
- **Trackable** - Know who scanned your card

## What to Link in Your QR Code

### Option 1: vCard (Contact Information)
Includes: Name, phone, email, address, company, title

### Option 2: LinkedIn Profile
Direct link to your professional profile

### Option 3: Personal Website/Portfolio
Showcase your work and achievements

### Option 4: Digital Business Card
Interactive page with all your links

## How to Create Business Card QR Code

1. Go to [BotrixAI QR Generator](https://qr-generator.botrixai.com)
2. Enter your LinkedIn URL or website
3. Add your company logo
4. Choose colors matching your card design
5. Download high-resolution PNG/SVG
6. Send to your printer

## Design Tips

- **Size**: Minimum 2cm x 2cm (0.8 x 0.8 inches)
- **Placement**: Bottom right or back of card
- **Colors**: Match your card's color scheme
- **Quiet zone**: Leave white space around QR code

## Best Practices

1. **Test before printing** - Scan with multiple phones
2. **Use dynamic QR codes** - Update link without reprinting
3. **Add call-to-action** - "Scan to connect" text
4. **High contrast** - Ensure scannability
5. **Professional design** - Match your brand

## Common Mistakes to Avoid

- QR code too small
- Low contrast colors
- Linking to non-mobile-friendly pages
- No call-to-action
- Not testing before printing

## Conclusion

A QR code on your business card makes networking effortless. Create yours free with BotrixAI QR Generator!

[Create Business Card QR Code →](https://qr-generator.botrixai.com)
    `
  },
  'dynamic-vs-static-qr-codes': {
    title: 'Dynamic vs Static QR Codes: Which Should You Use in 2025?',
    description: 'Understand the differences between dynamic and static QR codes. Learn when to use each type and their pros and cons.',
    date: '2025-11-24',
    readTime: '4 min',
    category: 'Guide',
    keywords: ['dynamic qr code', 'static qr code', 'qr code types', 'editable qr code', 'trackable qr code'],
    content: `
## Static QR Codes

### What Are They?
Static QR codes contain fixed data that cannot be changed after creation.

### Pros
- ✅ Free to create
- ✅ Work forever
- ✅ No internet dependency
- ✅ Simple to create

### Cons
- ❌ Cannot be edited
- ❌ No tracking/analytics
- ❌ Must reprint if URL changes

### Best For
- Personal use
- Fixed information (WiFi passwords)
- One-time campaigns

## Dynamic QR Codes

### What Are They?
Dynamic QR codes link to a redirect URL that can be changed anytime.

### Pros
- ✅ Editable anytime
- ✅ Scan analytics (location, device, time)
- ✅ No reprinting needed
- ✅ A/B testing possible

### Cons
- ❌ Usually paid feature
- ❌ Requires internet
- ❌ Depends on service availability

### Best For
- Marketing campaigns
- Business use
- Long-term materials (packaging, signage)

## Comparison Table

| Feature | Static | Dynamic |
|---------|--------|---------|
| Editable | ❌ | ✅ |
| Analytics | ❌ | ✅ |
| Cost | Free | Often paid |
| Scan limit | Unlimited | Unlimited |
| Works offline | ✅ | ❌ |

## When to Use Each

### Use Static QR Codes For:
- WiFi network sharing
- Contact information (vCard)
- Personal projects
- Fixed URLs that won't change

### Use Dynamic QR Codes For:
- Marketing campaigns
- Product packaging
- Business cards (update contact info)
- Tracking engagement

## Create Both Types Free

BotrixAI QR Generator offers both static and dynamic QR codes. Start creating today!

[Create Your QR Code →](https://qr-generator.botrixai.com)
    `
  },
  'qr-code-size-guide': {
    title: 'QR Code Size Guide: Minimum Size for Printing & Scanning',
    description: 'Learn the optimal QR code sizes for different uses - business cards, posters, packaging, and digital displays.',
    date: '2025-11-23',
    readTime: '4 min',
    category: 'Guide',
    keywords: ['qr code size', 'qr code dimensions', 'minimum qr code size', 'qr code printing size'],
    content: `
## QR Code Size Basics

The minimum QR code size depends on:
1. **Scanning distance**
2. **Print quality**
3. **Data complexity**

## Minimum Sizes by Use Case

### Business Cards
- **Minimum**: 2cm x 2cm (0.8" x 0.8")
- **Recommended**: 2.5cm x 2.5cm (1" x 1")

### Flyers & Brochures
- **Minimum**: 2.5cm x 2.5cm
- **Recommended**: 3cm x 3cm

### Posters (A3/A2)
- **Minimum**: 5cm x 5cm
- **Recommended**: 8cm x 8cm

### Billboards
- Rule: 10:1 ratio (distance:size)
- 10 meters away = 1 meter QR code

### Product Packaging
- **Small products**: 1.5cm x 1.5cm minimum
- **Large products**: 3cm x 3cm recommended

### Digital Displays
- **Minimum**: 240 x 240 pixels
- **Recommended**: 300 x 300 pixels

## The 10:1 Rule

**Scanning distance ÷ 10 = Minimum QR code size**

Examples:
- 30cm away → 3cm QR code
- 1 meter away → 10cm QR code
- 5 meters away → 50cm QR code

## Tips for Better Scanning

1. **High contrast** - Dark on light background
2. **Quiet zone** - White border around QR code
3. **Print quality** - 300 DPI minimum
4. **Flat surface** - Avoid curved surfaces

## Download High-Resolution QR Codes

BotrixAI QR Generator offers:
- **Web quality**: 2x resolution
- **Print quality**: 4x resolution
- **Ultra HD**: 8x resolution

[Create High-Resolution QR Code →](https://qr-generator.botrixai.com)
    `
  },
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts[slug]

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post you are looking for does not exist.',
    }
  }

  return {
    title: `${post.title} | BotrixAI QR Generator Blog`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: ['BotrixAI'],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
    alternates: {
      canonical: `https://qr-generator.botrixai.com/blog/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(blogPosts).map((slug) => ({ slug }))
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = blogPosts[slug]

  if (!post) {
    notFound()
  }

  // Convert markdown-like content to HTML
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold mt-8 mb-4 text-gray-900">{line.replace('## ', '')}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold mt-6 mb-3 text-gray-800">{line.replace('### ', '')}</h3>
        }
        // List items
        if (line.startsWith('- ')) {
          return <li key={index} className="ml-4 text-gray-700">{line.replace('- ', '')}</li>
        }
        // Numbered list
        if (line.match(/^\d+\. /)) {
          return <li key={index} className="ml-4 text-gray-700 list-decimal">{line.replace(/^\d+\. /, '')}</li>
        }
        // Links
        if (line.includes('[') && line.includes('](')) {
          const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (linkMatch) {
            return (
              <p key={index} className="my-4">
                <Link href={linkMatch[2]} className="text-primary hover:underline font-medium">
                  {linkMatch[1]}
                </Link>
              </p>
            )
          }
        }
        // Table (simplified)
        if (line.startsWith('|')) {
          return null // Skip table formatting for now
        }
        // Empty lines
        if (line.trim() === '') {
          return <br key={index} />
        }
        // Regular paragraphs
        if (line.trim()) {
          return <p key={index} className="text-gray-700 leading-relaxed my-2">{line}</p>
        }
        return null
      })
      .filter(Boolean)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back button */}
        <Link href="/blog">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Header */}
        <header className="mb-8">
          <Badge className="mb-4">{post.category}</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          <p className="text-xl text-gray-600 mb-4">{post.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime} read
            </div>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none bg-white rounded-lg p-6 md:p-8 shadow-sm">
          {formatContent(post.content)}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Create Your QR Code?</h2>
          <p className="text-gray-600 mb-6">
            Generate beautiful, customizable QR codes for free with BotrixAI.
          </p>
          <Link href="/">
            <Button size="lg">
              Create Free QR Code
            </Button>
          </Link>
        </div>
      </article>
    </div>
  )
}

