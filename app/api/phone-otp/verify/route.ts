import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin-client";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { error: "Phone number and OTP are required" },
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

    // Step 1: Verify OTP with MSG91
    const verifyUrl = new URL("https://control.msg91.com/api/v5/otp/verify");
    verifyUrl.searchParams.set("otp", otp);
    verifyUrl.searchParams.set("mobile", cleanPhone);

    const verifyResponse = await fetch(verifyUrl.toString(), {
      method: "GET",
      headers: {
        authkey: authKey,
      },
    });

    const verifyData = await verifyResponse.json();

    if (verifyData.type === "error") {
      return NextResponse.json(
        { error: verifyData.message || "Invalid OTP" },
        { status: 400 }
      );
    }

    // Step 2: OTP verified — now find or create user via profiles table
    const adminClient = createSupabaseAdminClient();

    // Check profiles table for existing user with this phone
    type ProfileRow = { id: string; phone: string };
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, phone")
      .eq("phone", cleanPhone)
      .single() as { data: ProfileRow | null };

    let userId: string;

    if (existingProfile) {
      // User exists — use their auth ID
      userId = existingProfile.id;
    } else {
      // Create a new Supabase auth user with phone
      // We use a dummy email derived from the phone since phone-only users
      // need an identifier in Supabase auth
      const dummyEmail = `${cleanPhone}@phone.user`;

      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email: dummyEmail,
          email_confirm: true,
          phone: cleanPhone,
          phone_confirm: true,
          user_metadata: {
            phone: cleanPhone,
            login_method: "phone_otp",
          },
        });

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      userId = newUser.user.id;

      // Insert into profiles table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await adminClient.from("profiles").insert({
        id: userId,
        phone: cleanPhone,
        login_method: "phone_otp",
        created_at: new Date().toISOString(),
      } as any);

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Non-fatal — user was still created in auth
      }
    }

    // Step 3: Generate a session for this user
    // Use generateLink to create a magic link, then extract the token
    // to build a session the client can use with setSession()
    const dummyEmail = `${cleanPhone}@phone.user`;

    const { data: linkData, error: linkError } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: dummyEmail,
      });

    if (linkError || !linkData) {
      console.error("Error generating session link:", linkError);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Exchange the token_hash for a real session via the GoTrue /token endpoint
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const tokenHash = linkData.properties.hashed_token;

    const tokenResponse = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
        body: JSON.stringify({
          token_hash: tokenHash,
          type: "magiclink",
        }),
      }
    );

    // If PKCE doesn't work, try the verify endpoint directly
    if (!tokenResponse.ok) {
      // Fallback: use the OTP from generateLink to verify
      const emailOtp = linkData.properties.email_otp;

      const verifyTokenResponse = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=id_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            email: dummyEmail,
            token: emailOtp,
            type: "magiclink",
          }),
        }
      );

      if (!verifyTokenResponse.ok) {
        // Final fallback: use the verify OTP endpoint
        const serverSupabase = await createSupabaseServerClient();
        const { data: verifySession, error: verifyError } =
          await serverSupabase.auth.verifyOtp({
            email: dummyEmail,
            token: emailOtp,
            type: "email",
          });

        if (verifyError || !verifySession.session) {
          console.error("Error verifying OTP for session:", verifyError);
          return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          session: {
            access_token: verifySession.session.access_token,
            refresh_token: verifySession.session.refresh_token,
          },
          user: verifySession.user,
        });
      }

      const tokenData = await verifyTokenResponse.json();
      return NextResponse.json({
        success: true,
        session: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        },
        user: tokenData.user,
      });
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json({
      success: true,
      session: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
      },
      user: tokenData.user,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
