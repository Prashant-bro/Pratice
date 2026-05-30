import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Proxy for JWT-protected routes (Next.js 16 convention).
 *
 * In Next.js 16, Proxy defaults to the Node.js runtime (stable since v15.5).
 * This means we CAN use `jsonwebtoken` here if needed.
 *
 * However, we keep this lightweight — only checking for Authorization header
 * presence. The actual cryptographic JWT verification happens inside the
 * route handler for better error handling and response flexibility.
 */
export function proxy(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  if (!token || token.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // Token is present — let the route handler do cryptographic verification
  return NextResponse.next();
}

/**
 * Only apply this proxy to protected API routes.
 * Add more patterns here as you add more protected endpoints.
 */
export const config = {
  matcher: ["/api/auth/me"],
};
