import { NextRequest, NextResponse } from "next/server";

import {
  IExperience,
  IExperienceInput,
  IUserExperience,
} from "@/app/interfaces/IExperience";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { data, error } = await supabase
      .from("work_experiences")
      .select()
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const experience: IExperienceInput = await req.json();

    if (!experience || !experience.company || !experience.job_title) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const id = randomUUID();

    const payload: IUserExperience = {
      id: id,
      ...experience,
      user_id: user.id,
    };

    const { error } = await supabase.from("work_experiences").insert(payload);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully added work experience", id },
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

// delete by id
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { message: "Invalid input: id required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("work_experiences")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// update by id
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const {
      id,
      updatedExperience,
    }: {
      id: string;
      updatedExperience: IExperience;
    } = await req.json();

    if (
      !updatedExperience ||
      !id ||
      !updatedExperience.company ||
      !updatedExperience.job_title
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const payload: IUserExperience = {
      ...updatedExperience,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("work_experiences")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully updated work experience" },
      { status: 200 },
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
