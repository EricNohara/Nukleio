import { NextRequest, NextResponse } from "next/server";

import { IEducationInput } from "@/app/interfaces/IEducation";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const id = req.nextUrl.searchParams.get("id");

    if (id) {
      const { data, error } = await supabase
        .from("education")
        .select()
        .eq("user_id", user.id)
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    } else {
      const { data, error } = await supabase
        .from("education")
        .select()
        .eq("user_id", user.id);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    }
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

    const sentEducation: IEducationInput = await req.json();

    const educationValidationResponse = validateEducation(sentEducation);
    if (educationValidationResponse) return educationValidationResponse;

    const educationData = {
      ...sentEducation,
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("education")
      .insert(educationData)
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { message: "Successfully added education", id: data.id },
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

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { error } = await supabase
      .from("education")
      .delete()
      .eq("id", id)
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
      id,
      updatedEducation,
    }: {
      id: string;
      updatedEducation: IEducationInput;
    } = await req.json();

    const educationValidationResponse = validateEducation(updatedEducation);
    if (educationValidationResponse) return educationValidationResponse;

    const educationData = {
      ...updatedEducation,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("education")
      .update(educationData)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Successfully updated education" },
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

function validateEducation(
  education: IEducationInput
): NextResponse | undefined {
  if (!education || !education.institution || !education.degree) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  if (
    typeof education.gpa === "number" &&
    (education.gpa > 4 || education.gpa < 0)
  ) {
    return NextResponse.json({ message: "Invalid GPA value" }, { status: 400 });
  }
}
