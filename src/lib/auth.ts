import CredentialsProvider from "next-auth/providers/credentials"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

const jwtStrategy = "jwt" as const

export const authOptions = {
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
          .select('id, email, name, password, image')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password || "")

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    }),
  ],
  session: {
    strategy: jwtStrategy,
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: Record<string, unknown>; user?: any }) {
      if (user?.id) {
        token.id = user.id
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: any }) {
      if (token?.id) {
        if (!session.user) {
          session.user = {}
        }
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
}
