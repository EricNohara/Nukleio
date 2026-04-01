import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { ICourseInput } from "@/app/interfaces/ICourse";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";

const letterGrades = [
  "A+",
  "A",
  "A-",
  "B+",
  "B",
  "B-",
  "C+",
  "C",
  "C-",
  "D+",
  "D",
  "D-",
  "F",
];
const otherGrades = ["P", "F", "Pass", "Fail"];
const percentageGrades = Array.from({ length: 101 }, (_, i) => i.toString());

const VALID_GRADES = [...letterGrades, ...otherGrades, ...percentageGrades];

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const educationID = req.nextUrl.searchParams.get("educationID");

    // get all courses for a given education item
    if (educationID) {
      const { data, error } = await supabase
        .from("course")
        .select()
        .eq("user_id", user.id)
        .eq("education_id", educationID);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    } else {
      const { data, error } = await supabase
        .from("course")
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
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const body = await req.json();
    const course: ICourseInput = body.course;
    const educationID = body.educationID;

    const inputValidationResponse = validateInput(course, educationID);
    if (inputValidationResponse) return inputValidationResponse;

    const id = randomUUID();

    const payload = {
      id: id,
      ...course,
      user_id: user.id,
      education_id: educationID,
    };

    const { error } = await supabase.from("course").insert(payload);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully added course", id },
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

// by id
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { error } = await supabase
      .from("course")
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

// by id
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const body = await req.json();
    const id = body.id;
    const educationID = body.educationID;
    const course: ICourseInput = body.course;

    const inputValidationResponse = validateInput(course, educationID);
    if (inputValidationResponse) return inputValidationResponse;

    const payload = {
      id: id,
      ...course,
      user_id: user.id,
      education_id: educationID,
    };

    const { error } = await supabase
      .from("course")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully updated course" },
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

function validateInput(
  course: ICourseInput,
  educationID: string,
): NextResponse | undefined {
  if (!course || !educationID || !course.name) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  if (course.grade && !VALID_GRADES.includes(course.grade)) {
    return NextResponse.json(
      { message: "Invalid grade input" },
      { status: 400 },
    );
  }
}
