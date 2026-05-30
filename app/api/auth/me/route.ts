import { NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/jwt";
import { createSupabaseAdminClient } from "@/lib/supabase";

/**
 * GET /api/auth/me
 *
 * Protected route — returns the authenticated user's profile.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Verify access token (JWT cryptographic verification)
 * 3. Fetch user profile from Supabase
 * 4. Return user data
 */
export async function GET(request: Request) {
  try {
    // 1. Extract Bearer token
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing access token" },
        { status: 401 }
      );
    }

    // 2. Verify the access token (rejects refresh tokens)
    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired access token" },
        { status: 401 }
      );
    }

    const userId = payload.sub;

    // 3. Fetch user profile from Supabase
    const adminClient = createSupabaseAdminClient();

    type ProfileRow = {
      id: string;
      phone: string;
      login_method: string;
      created_at: string;
    };

    const { data: profile, error: profileError } = (await adminClient
      .from("profiles")
      .select("id, phone, login_method, created_at")
      .eq("id", userId)
      .single()) as { data: ProfileRow | null; error: { message: string } | null };

    if (profileError || !profile) {
      // User exists in auth but not in profiles — return basic info
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          role: payload.role,
        },
      });
    }

    // 4. Return user profile
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        phone: profile.phone,
        login_method: profile.login_method,
        created_at: profile.created_at,
        role: payload.role,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
