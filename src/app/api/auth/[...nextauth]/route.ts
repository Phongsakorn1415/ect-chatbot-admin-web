import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const authOptions = NextAuth({
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
        async jwt({ token, user }) {
            // เก็บ role ลงใน token ตอน login
            if (user) {
                token.id = user.id
                token.role = user.role
                token.name = `${user.title} ${user.firstName} ${user.lastName}`
            }
            return token
        },
        async session({ session, token }) {
            // ส่ง role ไปที่ client
            if (token) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.name = token.name as string
            }
            return session
        }
    },
    pages: {
        signIn: "/" // หน้า login
    }
})

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };