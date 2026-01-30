import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { email, password }: { email: string; password: string } =
      await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email or password missing" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // update the created_by_oauth field to false
    if (data.user) {
      const { error: updateError } = await supabase
        .from("users")
        .update({ requires_oauth_signup: false })
        .eq("id", data.user.id);

      if (updateError) {
        console.error("Failed to update requires_oauth_signup:", updateError);
      }
    }

    return NextResponse.json(
      { message: "Sign up successful" },
      { status: 201 },
    );
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
