import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getUserRepository } from "./repositories"
import bcrypt from "bcryptjs"
import { isSuccess, isFailure } from "./result"

export const authOptions: NextAuthOptions = {
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

        const userRepository = getUserRepository()
        const userResult = await userRepository.findByEmail(credentials.email)

        if (isFailure(userResult) || !userResult.data) {
          return null
        }

        const user = userResult.data

        // Check if user has a password (registered via signup) or use demo mode
        if (user.password) {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) return null
        } else {
          // Demo mode: accept any password for users without hashed password
          // (created via seed or manual database entry)
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
