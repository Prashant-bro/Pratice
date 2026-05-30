import { Redis } from "@upstash/redis";

/**
 * Upstash Redis client singleton.
 * Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment.
 * Used for OTP storage, rate limiting, and attempt tracking.
 */
export const redis = Redis.fromEnv();
