import { NextRequest, NextResponse } from "next/server";

import { IExperience, IUserExperience } from "@/app/interfaces/IExperience";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";

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

    const updatedExperience: IExperience = await req.json();

    if (
      !updatedExperience ||
      !updatedExperience.company ||
      !updatedExperience.job_title
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const experienceData: IUserExperience = {
      ...updatedExperience,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("work_experiences")
      .insert(experienceData);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully added work experience" },
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

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const company = req.nextUrl.searchParams.get("company");
    const job_title = req.nextUrl.searchParams.get("job_title");
    if (!company || !job_title) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { error } = await supabase
      .from("work_experiences")
      .delete()
      .eq("company", company)
      .eq("job_title", job_title)
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

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const {
      prevCompany,
      prevJob,
      updatedExperience,
    }: {
      prevCompany: string;
      prevJob: string;
      updatedExperience: IExperience;
    } = await req.json();

    if (
      !updatedExperience ||
      !prevCompany ||
      !prevJob ||
      !updatedExperience.company ||
      !updatedExperience.job_title
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const experienceData: IUserExperience = {
      ...updatedExperience,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("work_experiences")
      .update(experienceData)
      .eq("company", prevCompany)
      .eq("job_title", prevJob)
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
