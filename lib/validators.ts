import { z } from "zod";

/**
 * Phone number validation:
 * - Must be a string of exactly 12 digits
 * - Must start with "91" (Indian country code)
 */
export const phoneSchema = z
  .string()
  .regex(/^91\d{10}$/, "Phone must be 12 digits starting with 91");

/**
 * OTP validation:
 * - Must be a string of exactly 6 digits
 */
export const otpSchema = z
  .string()
  .regex(/^\d{6}$/, "OTP must be exactly 6 digits");

/**
 * Schema for POST /api/auth/otp/send and /api/auth/otp/resend
 */
export const SendOtpSchema = z.object({
  phone: phoneSchema,
});

/**
 * Schema for POST /api/auth/otp/verify
 */
export const VerifyOtpSchema = z.object({
  phone: phoneSchema,
  otp: otpSchema,
});

/**
 * Schema for POST /api/auth/refresh
 */
export const RefreshTokenSchema = z.object({
  refresh_token: z.string().min(1, "Refresh token is required"),
});

// Type exports for use in route handlers
export type SendOtpInput = z.infer<typeof SendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
