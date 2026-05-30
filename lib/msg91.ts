/**
 * MSG91 Flow API SMS sender.
 *
 * Uses MSG91's Flow API (plain SMS template) — NOT their OTP API.
 * MSG91 is a "dumb pipe" — it just delivers the SMS.
 * We generate, store, and verify OTPs ourselves via Redis.
 *
 * Retry logic: retries once on 5xx before giving up.
 */

interface MSG91Response {
  type?: string;
  message?: string;
  request_id?: string;
}

/**
 * Send an OTP SMS via MSG91 Flow API.
 *
 * @param phone - Full phone number with country code (e.g., "919876543210")
 * @param otp - The 6-digit OTP to include in the SMS template
 * @returns true if SMS was accepted by MSG91, false on failure
 */
export async function sendOtpSMS(
  phone: string,
  otp: string
): Promise<boolean> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    console.warn(
      "⚠️ MSG91 configuration missing: MSG91_AUTH_KEY or MSG91_TEMPLATE_ID is not defined in .env.local"
    );
    console.log(
      `🔑 [LOCAL DEV] MSG91 disabled. Generated OTP for ${phone} is: ${otp}`
    );
    return true; // Allow testing Redis OTP flow locally without real SMS dispatch
  }

  const body = {
    template_id: templateId,
    short_url: "0",
    recipients: [
      {
        mobiles: phone,
        otp: otp,
      },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    authkey: authKey,
  };

  // First attempt
  let response = await attemptSend(headers, body);

  // Retry once on 5xx server error
  if (response && response.status >= 500) {
    response = await attemptSend(headers, body);
  }

  if (!response) {
    return false;
  }

  if (response.status >= 500) {
    // Still failing after retry
    return false;
  }

  const data: MSG91Response = await response.json();

  if (data.type === "error") {
    console.error("MSG91 Flow API error:", data.message);
    return false;
  }

  return true;
}

/**
 * Internal: attempt a single POST to MSG91 Flow API.
 * Returns the Response object, or null on network error.
 */
async function attemptSend(
  headers: Record<string, string>,
  body: object
): Promise<Response | null> {
  try {
    return await fetch("https://control.msg91.com/api/v5/flow", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("MSG91 network error:", error);
    return null;
  }
}
