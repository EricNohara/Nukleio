import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { email, password, captchaToken }: {
      email: string;
      password: string;
      captchaToken?: unknown;
    } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email or password missing" },
        { status: 400 }
      );
    }

    if (typeof captchaToken !== "string" || !captchaToken.trim()) {
      return NextResponse.json(
        {
          code: "CAPTCHA_REQUIRED",
          message: "Complete the CAPTCHA challenge before signing in.",
        },
        { status: 400 },
      );
    }

    const data = {
      email: email,
      password: password,
      options: { captchaToken },
    };

    const { error } = await supabase.auth.signInWithPassword(data);

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
      if (error.code === "email_not_confirmed") {
        return NextResponse.json(
          {
            code: "EMAIL_NOT_CONFIRMED",
            message: "Confirm your email address before signing in.",
          },
          { status: 403 },
        );
      }
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message: "Log in successful" }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
