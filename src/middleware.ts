import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req: any) {
  const user = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("MIDDLEWARE USER:", user);

  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && !user) {
    // เช็คคุ้กกี้ "was-logged-in" ที่เราสร้างขึ้นเองใน Admin Layout
    const wasLoggedIn = req.cookies.get("was-logged-in");

    if (wasLoggedIn) {
      return NextResponse.redirect(new URL("/?session=expired", req.url));
    } else {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // Register page access via invite token only
  if (pathname === "/register") {
    const url = req.nextUrl.clone();
    const token = url.searchParams.get("token");

    // If no token at all, bounce to home
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Validate token by calling internal API. If invalid, redirect home.
    // try {
    //   const validateUrl = new URL("/api/invite/accept", req.url);
    //   validateUrl.searchParams.set("token", token);
    //   const res = await fetch(validateUrl, { method: "GET" });
    //   if (!res.ok) {
    //     return NextResponse.redirect(new URL("/", req.url));
    //   }
    // } catch (e) {
    //   // On any error validating token, fail closed
    //   return NextResponse.redirect(new URL("/", req.url));
    // }
  }

  // Admin pages access control (Accounts and System Settings)
  if (user && user.role === "TEACHER") {
    if (
      pathname.startsWith("/admin/accounts") ||
      pathname.startsWith("/admin/other") ||
      pathname.startsWith("/admin/courses/late-fee") ||
      pathname.startsWith("/admin/reported-chat")
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
}
