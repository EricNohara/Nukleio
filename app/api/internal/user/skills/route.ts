import { NextRequest, NextResponse } from "next/server";

import { ISkills, ISkillsInput } from "@/app/interfaces/ISkills";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const skillName = req.nextUrl.searchParams.get("skillName");

    if (skillName) {
      const { data, error } = await supabase
        .from("skills")
        .select()
        .eq("user_id", user.id)
        .eq("name", skillName);

      if (error) throw error;

      return NextResponse.json(data, { status: 200 });
    } else {
      const { data, error } = await supabase
        .from("skills")
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

    // validate body
    const sentSkill: ISkillsInput = await req.json();
    const skillValidationResponse = validateSkill(sentSkill);
    if (skillValidationResponse) return skillValidationResponse;

    const skillData: ISkills = {
      ...sentSkill,
      user_id: user.id,
    };

    const { error } = await supabase.from("skills").insert(skillData);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully created skill" },
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

    // validate input
    const skillName = req.nextUrl.searchParams.get("skillName");

    if (!skillName) {
      return NextResponse.json(
        { message: "Invalid skill name" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("skills")
      .delete()
      .eq("name", skillName)
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

    // validate body
    const sentData = await req.json();
    const skillName = sentData.skillName;
    if (!skillName)
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });

    const updatedSkill: ISkillsInput = sentData.updatedSkill;
    const skillValidationResponse = validateSkill(updatedSkill);
    if (skillValidationResponse) return skillValidationResponse;

    const skillData: ISkills = {
      ...updatedSkill,
      user_id: user.id,
    };

    const { error } = await supabase
      .from("skills")
      .update(skillData)
      .eq("name", skillName)
      .eq("user_id", user.id);

    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully updated skill" },
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

// helper function to validate a skill input
function validateSkill(skill: ISkillsInput): NextResponse | undefined {
  if (
    !skill ||
    !skill.name ||
    typeof skill.name !== "string" ||
    skill.name.trim() === ""
  )
    return NextResponse.json({ message: "Missing data" }, { status: 400 });

  if (
    skill.years_of_experience &&
    typeof skill.years_of_experience === "number" &&
    (skill.years_of_experience < 0 || skill.years_of_experience > 100)
  ) {
    return NextResponse.json(
      { message: "Years of experience must be between 0 and 100" },
      { status: 400 },
    );
  }

  if (
    skill.proficiency &&
    typeof skill.proficiency === "number" &&
    (skill.proficiency < 0 || skill.proficiency > 10)
  ) {
    return NextResponse.json(
      { message: "Skill proficiency must be between 0 and 10" },
      { status: 400 },
    );
  }
}
