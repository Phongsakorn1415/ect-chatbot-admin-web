import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          // Check if user exists
          // NOTE: Direct DB access is safer/more reliable than fetching an internal API route in Docker
          const prismaCtx = require("@/lib/database").db; // Lazy load if needed or use import

          const user = await prismaCtx.user.findUnique({
            where: {
              email: credentials?.email,
            },
          });

          if (!user) {
            return null;
          }

          // Check if password is set and matches
          if (!user.passwordHash) {
            return null;
          }

          const password = credentials?.password || "";
          const passwordMatch = await bcrypt.compare(
            password,
            user.passwordHash,
          );

          if (!passwordMatch) {
            return null;
          }

          // Return user object
          return {
            id: user.id,
            title: user.title ?? user.title,
            firstName: user.firstName ?? user.firstname ?? user.firstName,
            lastName: user.lastName ?? user.lastname ?? user.lastName,
            role: user.role,
          };
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // Store custom fields from `user` into the JWT at sign-in
    async jwt({ token, user }) {
      if (user) {
        // user comes from authorize() return value
        const u: any = user;
        token.id = u.id;
        token.title = u.title;
        token.firstName = u.firstName;
        token.lastName = u.lastName;
        token.role = u.role;
      }
      return token;
    },
    // Make those custom fields available on the client session
    async session({ session, token }) {
      if (token) {
        const t: any = token;
        // session.user is typed by next-auth; cast to any to attach custom props
        (session.user as any).id = t.id as string;
        (session.user as any).title = t.title as string;
        (session.user as any).firstName = t.firstName as string;
        (session.user as any).lastName = t.lastName as string;
        (session.user as any).role = t.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // หน้า login
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
