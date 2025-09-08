import { NextRequest, NextResponse } from "next/server";

import { IUserEducation } from "@/app/interfaces/IUserInfo";
import { IUserInfoInternal } from "@/app/interfaces/IUserInfoInternal";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    // get and clean information to add to the userInfo super object
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select(
        "name, phone_number, email, github_url, linkedin_url, portrait_url, resume_url, transcript_url, instagram_url, facebook_url, x_url, bio, current_position, current_company, current_address"
      )
      .eq("id", user.id)
      .single();
    if (userDataError) throw userDataError;

    // skills
    const { data: userSkills, error: userSkillsError } = await supabase
      .from("skills")
      .select("name, proficiency, years_of_experience")
      .eq("user_id", user.id);
    if (userSkillsError) throw userSkillsError;

    // experiences
    const { data: userExperience, error: userExperienceError } = await supabase
      .from("work_experiences")
      .select("company, job_title, date_start, date_end, job_description")
      .eq("user_id", user.id);
    if (userExperienceError) throw userExperienceError;

    // projects
    const { data: userProject, error: userProjectError } = await supabase
      .from("projects")
      .select(
        "name, date_start, date_end, languages_used, frameworks_used, technologies_used, description, github_url, demo_url, thumbnail_url"
      )
      .eq("user_id", user.id);
    if (userProjectError) throw userProjectError;

    // education + courses
    const { data: userEducation, error: userEducationError } = await supabase
      .from("education")
      .select()
      .eq("user_id", user.id);

    if (userEducationError) throw userEducationError;

    const userEducationWithCourses: IUserEducation[] = [];

    for (const education of userEducation) {
      const { data: educationCourses, error: educationCoursesError } =
        await supabase
          .from("course")
          .select("name, grade, description")
          .eq("user_id", user.id)
          .eq("education_id", education.id);
      if (educationCoursesError) throw educationCoursesError;

      const { _user_id, ...cleanedEducation } = education;
      const educationWithCourses = {
        ...cleanedEducation,
        courses: educationCourses,
      };

      userEducationWithCourses.push(educationWithCourses);
    }

    // api_keys
    const { data: userApiKeys, error: userApiKeysError } = await supabase
      .from("api_keys")
      .select("created, expires, description, last_used")
      .eq("user_id", user.id);
    if (userApiKeysError) throw userApiKeysError;

    // public_api_logs
    const { data: publicApiLogs, error: publicApiLogsError } = await supabase
      .from("public_api_logs")
      .select(
        "key_description, user_agent, requested_at, responded_at, status_code"
      )
      .eq("user_id", user.id);
    if (publicApiLogsError) throw publicApiLogsError;

    // construct the super object
    const userInfoInternal: IUserInfoInternal = {
      ...userData,
      skills: userSkills,
      experiences: userExperience,
      projects: userProject,
      education: userEducationWithCourses,
      api_keys: userApiKeys,
      public_api_logs: publicApiLogs,
    };

    return NextResponse.json({ userInfoInternal }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error.message);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
