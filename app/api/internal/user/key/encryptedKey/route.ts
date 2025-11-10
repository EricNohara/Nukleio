import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { searchParams } = new URL(req.url);
    const description = searchParams.get("description");

    if (!description) {
      return NextResponse.json(
        { error: "Missing required parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("api_keys")
      .select("encrypted_key")
      .eq("user_id", user.id)
      .eq("description", description)
      .single();

    if (error) throw error;

    return NextResponse.json(
      { encryptedKey: data.encrypted_key },
      { status: 200 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
