import { NextResponse } from "next/server";
import { VerifyOtpSchema } from "@/lib/validators";
import { verifyOTP } from "@/lib/otp";
import { createSession } from "@/lib/jwt";
import { createSupabaseAdminClient } from "@/lib/supabase";

/**
 * POST /api/auth/otp/verify
 *
 * Verify an OTP and create a session.
 *
 * Flow:
 * 1. Validate input (phone + OTP)
 * 2. Verify OTP against Redis (timing-safe, brute-force protected)
 * 3. Find or create user in Supabase
 * 4. Sign custom JWT (access + refresh tokens)
 * 5. Return session
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const parsed = VerifyOtpSchema.safeParse(body);

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

    const { phone, otp } = parsed.data;

    // 2. Verify OTP (timing-safe comparison, brute-force protection)
    const result = await verifyOTP(phone, otp);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    // 3. Find or create user in Supabase
    const userId = await findOrCreateUser(phone);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Failed to process account" },
        { status: 500 }
      );
    }

    // 4. Sign custom JWT session
    const session = createSession(userId);

    // 5. Return session (never return the OTP)
    return NextResponse.json({
      success: true,
      session,
      user: {
        id: userId,
        phone,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Find an existing user by phone, or create a new one.
 * Uses the Supabase admin client for privileged operations.
 *
 * @returns The user's UUID, or null on failure
 */
async function findOrCreateUser(phone: string): Promise<string | null> {
  const adminClient = createSupabaseAdminClient();

  // Check profiles table for existing user with this phone
  type ProfileRow = { id: string; phone: string };
  const { data: existingProfile } = (await adminClient
    .from("profiles")
    .select("id, phone")
    .eq("phone", phone)
    .single()) as { data: ProfileRow | null };

  if (existingProfile) {
    return existingProfile.id;
  }

  // Create a new Supabase auth user
  const dummyEmail = `${phone}@phone.user`;

  const { data: newUser, error: createError } =
    await adminClient.auth.admin.createUser({
      email: dummyEmail,
      email_confirm: true,
      phone: phone,
      phone_confirm: true,
      user_metadata: {
        phone: phone,
        login_method: "phone_otp",
      },
    });

  if (createError) {
    console.error("Error creating user:", createError);
    return null;
  }

  const userId = newUser.user.id;

  // Insert into profiles table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userId,
    phone: phone,
    login_method: "phone_otp",
    created_at: new Date().toISOString(),
  } as any);

  if (profileError) {
    // Non-fatal — user was still created in auth
    console.error("Error creating profile:", profileError);
  }

  return userId;
}
