import CredentialsProvider from "next-auth/providers/credentials"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

const jwtStrategy = "jwt" as const

// Automatically detect the correct NEXTAUTH_URL based on environment
function getNextAuthUrl(): string {
  // In production (Vercel), use NEXTAUTH_URL if set, otherwise use VERCEL_URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXTAUTH_URL || 
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://qr-generator.botrixai.com')
  }
  
  // In development, always use localhost
  return process.env.NEXTAUTH_URL || 'http://localhost:3000'
}

export const authOptions = {
  // Set the base URL for NextAuth
  ...(process.env.NEXTAUTH_URL ? {} : { url: getNextAuthUrl() }),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        if (!supabaseAdmin) {
          return null
        }

        const { data: user, error } = await supabaseAdmin
          .from('User')
          .select('id, email, name, password, image, isActive, emailVerified')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          return null
        }

        // Check if user account is active
        if (user.isActive === false) {
          throw new Error('Account is deactivated')
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "")

        if (!isPasswordValid) {
          return null
        }

        // Update last login timestamp
        await supabaseAdmin
          .from('User')
          .update({ lastLoginAt: new Date().toISOString() })
          .eq('id', user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
        }
      }
    }),
  ],
  session: {
    strategy: jwtStrategy,
    // Session expires after 30 days
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    // Refresh session every 24 hours to extend expiry
    updateAge: 24 * 60 * 60, // 24 hours in seconds
  },
  jwt: {
    // JWT expires after 30 days
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, trigger }: { token: Record<string, unknown>; user?: any; trigger?: string }) {
      // Initial sign in
      if (user?.id) {
        token.id = user.id
        token.email = user.email
        token.emailVerified = user.emailVerified
        token.createdAt = Date.now()
      }

      // Token rotation: Check if token needs refresh
      const tokenAge = Date.now() - (token.createdAt as number || 0)
      const dayInMs = 24 * 60 * 60 * 1000

      // Rotate token every 7 days for enhanced security
      if (tokenAge > 7 * dayInMs) {
        token.createdAt = Date.now()
        token.rotatedAt = Date.now()
      }

      // Validate token hasn't expired
      const maxAge = 30 * dayInMs // 30 days
      if (tokenAge > maxAge) {
        throw new Error('Token expired')
      }

      // On update trigger, refresh user data
      if (trigger === 'update' && token.id) {
        const { data: user } = await supabaseAdmin!
          .from('User')
          .select('id, email, name, image, isActive, emailVerified')
          .eq('id', token.id as string)
          .single()

        if (user) {
          token.email = user.email
          token.name = user.name
          token.image = user.image
          token.emailVerified = user.emailVerified
          
          // Check if account is still active
          if (user.isActive === false) {
            throw new Error('Account deactivated')
          }
        }
      }

      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      // Validate token is still valid
      const tokenAge = Date.now() - (token.createdAt as number || 0)
      const maxAge = 30 * 24 * 60 * 60 * 1000

      if (tokenAge > maxAge) {
        throw new Error('Session expired')
      }

      if (token?.id) {
        if (!session.user) {
          session.user = {}
        }
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        session.user.emailVerified = token.emailVerified as string | null
      }

      // Add session metadata
      session.createdAt = token.createdAt
      session.rotatedAt = token.rotatedAt

      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  // Enhanced security options
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
}
