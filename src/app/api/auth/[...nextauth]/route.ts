import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                try {
                    // เรียก API login ของคุณ (API ตอบเป็น { message, user })
                    const res = await fetch("http://localhost:3000/api/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: credentials?.email,
                            password: credentials?.password
                        })
                    })

                    const data = await res.json()

                    // API ของโปรเจคนี้คืนค่าเป็น { message, user }
                    const user = data?.user ?? null

                    if (res.ok && user) {
                        // คืนข้อมูล user ที่ต้องการเก็บใน session
                        return {
                            id: user.id,
                            title: user.title ?? user.title,
                            firstName: user.firstName ?? user.firstname ?? user.firstName,
                            lastName: user.lastName ?? user.lastname ?? user.lastName,
                            role: user.role
                        }
                    }

                    return null
                } catch (err) {
                    // ถ้ามีปัญหาในการเรียก API ให้ส่ง null เพื่อไม่ให้ NextAuth throw
                    console.error('Authorize error:', err)
                    return null
                }
            }
        })
    ],
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        // Store custom fields from `user` into the JWT at sign-in
        async jwt({ token, user }) {
            if (user) {
                // user comes from authorize() return value
                const u: any = user
                token.id = u.id
                token.title = u.title
                token.firstName = u.firstName
                token.lastName = u.lastName
                token.role = u.role
            }
            return token
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
            return session
        }
    },
    pages: {
        signIn: "/" // หน้า login
    }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };