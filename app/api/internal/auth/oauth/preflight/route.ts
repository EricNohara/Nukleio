import { NextRequest, NextResponse } from "next/server";

import {
  createOauthSignupApproval,
  OAUTH_SIGNUP_APPROVAL_COOKIE,
  OAUTH_SIGNUP_APPROVAL_MAX_AGE_SECONDS,
} from "@/utils/auth/oauthSignupApproval";

const PROVIDERS = new Set(["azure", "github", "gitlab", "google", "linkedin_oidc"]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const { provider, captchaToken } = (body ?? {}) as {
    provider?: unknown;
    captchaToken?: unknown;
  };

  if (typeof provider !== "string" || !PROVIDERS.has(provider) || typeof captchaToken !== "string" || !captchaToken.trim()) {
    return NextResponse.json(
      { code: "CAPTCHA_REQUIRED", message: "Complete the CAPTCHA challenge before continuing with OAuth." },
      { status: 400 },
    );
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    console.error("OAuth CAPTCHA verification is unavailable: missing TURNSTILE_SECRET_KEY");
    return NextResponse.json(
      { message: "OAuth sign-in is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  try {
    const verification = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: captchaToken }),
    });
    const result = await verification.json().catch(() => null) as { success?: boolean } | null;
    if (!verification.ok || !result?.success) {
      return NextResponse.json(
        { code: "CAPTCHA_FAILED", message: "CAPTCHA verification failed. Complete it again and retry." },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("OAuth CAPTCHA verification failed:", error);
    return NextResponse.json(
      { message: "OAuth sign-in is temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: OAUTH_SIGNUP_APPROVAL_COOKIE,
    value: createOauthSignupApproval(provider),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/internal/auth/callback",
    maxAge: OAUTH_SIGNUP_APPROVAL_MAX_AGE_SECONDS,
  });
  return response;
}
