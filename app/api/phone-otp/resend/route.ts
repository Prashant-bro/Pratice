import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { phone, retrytype = "text" } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^\d]/g, "");
    const authKey = process.env.MSG91_AUTH_KEY;

    if (!authKey) {
      return NextResponse.json(
        { error: "SMS service not configured" },
        { status: 500 }
      );
    }

    // Call MSG91 Retry OTP API
    const url = new URL("https://control.msg91.com/api/v5/otp/retry");
    url.searchParams.set("authkey", authKey);
    url.searchParams.set("retrytype", retrytype);
    url.searchParams.set("mobile", cleanPhone);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.type === "error") {
      console.error("MSG91 Resend OTP error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to resend OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
