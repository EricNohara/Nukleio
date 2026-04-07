import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { requireTier } from "@/utils/auth/requireTier";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const AGENT_BASE = process.env.RESUME_AGENT_BASE_URL;

// types
type GenerationType = "generate" | "generateAi";

type GenerateResumeBody = {
  generationType: "generate";
  templateId?: string;
  educationIds?: string[];
  experienceIds?: string[];
  courseIds?: string[];
  projectIds?: string[];
  skillIds?: string[];
};

type GenerateResumeWithAiBody = {
  generationType: "generateAi";
  templateId?: string;
  targetJobs?: string[];
};

type RequestBody = GenerateResumeBody | GenerateResumeWithAiBody;

// type guard functions
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isGenerationType(value: unknown): value is GenerationType {
  return value === "generate" || value === "generateAi";
}

function hasOnlyAllowedKeys(
  obj: Record<string, unknown>,
  allowedKeys: string[],
): boolean {
  return Object.keys(obj).every((key) => allowedKeys.includes(key));
}

function isGenerateResumeBody(body: unknown): body is GenerateResumeBody {
  if (!body || typeof body !== "object") return false;

  const obj = body as Record<string, unknown>;

  if (obj.generationType !== "generate") return false;

  if (
    !hasOnlyAllowedKeys(obj, [
      "generationType",
      "templateId",
      "educationIds",
      "experienceIds",
      "courseIds",
      "projectIds",
      "skillIds",
    ])
  ) {
    return false;
  }

  if (obj.templateId !== undefined && !isString(obj.templateId)) return false;
  if (obj.educationIds !== undefined && !isStringArray(obj.educationIds))
    return false;
  if (obj.experienceIds !== undefined && !isStringArray(obj.experienceIds))
    return false;
  if (obj.courseIds !== undefined && !isStringArray(obj.courseIds))
    return false;
  if (obj.projectIds !== undefined && !isStringArray(obj.projectIds))
    return false;
  if (obj.skillIds !== undefined && !isStringArray(obj.skillIds)) return false;

  return true;
}

function isGenerateResumeWithAiBody(
  body: unknown,
): body is GenerateResumeWithAiBody {
  if (!body || typeof body !== "object") return false;

  const obj = body as Record<string, unknown>;

  if (obj.generationType !== "generateAi") return false;

  if (
    !hasOnlyAllowedKeys(obj, ["generationType", "templateId", "targetJobs"])
  ) {
    return false;
  }

  if (obj.templateId !== undefined && !isString(obj.templateId)) return false;
  if (obj.targetJobs !== undefined && !isStringArray(obj.targetJobs))
    return false;

  return true;
}

/**
 * GET: list all cached resumes (metadata only)
 * Cached resumes should only be available to premium users - one shot generations should not be saved
 */
export async function GET(_req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    const supabase = await createClient();

    // retrieve all user's generated resumes from cache
    const { data, error } = await supabase.rpc("get_latest_cached_resumes", {
      p_user_id: user.id,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = data ?? [];

    return NextResponse.json({ items }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST -> calls agent /generate -> returns JSON
 */
export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  // gate this feature
  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    if (!AGENT_BASE) {
      return NextResponse.json(
        { error: "Server misconfigured: missing RESUME_AGENT_BASE_URL" },
        { status: 500 },
      );
    }

    const rawBody: unknown = await req.json();

    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const generationType = (rawBody as Record<string, unknown>).generationType;

    if (!isGenerationType(generationType)) {
      return NextResponse.json(
        { error: "Invalid generationType." },
        { status: 400 },
      );
    }

    if (generationType === "generate" && !isGenerateResumeBody(rawBody)) {
      return NextResponse.json(
        { error: "Invalid body for generationType 'generate'." },
        { status: 400 },
      );
    }

    if (
      generationType === "generateAi" &&
      !isGenerateResumeWithAiBody(rawBody)
    ) {
      return NextResponse.json(
        { error: "Invalid body for generationType 'generateAi'." },
        { status: 400 },
      );
    }

    const payload = {
      ...(rawBody as RequestBody),
      userId: user.id,
    };

    const agentRes = await fetch(`${AGENT_BASE}/${generationType}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await agentRes.json().catch(() => null);
    const url: string | null = data?.resumeUrl ?? null;

    if (!agentRes.ok || !data || data?.success === false || !url) {
      return NextResponse.json(
        { error: data?.error ?? "Resume generation failed" },
        { status: agentRes.status || 502 },
      );
    }

    // insert into cached_resumes table
    const cachedResumeId = randomUUID();
    const supabase = await createClient();

    const cachedResumePayload = {
      id: cachedResumeId,
      user_id: user.id,
      url,
    };

    const { error } = await supabase
      .from("cached_resumes")
      .insert(cachedResumePayload);

    if (error) {
      throw new Error(`Resume cache insert failed: ${error.message}`);
    }

    return NextResponse.json({ url, id: cachedResumeId }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
