# QR Code Generator

A modern, full-featured QR code generator built with Next.js, TypeScript, and shadcn/ui. Create beautiful, customizable QR codes with logos, watermarks, and analytics tracking.

## Features

- 🎨 **Customizable QR Codes**: Change colors, dot styles, and corner styles
- 🖼️ **Logo Support**: Upload custom logos to embed in your QR codes
- 🏷️ **Watermarking**: Add BotrixAI watermark (can be toggled off)
- 📊 **Analytics Dashboard**: Track QR code usage and download statistics
- 🔐 **User Authentication**: Secure sign-up/sign-in with NextAuth.js
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- 🌙 **Dark Mode**: Built-in dark mode support with shadcn/ui
- 💾 **Download Options**: Export as PNG or SVG formats
- 🔒 **Route Protection**: Secure dashboard and user-specific data

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: NextAuth.js
- **Database**: SQLite with Prisma ORM
- **QR Generation**: qr-code-styling library
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qr_generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   
   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   GITHUB_CLIENT_ID=""
   GITHUB_CLIENT_SECRET=""
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### For Anonymous Users
- Visit the homepage to try the QR generator
- Create QR codes with basic customization
- Download as PNG or SVG

### For Registered Users
- Sign up for an account or sign in
- Access the full dashboard with analytics
- Save and manage all your QR codes
- Track download statistics
- View usage analytics

### QR Code Customization
- **URL/Text**: Enter any URL, UPI ID, or text
- **Colors**: Customize foreground and background colors
- **Styles**: Choose from different dot and corner styles
- **Logo**: Upload a custom logo to embed in the center
- **Watermark**: Toggle BotrixAI watermark on/off

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── qr-generator.tsx  # Main QR generator
│   ├── navigation.tsx    # Navigation bar
│   └── watermark.tsx     # Watermark component
├── lib/                  # Utility functions
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # General utilities
└── middleware.ts         # Route protection
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `GET /api/qr-codes` - Get user's QR codes
- `POST /api/qr-codes` - Create new QR code
- `GET /api/qr-codes/[id]` - Get specific QR code
- `DELETE /api/qr-codes/[id]` - Delete QR code

## Database Schema

The application uses SQLite with the following main models:

- **User**: User accounts with authentication
- **QrCode**: QR code data and settings
- **Account/Session**: NextAuth.js authentication tables

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and shadcn/ui