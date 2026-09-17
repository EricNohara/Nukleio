import { NextRequest, NextResponse } from "next/server";

import {
  consumeSignupRateLimit,
  consumeSuccessfulSignupDeviceLimit,
  getSignupDevice,
  getSignupDeviceCookieName,
  SignupRateLimitServiceError,
  SignupDevice,
} from "@/utils/auth/signupRateLimit";
import { createAdminClient, createClient } from "@/utils/supabase/server";

function withSignupDeviceCookie(response: NextResponse, device: SignupDevice): NextResponse {
  if (device.isNew) {
    response.cookies.set({
      name: getSignupDeviceCookieName(),
      value: device.cookieValue,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  return response;
}

function signupProviderErrorResponse(
  error: { message?: string; code?: string; status?: number },
  device: SignupDevice,
): NextResponse {
  const message = error.message?.toLowerCase() ?? "";
  if (message.includes("captcha") || message.includes("bot")) {
    return withSignupDeviceCookie(
      NextResponse.json(
        {
          code: "CAPTCHA_FAILED",
          message: "CAPTCHA verification failed. Complete it again and retry.",
        },
        { status: 400 },
      ),
      device,
    );
  }

  if (error.code === "user_already_exists" || message.includes("already registered")) {
    return withSignupDeviceCookie(
      NextResponse.json(
        {
          code: "EMAIL_ALREADY_REGISTERED",
          message: "An account with this email already exists. Try signing in instead.",
        },
        { status: 400 },
      ),
      device,
    );
  }

  return withSignupDeviceCookie(
    NextResponse.json(
      {
        code: "SIGNUP_REJECTED",
        message: "Unable to create this account. Check your details and try again.",
      },
      { status: error.status && error.status >= 400 ? error.status : 400 },
    ),
    device,
  );
}

async function deleteOrBlockRejectedSignup(userId: string): Promise<void> {
  const admin = createAdminClient();
  let deleteError: { message: string } | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (!error) return;
    deleteError = error;
  }

  console.error("Unable to remove rate-limited signup:", deleteError?.message);
  const { error: blockError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { signup_blocked: true },
  });
  if (blockError) {
    console.error("Unable to block rate-limited signup:", blockError.message);
    throw new SignupRateLimitServiceError("Unable to enforce successful signup limits");
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid signup request" }, { status: 400 });
    }
    const { email, password, captchaToken } = body as {
      email?: unknown;
      password?: unknown;
      captchaToken?: unknown;
    };

    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json(
        { message: "Email or password missing" },
        { status: 400 },
      );
    }

    const device = getSignupDevice(req);
    const signupLimit = await consumeSignupRateLimit({ request: req, email });
    if (!signupLimit.allowed) {
      return withSignupDeviceCookie(
        NextResponse.json(
          {
            code: "SIGNUP_RATE_LIMIT_EXCEEDED",
            message: "Too many signup attempts. Please try again later.",
          },
          {
            status: 429,
            headers: { "Retry-After": String(signupLimit.retryAfterSeconds) },
          },
        ),
        device,
      );
    }

    if (typeof captchaToken !== "string" || !captchaToken.trim()) {
      return withSignupDeviceCookie(
        NextResponse.json(
          {
            code: "CAPTCHA_REQUIRED",
            message: "Complete the CAPTCHA challenge before signing up.",
          },
          { status: 400 },
        ),
        device,
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        emailRedirectTo: `${req.nextUrl.origin}/api/internal/auth/callback?next=/user`,
      },
    });

    if (error) {
      return signupProviderErrorResponse(error, device);
    }

    // Supabase returns an identity-less obfuscated user for an existing email
    // when confirmation is enabled. Only count genuine account creations.
    const isNewAccount = Boolean(data.user?.identities?.length);
    if (data.user && isNewAccount) {
      const deviceLimit = await consumeSuccessfulSignupDeviceLimit({ device });
      if (!deviceLimit.allowed) {
        await deleteOrBlockRejectedSignup(data.user.id);
        return withSignupDeviceCookie(
          NextResponse.json(
            {
              code: "SIGNUP_DEVICE_LIMIT_EXCEEDED",
              message: "Too many accounts were created from this device. Please try again later.",
            },
            {
              status: 429,
              headers: { "Retry-After": String(deviceLimit.retryAfterSeconds) },
            },
          ),
          device,
        );
      }
    }

    // Confirm-email signup has no user session, so this must use the
    // service-role client rather than the request-scoped client under RLS.
    if (data.user) {
      const admin = createAdminClient();
      const { error: updateError } = await admin
        .from("users")
        .update({ requires_oauth_signup: false })
        .eq("id", data.user.id);

      if (updateError) {
        await deleteOrBlockRejectedSignup(data.user.id);
        throw new SignupRateLimitServiceError("Unable to finalize email signup state");
      }
    }

    return withSignupDeviceCookie(
      NextResponse.json(
        {
          message: "Sign up successful. Check your email to confirm your account before signing in.",
          requiresEmailConfirmation: true,
        },
        { status: 201 },
      ),
      device,
    );
  } catch (err) {
    if (err instanceof SignupRateLimitServiceError) {
      console.error("Signup abuse protection unavailable:", err);
      return NextResponse.json(
        { message: "Sign up is temporarily unavailable. Please try again later." },
        { status: 503 },
      );
    }
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
