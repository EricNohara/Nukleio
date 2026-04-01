import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { ISkills, ISkillsInput } from "@/app/interfaces/ISkills";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { refreshCachedUserInfo } from "@/utils/cachedUserInfo/refreshCachedUserInfo";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { data, error } = await supabase
      .from("skills")
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

    // validate body
    const skill: ISkillsInput = await req.json();
    const skillValidationResponse = validateSkill(skill);
    if (skillValidationResponse) return skillValidationResponse;

    const id = randomUUID();

    const payload: ISkills = {
      id: id,
      user_id: user.id,
      ...skill,
    };

    const { error } = await supabase.from("skills").insert(payload);
    if (error) throw error;

    // update the user info cache
    await refreshCachedUserInfo(supabase, user.id);

    return NextResponse.json(
      { message: "Successfully created skill", id },
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

    // validate input
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Invalid skill id" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("skills")
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

    // validate body
    const sentData = await req.json();
    const id = sentData.id;
    if (!id) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    const updatedSkill: ISkillsInput = sentData.updatedSkill;
    const skillValidationResponse = validateSkill(updatedSkill);
    if (skillValidationResponse) return skillValidationResponse;

    const payload: ISkills = {
      id: id,
      user_id: user.id,
      ...updatedSkill,
    };

    const { error } = await supabase
      .from("skills")
      .update(payload)
      .eq("id", id)
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
