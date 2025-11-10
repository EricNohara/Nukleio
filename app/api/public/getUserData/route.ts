import { NextRequest, NextResponse } from "next/server";

import IPublicApiLog from "@/app/interfaces/IPublicApiLog";
import { IUserEducation, IUserInfo } from "@/app/interfaces/IUserInfo";
import { decrypt } from "@/utils/auth/encrypt";
import { validateKey } from "@/utils/auth/hash";
import { createServiceRoleClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // create fields for log
  const requestedAt = new Date().toISOString();
  let userId: string | null = null;
  let keyDescription: string | null = null;
  let statusCode: number = 500;
  let apiKey: string | undefined;

  try {
    const supabase = await createServiceRoleClient();

    // get the api key from the authorization header
    apiKey = req.headers.get("Authorization")?.split(" ")[1];
    if (!apiKey) {
      statusCode = 401;
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: statusCode }
      );
    }

    // retrieve the API key information
    const { data, error } = await supabase
      .from("api_keys")
      .select("hashed_key, user_id, description")
      .filter("encrypted_key", "eq", apiKey);

    if (error || !data || data.length === 0) {
      statusCode = 404;
      return NextResponse.json(
        { message: "User API key not found" },
        { status: statusCode }
      );
    }

    keyDescription = data[0].description;

    // decrypt the api key
    const decryptedKey = decrypt(apiKey);
    if (!decryptedKey || typeof decryptedKey !== "string") {
      statusCode = 401;
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: statusCode }
      );
    }

    // validate user's key
    const isValid = await validateKey(decryptedKey, data[0].hashed_key);
    if (!isValid) {
      statusCode = 401;
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: statusCode }
      );
    }

    userId = data[0].user_id;
    if (!userId) {
      statusCode = 404;
      return NextResponse.json(
        { message: "User id not found" },
        { status: statusCode }
      );
    }

    // get and clean information to add to the userInfo super object that is returned to the user
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select()
      .eq("id", userId);

    if (userDataError) throw userDataError;

    const cleanedUserData = userData.map(({ _id, ...rest }) => rest)[0];

    // skills
    const { data: userSkills, error: userSkillsError } = await supabase
      .from("skills")
      .select()
      .eq("user_id", userId);

    if (userSkillsError) throw userSkillsError;

    const cleanedUserSkills = userSkills.map(({ _user_id, ...rest }) => rest);

    // experiences
    const { data: userExperience, error: userExperienceError } = await supabase
      .from("work_experiences")
      .select()
      .eq("user_id", userId);

    if (userExperienceError) throw userExperienceError;

    const cleanedUserExperience = userExperience.map(
      ({ _user_id, ...rest }) => rest
    );

    // projects
    const { data: userProject, error: userProjectError } = await supabase
      .from("projects")
      .select()
      .eq("user_id", userId);

    if (userProjectError) throw userProjectError;

    const cleanedUserProjects = userProject.map(
      ({ _id, _user_id, ...rest }) => rest
    );

    // education + courses
    const { data: userEducation, error: userEducationError } = await supabase
      .from("education")
      .select()
      .eq("user_id", userId);

    if (userEducationError) throw userEducationError;

    const userEducationWithCourses: IUserEducation[] = [];

    for (const education of userEducation) {
      const { data: educationCourses, error: educationCoursesError } =
        await supabase
          .from("course")
          .select()
          .eq("user_id", userId)
          .eq("education_id", education.id);

      if (educationCoursesError) throw educationCoursesError;

      const cleanedEducationCourses = educationCourses.map(
        ({ _education_id, _user_id, ...rest }) => rest
      );

      const cleanedEducation = {
        degree: education.degree,
        majors: education.majors,
        minors: education.minors,
        gpa: education.gpa,
        institution: education.institution,
        awards: education.awards,
        year_start: education.year_start,
        year_end: education.year_end,
      };

      const educationWithCourses = {
        ...cleanedEducation,
        courses: cleanedEducationCourses,
      };

      userEducationWithCourses.push(educationWithCourses);
    }

    // construct the super object
    const userInfo: IUserInfo = {
      ...cleanedUserData,
      skills: cleanedUserSkills,
      experiences: cleanedUserExperience,
      projects: cleanedUserProjects,
      education: userEducationWithCourses,
    };

    statusCode = 200;
    return NextResponse.json(
      { userInfo },
      {
        status: statusCode,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization, User-Email, Content-Type, Accept",
        },
      }
    );
  } catch (err) {
    const error = err as Error;
    console.error(error.message);

    statusCode = 500;
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: statusCode,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers":
            "Authorization, User-Email, Content-Type, Accept",
        },
      }
    );
  } finally {
    // add a log and update last used field for api key if we know the user id
    if (userId) {
      try {
        // create the log
        const respondedAt = new Date().toISOString();
        const userAgent = req.headers.get("user-agent") || "unknown";

        const publicApiLog: IPublicApiLog = {
          user_id: userId,
          requested_at: requestedAt,
          responded_at: respondedAt,
          status_code: statusCode,
          key_description: keyDescription ? keyDescription.trim() : "Unknown",
          user_agent: userAgent,
        };

        // insert the log
        const supabase = await createServiceRoleClient();
        await supabase.from("public_api_logs").insert(publicApiLog);

        // update the last_used field
        if (apiKey) {
          await supabase
            .from("api_keys")
            .update({ last_used: requestedAt })
            .eq("encrypted_key", apiKey);
        }
      } catch (logErr) {
        console.error("Failed to insert API log:", (logErr as Error).message);
      }
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers":
        "Authorization, User-Email, Content-Type, Accept",
    },
  });
}
