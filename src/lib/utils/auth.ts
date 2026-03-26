import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Helper to require authentication and optionally specific roles in API routes.
 * 
 * @param allowedRoles Optional array of roles allowed to access the route.
 * @returns An object containing either the session or an error NextResponse.
 */
export async function requireAuth(allowedRoles?: string[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized: Please log in" },
        { status: 401 }
      ),
    };
  }

  const user = session.user as any;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { message: `Forbidden: ${user.role} does not have access` },
        { status: 403 }
      ),
    };
  }

  return { session };
}
