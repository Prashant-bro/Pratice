import { NextResponse } from "next/server";
import { RefreshTokenSchema } from "@/lib/validators";
import { verifyRefreshToken, createSession } from "@/lib/jwt";

/**
 * POST /api/auth/refresh
 *
 * Exchange a valid refresh token for a new session (access + refresh tokens).
 *
 * Flow:
 * 1. Validate input (refresh_token)
 * 2. Verify the refresh token (must have type:"refresh" claim)
 * 3. Extract userId from token
 * 4. Sign new access + refresh tokens
 * 5. Return new session
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const parsed = RefreshTokenSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { refresh_token } = parsed.data;

    // 2. Verify the refresh token
    const payload = verifyRefreshToken(refresh_token);

    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired refresh token",
        },
        { status: 401 }
      );
    }

    // 3. Extract userId
    const userId = payload.sub;

    // 4. Sign new session tokens
    const session = createSession(userId);

    // 5. Return new session
    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
