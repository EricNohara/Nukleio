import { NextRequest, NextResponse } from "next/server";

import {
  consumeResendConfirmationRateLimit,
  SignupRateLimitServiceError,
} from "@/utils/auth/signupRateLimit";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body: unknown = await req.json().catch(() => null);
  const email =
    body && typeof body === "object"
      ? (body as { email?: unknown }).email
      : undefined;
  const captchaToken =
    body && typeof body === "object"
      ? (body as { captchaToken?: unknown }).captchaToken
      : undefined;

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ message: "Email is required." }, { status: 400 });
  }

  if (typeof captchaToken !== "string" || !captchaToken.trim()) {
    return NextResponse.json(
      {
        code: "CAPTCHA_REQUIRED",
        message: "Complete the CAPTCHA challenge before requesting another email.",
      },
      { status: 400 },
    );
  }

  try {
    const rateLimit = await consumeResendConfirmationRateLimit({
      request: req,
      email: email.trim(),
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          code: "CONFIRMATION_RESEND_RATE_LIMIT_EXCEEDED",
          message: "Please wait before requesting another confirmation email.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        captchaToken,
        emailRedirectTo: `${req.nextUrl.origin}/api/internal/auth/callback?next=/user`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("captcha")) {
        return NextResponse.json(
          {
            code: "CAPTCHA_FAILED",
            message: "CAPTCHA verification failed. Complete it again and retry.",
          },
          { status: 400 },
        );
      }
      console.error("Unable to resend confirmation email:", error.message);
    }
  } catch (error) {
    if (error instanceof SignupRateLimitServiceError) {
      console.error("Confirmation resend abuse protection unavailable:", error);
      return NextResponse.json(
        { message: "Confirmation emails are temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    console.error("Unable to resend confirmation email:", error);
  }

  // Keep this response neutral so the endpoint does not reveal account state.
  return NextResponse.json({
    message: "If an unconfirmed account exists for this email, we sent a new confirmation link.",
  });
}
