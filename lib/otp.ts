import { randomInt } from "crypto";
import { timingSafeEqual } from "crypto";
import { redis } from "./redis";

/**
 * Shape of the OTP data stored in Redis.
 */
export type StoredOTP = {
  otp: string;
  attempts: number;
  createdAt: number;
};

/** OTP TTL in seconds (5 minutes) */
const OTP_TTL_SECONDS = 300;

/** Maximum allowed failed verification attempts before OTP is invalidated */
const MAX_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt() — never Math.random().
 * Range: 100000 to 999999 (inclusive).
 */
export function generateOTP(): string {
  return randomInt(100_000, 1_000_000).toString();
}

/**
 * Store an OTP in Redis with a 5-minute TTL.
 * Key format: otp:{phone}
 */
export async function storeOTP(phone: string, otp: string): Promise<void> {
  const key = `otp:${phone}`;
  const data: StoredOTP = {
    otp,
    attempts: 0,
    createdAt: Date.now(),
  };

  await redis.set(key, JSON.stringify(data), { ex: OTP_TTL_SECONDS });
}

/**
 * Delete an OTP from Redis.
 * Used for:
 * - Successful verification (prevent reuse)
 * - Rollback on MSG91 failure
 * - Clearing old OTP before resend
 */
export async function deleteOTP(phone: string): Promise<void> {
  const key = `otp:${phone}`;
  await redis.del(key);
}

/**
 * Verify an OTP against the stored value in Redis.
 * 
 * Security measures:
 * - Uses crypto.timingSafeEqual() to prevent timing attacks
 * - Tracks failed attempts; invalidates OTP after MAX_ATTEMPTS
 * - Preserves remaining TTL on failed attempts
 * - Deletes OTP immediately on successful verification
 */
export async function verifyOTP(
  phone: string,
  inputOtp: string
): Promise<{ success: boolean; error?: string }> {
  const key = `otp:${phone}`;

  // 1. Fetch stored OTP from Redis
  const raw = await redis.get<string>(key);

  if (!raw) {
    // Generic error — don't reveal whether OTP expired or never existed
    return { success: false, error: "Invalid or expired OTP" };
  }

  const stored: StoredOTP = typeof raw === "string" ? JSON.parse(raw) : raw;

  // 2. Check if brute-force limit has been reached
  if (stored.attempts >= MAX_ATTEMPTS) {
    await redis.del(key);
    return {
      success: false,
      error: "Too many failed attempts. Please request a new OTP.",
    };
  }

  // 3. Timing-safe comparison to prevent timing attacks
  const storedBuffer = Buffer.from(stored.otp, "utf-8");
  const inputBuffer = Buffer.from(inputOtp, "utf-8");

  // timingSafeEqual requires equal-length buffers.
  // Since both are validated as 6-digit strings, they should always be 6 bytes.
  // But we guard against edge cases.
  const isMatch =
    storedBuffer.length === inputBuffer.length &&
    timingSafeEqual(storedBuffer, inputBuffer);

  if (!isMatch) {
    // 4. Increment attempt counter, preserving the remaining TTL
    stored.attempts += 1;
    const ttl = await redis.ttl(key);

    if (stored.attempts >= MAX_ATTEMPTS) {
      // Max attempts reached — invalidate the OTP entirely
      await redis.del(key);
      return {
        success: false,
        error: "Too many failed attempts. Please request a new OTP.",
      };
    }

    await redis.set(key, JSON.stringify(stored), {
      ex: ttl > 0 ? ttl : OTP_TTL_SECONDS,
    });

    return {
      success: false,
      error: "Invalid or expired OTP",
    };
  }

  // 5. OTP matches — delete immediately to prevent reuse
  await redis.del(key);

  return { success: true };
}
