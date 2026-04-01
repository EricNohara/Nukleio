import { NextRequest, NextResponse } from "next/server";

import { IUserInfoInternal } from "@/app/interfaces/IUserInfoInternal";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { data, error } = await supabase.rpc("get_user_info_internal", {
      p_user_id: user.id,
    });
    if (error) throw error;

    const userInfoInternal = data as IUserInfoInternal;
    return NextResponse.json({ userInfoInternal }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
