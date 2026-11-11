import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  // Keep auth destinations inside this application.
  if (!/^\/(dashboard|auth\/update-password)(?:[/?#]|$)/.test(value)) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));
  const authError = requestUrl.searchParams.get("error") ||
    requestUrl.searchParams.get("error_code");

  if (authError) {
    return NextResponse.redirect(new URL("/login?error=auth-link-invalid", origin), 303);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.redirect(new URL("/login?error=not-configured", origin), 303);
  }

  let response = NextResponse.redirect(new URL(next, origin), 303);
  response.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  let verificationError: { code?: string; status?: number } | null = null;

  if (tokenHash) {
    // Token-hash verification works across browsers and devices; it does not
    // depend on the PKCE verifier cookie from the browser that requested reset.
    if (otpType !== "recovery" && otpType !== "invite") {
      verificationError = { code: "unsupported_otp_type" };
    } else {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType as EmailOtpType,
      });
      if (error) verificationError = { code: error.code, status: error.status };
    }
  } else if (code) {
    // Retain PKCE callback support for existing OAuth and older email links.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) verificationError = { code: error.code, status: error.status };
  } else {
    verificationError = { code: "missing_auth_token" };
  }

  if (verificationError) {
    // Do not log the URL, OTP, auth code, or any credential.
    console.warn("[auth/callback] Verification failed", verificationError);
    response = NextResponse.redirect(
      new URL("/login?error=auth-link-invalid", origin),
      303,
    );
    response.headers.set("Cache-Control", "no-store");
  }

  return response;
}
