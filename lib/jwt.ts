import jwt from "jsonwebtoken";

/**
 * JWT utilities for the Diapredix auth system.
 *
 * Signs tokens with SUPABASE_JWT_SECRET using HS256.
 * Tokens are structured so Supabase trusts them for RLS
 * (same secret, same claims structure).
 */

function getJwtSecret(): string {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("Missing SUPABASE_JWT_SECRET environment variable");
  }
  return secret;
}

function getIssuer(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }
  return `${supabaseUrl}/auth/v1`;
}

// ----- Token Payloads -----

interface AccessTokenPayload {
  sub: string;
  role: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload extends AccessTokenPayload {
  type: "refresh";
}

// ----- Sign Tokens -----

/**
 * Sign an access token.
 * - Expires in 1 hour
 * - Claims: sub, role, aud, iss, iat, exp
 */
export function signAccessToken(userId: string): string {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);

  const payload: AccessTokenPayload = {
    sub: userId,
    role: "authenticated",
    aud: "authenticated",
    iss: getIssuer(),
    iat: now,
    exp: now + 3600, // 1 hour
  };

  return jwt.sign(payload, secret, { algorithm: "HS256" });
}

/**
 * Sign a refresh token.
 * - Expires in 7 days
 * - Has type:"refresh" claim to distinguish from access tokens
 */
export function signRefreshToken(userId: string): string {
  const secret = getJwtSecret();
  const now = Math.floor(Date.now() / 1000);

  const payload: RefreshTokenPayload = {
    sub: userId,
    role: "authenticated",
    aud: "authenticated",
    iss: getIssuer(),
    iat: now,
    exp: now + 604800, // 7 days
    type: "refresh",
  };

  return jwt.sign(payload, secret, { algorithm: "HS256" });
}

// ----- Verify Tokens -----

/**
 * Verify an access token.
 * Rejects tokens that have type:"refresh" — refresh tokens
 * must not be usable as access tokens.
 *
 * @returns The decoded payload, or null if invalid/expired
 */
export function verifyAccessToken(
  token: string
): AccessTokenPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as AccessTokenPayload & { type?: string };

    // Reject refresh tokens used as access tokens
    if (decoded.type === "refresh") {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token.
 * Only accepts tokens with type:"refresh" claim.
 *
 * @returns The decoded payload, or null if invalid/expired
 */
export function verifyRefreshToken(
  token: string
): RefreshTokenPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    }) as RefreshTokenPayload;

    // Must have type:"refresh" claim
    if (decoded.type !== "refresh") {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}

// ----- Session Helper -----

/**
 * Create a full session (access + refresh tokens) for a user.
 */
export function createSession(userId: string): {
  access_token: string;
  refresh_token: string;
  expires_in: number;
} {
  return {
    access_token: signAccessToken(userId),
    refresh_token: signRefreshToken(userId),
    expires_in: 3600, // 1 hour in seconds
  };
}
