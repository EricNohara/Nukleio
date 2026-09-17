import { NextRequest, NextResponse } from "next/server";

import {
  isValidOauthSignupApproval,
  OAUTH_SIGNUP_APPROVAL_COOKIE,
} from "@/utils/auth/oauthSignupApproval";
import {
  consumeSignupRateLimit,
  consumeSuccessfulSignupDeviceLimit,
  getSignupDevice,
  getSignupDeviceCookieName,
  SignupRateLimitServiceError,
} from "@/utils/auth/signupRateLimit";
import { handleOauthSignup } from "@/utils/oauth/handleOauthSignup";
import { createAdminClient, createClient } from "@/utils/supabase/server";

function withDeviceCookie(response: NextResponse, device: ReturnType<typeof getSignupDevice>): NextResponse {
  if (device.isNew) {
    response.cookies.set({
      name: getSignupDeviceCookieName(),
      value: device.value,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  return response;
}

function clearApproval(response: NextResponse): NextResponse {
  response.cookies.set({
    name: OAUTH_SIGNUP_APPROVAL_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/internal/auth/callback",
    maxAge: 0,
  });
  return response;
}

async function rejectNewOauthSignup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  origin: string,
  code: string,
): Promise<NextResponse> {
  await supabase.auth.signOut();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) console.error("Unable to remove rejected OAuth signup:", error.message);
  return clearApproval(NextResponse.redirect(`${origin}/user/login?error=${code}`));
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerParam = searchParams.get("provider");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const identity = providerParam
        ? user?.identities?.find((i) => i.provider === providerParam)
        : user?.identities?.[0];

      if (user && identity && providerParam) {
        const { data: userRow, error: userRowError } = await supabase
          .from("users")
          .select("requires_oauth_signup")
          .eq("id", user.id)
          .single();

        if (userRowError) {
          console.error("Unable to determine OAuth signup state:", userRowError.message);
          await supabase.auth.signOut();
          return clearApproval(NextResponse.redirect(`${origin}/user/login?error=oauth_unavailable`));
        }

        if (userRow?.requires_oauth_signup) {
          const approval = request.cookies.get(OAUTH_SIGNUP_APPROVAL_COOKIE)?.value;
          if (!isValidOauthSignupApproval(approval, providerParam) || !user.email) {
            return rejectNewOauthSignup(supabase, user.id, origin, "oauth_signup_rejected");
          }

          const device = getSignupDevice(request);
          try {
            const attemptLimit = await consumeSignupRateLimit({
              request,
              email: user.email,
            });
            if (!attemptLimit.allowed) {
              const response = await rejectNewOauthSignup(supabase, user.id, origin, "oauth_rate_limited");
              response.headers.set("Retry-After", String(attemptLimit.retryAfterSeconds));
              return withDeviceCookie(response, device);
            }

            const deviceLimit = await consumeSuccessfulSignupDeviceLimit({ device });
            if (!deviceLimit.allowed) {
              const response = await rejectNewOauthSignup(supabase, user.id, origin, "oauth_rate_limited");
              response.headers.set("Retry-After", String(deviceLimit.retryAfterSeconds));
              return withDeviceCookie(response, device);
            }
          } catch (error) {
            if (error instanceof SignupRateLimitServiceError) {
              console.error("OAuth signup abuse protection unavailable:", error);
              return rejectNewOauthSignup(supabase, user.id, origin, "oauth_unavailable");
            }
            throw error;
          }

          await handleOauthSignup(providerParam, supabase, user, identity);
          const response = clearApproval(NextResponse.redirect(`${origin}${next}`));
          return withDeviceCookie(response, device);
        }
      }

      // redirect back to the app from oauth flow
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return clearApproval(NextResponse.redirect(`${origin}${next}`));
      } else if (forwardedHost) {
        return clearApproval(NextResponse.redirect(`https://${forwardedHost}${next}`));
      } else {
        return clearApproval(NextResponse.redirect(`${origin}${next}`));
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
