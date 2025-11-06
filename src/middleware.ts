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
    return NextResponse.redirect(new URL("/", req.url));
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
    try {
      const validateUrl = new URL("/api/invite/accept", req.url);
      validateUrl.searchParams.set("token", token);
      const res = await fetch(validateUrl, { method: "GET" });
      if (!res.ok) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (e) {
      // On any error validating token, fail closed
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Account management page access control
  if (pathname.startsWith("/admin/accounts") && !user) {
    return NextResponse.redirect(new URL("/", req.url));
  } else if (
    pathname.startsWith("/admin/accounts") &&
    user &&
    user.role == "TEACHER"
  ) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
}
