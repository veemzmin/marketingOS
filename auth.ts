import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { basePrisma } from "@/lib/db/client"
import { comparePassword } from "@/lib/auth/password"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const password = credentials.password as string

        // Check if this is a 2FA bypass (after successful TOTP verification)
        if (password.startsWith("2fa-bypass-")) {
          const userId = password.replace("2fa-bypass-", "")

          // Find user by ID and verify 2FA is enabled
          const user = await basePrisma.user.findUnique({
            where: { id: userId },
          })

          if (!user || !user.totpEnabled) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        }

        // Normal authentication flow
        // Find user by email
        const user = await basePrisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          return null
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Email not verified")
        }

        // Verify password
        const isValid = await comparePassword(
          password,
          user.passwordHash
        )

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
})
