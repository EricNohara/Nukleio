import { NextRequest, NextResponse } from "next/server";

import { IProject } from "@/app/interfaces/IProject";
import IUser from "@/app/interfaces/IUser";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";
import parseURL from "@/utils/general/parseURL";
import { createServiceRoleClient } from "@/utils/supabase/server";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { data, error } = await supabase
      .from("users")
      .select()
      .eq("id", user.id)
      .single<IUser>();

    if (error) {
      throw error;
    } else if (!data) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ userData: data }, { status: 200 });
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

    const userData: IUser = await req.json();

    const { error } = await supabase
      .from("users")
      .update(userData)
      .eq("id", user?.id);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "User successfully created" },
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

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const userData: IUser = await req.json();

    const { error } = await supabase
      .from("users")
      .update(userData)
      .eq("id", user?.id);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json({ message: "Update successful" }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// user only able to delete its own account and only if it is logged in
export async function DELETE(_req: NextRequest): Promise<NextResponse> {
  const serviceRoleSupabase = createServiceRoleClient();

  try {
    // authenticate user
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    // delete all items in storage associated with the user
    const publicURLs = [];

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select()
      .eq("user_id", user.id);

    if (projectError) throw projectError;

    projectData?.forEach((project: IProject) => {
      if (project.thumbnail_url && project.thumbnail_url !== "") {
        publicURLs.push(project.thumbnail_url);
      }
    });

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select()
      .eq("id", user.id)
      .single();

    if (userError) throw userError;

    if (userData.portrait_url && userData.portrait_url !== null)
      publicURLs.push(userData.portrait_url);
    if (userData.resume_url && userData.resume_url !== null)
      publicURLs.push(userData.resume_url);
    if (userData.transcript_url && userData.transcript_url !== null)
      publicURLs.push(userData.transcript_url);

    for (const url of publicURLs) {
      if (!url || url === "") continue;
      const { parsedBucket, parsedFilename } = parseURL(url);
      const { error } = await serviceRoleSupabase.storage
        .from(parsedBucket)
        .remove([parsedFilename]);
      if (error) throw error;
    }

    // delete the user from the auth table - this will cause cascading deletions from all other tables
    const { error } = await serviceRoleSupabase.auth.admin.deleteUser(user.id);

    if (error) throw error;

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
