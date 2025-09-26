import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req: any) {
    const user = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET
    });

    console.log("MIDDLEWARE USER:", user);

    const { pathname } = req.nextUrl;

    if (pathname.startsWith("/admin") && !user) {
        return NextResponse.redirect(new URL("/", req.url));
    }
    if (pathname === "/" && user) {
        return NextResponse.redirect(new URL("/admin", req.url));
    }
}