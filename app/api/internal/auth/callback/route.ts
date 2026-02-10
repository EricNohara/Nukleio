import { NextResponse } from "next/server";

// The client you created from the Server-Side Auth instructions
import { handleOauthSignup } from "@/utils/oauth/handleOauthSignup";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
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
        // TODO: autofill information for the user table
        // console.log(providerParam, identity);

        handleOauthSignup(providerParam, supabase, user, identity);
      }

      // redirect back to the app from oauth flow
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
