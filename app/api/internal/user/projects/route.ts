import { NextRequest, NextResponse } from "next/server";

import { IProjectInput } from "@/app/interfaces/IProject";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const limit = req.nextUrl.searchParams.get("limit");
    const projectID = req.nextUrl.searchParams.get("projectID");

    if (limit && projectID) {
      return NextResponse.json(
        { message: "Limit and projectID cannot both be specified" },
        { status: 400 }
      );
    }

    if (limit) {
      const limitNum = parseInt(limit);

      if (isNaN(limitNum) || limitNum <= 0) {
        return NextResponse.json(
          { message: "Limit parameter must be greater than 0" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .limit(limitNum);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    }

    if (projectID) {
      const { data, error } = await supabase
        .from("projects")
        .select()
        .eq("user_id", user.id)
        .eq("id", projectID);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    }

    const { data, error } = await supabase
      .from("projects")
      .select()
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const sentProject: IProjectInput = await req.json();

    if (!sentProject || !sentProject.name || !sentProject.description) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const projectData = {
      ...sentProject,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { message: "Successfully created project", id: data.id },
      { status: 201 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const projectID = req.nextUrl.searchParams.get("projectID");
    if (!projectID) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectID)
      .eq("user_id", user.id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const {
      prevProjectID,
      updatedProject,
    }: {
      prevProjectID: string;
      updatedProject: IProjectInput;
    } = await req.json();

    if (
      !updatedProject ||
      !prevProjectID ||
      !updatedProject.name ||
      !updatedProject.description
    ) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const projectData = {
      ...updatedProject,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("projects")
      .update(projectData)
      .eq("id", prevProjectID)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Successfully updated project" },
      { status: 200 }
    );
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
