import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Strip any non-digit characters except leading +
    const cleanPhone = phone.replace(/[^\d]/g, "");

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey) {
      console.error("Missing MSG91_AUTH_KEY");
      return NextResponse.json(
        { error: "SMS service not configured" },
        { status: 500 }
      );
    }

    // Call MSG91 Send OTP API
    const body: Record<string, any> = {
      mobile: cleanPhone,
      otp_length: 6,
      otp_expiry: 10,
    };
    if (templateId) {
      body.template_id = templateId;
    }

    const response = await fetch("https://control.msg91.com/api/v5/otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('MSG91 response:', JSON.stringify(data)); // ← add this

    if (data.type === "error") {
      console.error("MSG91 Send OTP error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to send OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
