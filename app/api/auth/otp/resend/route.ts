import { NextResponse } from "next/server";
import { SendOtpSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateOTP, storeOTP, deleteOTP } from "@/lib/otp";
import { sendOtpSMS } from "@/lib/msg91";

/**
 * POST /api/auth/otp/resend
 *
 * Resend an OTP to the given phone number.
 * Invalidates any existing OTP before generating a new one.
 *
 * Flow:
 * 1. Validate input (phone)
 * 2. Check rate limit (shared with /send — max 3 per 10 min)
 * 3. Delete any existing OTP (invalidate old one)
 * 4. Generate new OTP
 * 5. Store in Redis
 * 6. Send via MSG91
 * 7. Rollback on MSG91 failure
 */
export async function POST(request: Request) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const parsed = SendOtpSchema.safeParse(body);

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

    const { phone } = parsed.data;

    // 2. Check rate limit (same counter as /send)
    const rateCheck = await checkRateLimit(phone);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many OTP requests. Please try again later.",
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // 3. Delete any existing OTP (prevents confusion with old code)
    await deleteOTP(phone);

    // 4. Generate new OTP
    const otp = generateOTP();

    // 5. Store in Redis with 5-minute TTL
    await storeOTP(phone, otp);

    // 6. Send via MSG91 Flow API
    const sent = await sendOtpSMS(phone, otp);

    if (!sent) {
      // 7. Rollback — delete OTP since SMS wasn't delivered
      await deleteOTP(phone);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to send OTP. Please try again.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
