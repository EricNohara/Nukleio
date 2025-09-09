import { NextRequest, NextResponse } from "next/server";

import { ICourseInput } from "@/app/interfaces/ICourse";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

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
const otherGrades = ["P", "F"];
const percentageGrades = Array.from({ length: 101 }, (_, i) => i.toString());

const VALID_GRADES = [...letterGrades, ...otherGrades, ...percentageGrades];

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const education_id = req.nextUrl.searchParams.get("educationID");
    const courseName = req.nextUrl.searchParams.get("courseName");

    if (education_id) {
      if (courseName) {
        const { data, error } = await supabase
          .from("course")
          .select()
          .eq("user_id", user.id)
          .eq("name", courseName)
          .eq("education_id", education_id);

        if (error) throw error;

        return NextResponse.json(data, { status: 200 });
      } else {
        const { data, error } = await supabase
          .from("course")
          .select()
          .eq("user_id", user.id)
          .eq("education_id", education_id);

        if (error) throw error;

        return NextResponse.json(data, { status: 200 });
      }
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
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const sentData = await req.json();
    const sentCourse: ICourseInput = sentData.course;
    const sentEducationID = sentData.educationID;

    const inputValidationResponse = validateInput(sentCourse, sentEducationID);
    if (inputValidationResponse) return inputValidationResponse;

    const courseData = {
      ...sentCourse,
      user_id: user.id,
      education_id: sentEducationID,
    };

    const { error } = await supabase.from("course").insert(courseData);

    if (error) throw error;

    return NextResponse.json(
      { message: "Successfully added course" },
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

    const educationID = req.nextUrl.searchParams.get("educationID");
    const courseName = req.nextUrl.searchParams.get("courseName");
    if (!educationID || !courseName) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const { error } = await supabase
      .from("course")
      .delete()
      .eq("education_id", educationID)
      .eq("name", courseName)
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

    const sentData = await req.json();
    const educationID = sentData.educationID;
    const courseName = sentData.courseName;
    const updatedCourse: ICourseInput = sentData.course;

    const inputValidationResponse = validateInput(updatedCourse, educationID);
    if (inputValidationResponse) return inputValidationResponse;

    const courseData = {
      ...updatedCourse,
      user_id: user.id,
      education_id: educationID,
    };

    const { error } = await supabase
      .from("course")
      .update(courseData)
      .eq("education_id", educationID)
      .eq("name", courseName)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json(
      { message: "Successfully updated course" },
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

function validateInput(
  course: ICourseInput,
  educationID: string
): NextResponse | undefined {
  if (!course || !educationID || !course.name) {
    return NextResponse.json({ message: "Invalid input" }, { status: 400 });
  }

  if (course.grade && !VALID_GRADES.includes(course.grade)) {
    return NextResponse.json(
      { message: "Invalid grade input" },
      { status: 400 }
    );
  }
}
