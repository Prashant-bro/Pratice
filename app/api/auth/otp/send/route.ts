import { NextResponse } from "next/server";
import { SendOtpSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rateLimit";
import { generateOTP, storeOTP, deleteOTP } from "@/lib/otp";
import { sendOtpSMS } from "@/lib/msg91";

/**
 * POST /api/auth/otp/send
 *
 * Send a new OTP to the given phone number.
 *
 * Flow:
 * 1. Validate input (phone: 12 digits starting with 91)
 * 2. Check rate limit (max 3 per 10 minutes)
 * 3. Generate OTP (crypto.randomInt)
 * 4. Store in Redis (5-minute TTL)
 * 5. Send via MSG91 Flow API
 * 6. On MSG91 failure: rollback (delete OTP from Redis)
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

    // 2. Check rate limit
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

    // 3. Generate OTP (cryptographically secure)
    const otp = generateOTP();

    // 4. Store in Redis with 5-minute TTL
    await storeOTP(phone, otp);

    // 5. Send via MSG91 Flow API
    const sent = await sendOtpSMS(phone, otp);

    if (!sent) {
      // 6. Rollback — delete OTP from Redis since SMS wasn't delivered
      await deleteOTP(phone);

      return NextResponse.json(
        {
          success: false,
          error: "Failed to send OTP. Please try again.",
        },
        { status: 503 }
      );
    }

    // Never return the OTP value
    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
