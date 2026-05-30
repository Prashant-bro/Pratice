import { redis } from "./redis";

/** Maximum OTP requests allowed per phone in the rate limit window */
const MAX_REQUESTS = 3;

/** Rate limit window in seconds (10 minutes) */
const WINDOW_SECONDS = 600;

/**
 * Check if a phone number is rate-limited for OTP requests.
 *
 * Uses a simple counter in Redis with a 10-minute TTL.
 * Key format: rate:otp:{phone}
 *
 * @returns allowed: true if under the limit, false if rate-limited
 * @returns retryAfterSeconds: seconds until the rate limit resets (only when blocked)
 */
export async function checkRateLimit(phone: string): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
}> {
  const key = `rate:otp:${phone}`;

  // Increment the counter. If the key doesn't exist, Redis creates it with value 1.
  const current = await redis.incr(key);

  // Set the TTL only on the first request (when counter is 1).
  // This establishes the 10-minute window.
  if (current === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  if (current > MAX_REQUESTS) {
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      retryAfterSeconds: ttl > 0 ? ttl : WINDOW_SECONDS,
    };
  }

  return { allowed: true };
}
