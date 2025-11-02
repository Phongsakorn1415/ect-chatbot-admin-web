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

  //check if invite token is present for register page
  // if (pathname === "/register") {
  //   const url = req.nextUrl.clone();
  //   const token = url.searchParams.get("token");
  //   if (!token) {
  //     return NextResponse.redirect(new URL("/", req.url));
  //   }
  // }

  // Account management page access control
  if (pathname.startsWith("/admin/accounts") && !user) {
    return NextResponse.redirect(new URL("/", req.url));
  } else if (
    pathname.startsWith("/admin/accounts") &&
    user &&
    user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }
}
