import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { IUserInfoInternal } from "@/app/interfaces/IUserInfoInternal";
import { AgentAwsConfigurationError } from "@/utils/aiAgents/awsConfig";
import {
  finalizeAiCacheSlot,
  releaseAiCacheSlot,
  reserveAiCacheSlot,
} from "@/utils/aiAgents/cacheRetention";
import { invokeAiAgent } from "@/utils/aiAgents/client";
import {
  GlobalAiBudgetServiceError,
  logGlobalAiBudgetUsage,
  reserveGlobalAiBudget,
} from "@/utils/aiAgents/globalBudget";
import { AiAgentOperation } from "@/utils/aiAgents/operations";
import {
  AiRateLimitServiceError,
  consumeAiRateLimit,
} from "@/utils/aiAgents/rateLimit";
import { createAiRateLimitResponse } from "@/utils/aiAgents/rateLimitResponse";
import { getAiRequestId } from "@/utils/aiAgents/requestId";
import { AI_CREDIT_COSTS } from "@/utils/aiCredits/config";
import {
  AiGenerationCharge,
  AiGenerationRequestError,
  chargeAiGeneration,
  DuplicateAiGenerationError,
  refundAiGeneration,
} from "@/utils/aiCredits/generation";
import { InsufficientAiCreditsError } from "@/utils/aiCredits/service";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { getUserSubscriptionTier } from "@/utils/auth/getUserSubscriptionTier";
import { requireTier } from "@/utils/auth/requireTier";
import { requireVerifiedEmailForAi } from "@/utils/auth/requireVerifiedEmail";
import parseURL from "@/utils/general/parseURL";
import { createAdminClient } from "@/utils/supabase/server";

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

type ResumeUserInfo = {
  email: string;
  name?: string;
  bio?: string;
  phone_number?: string;
  current_address?: string;
  current_position?: string;
  current_company?: string;
  github_url?: string;
  linkedin_url?: string;
  portrait_url?: string;
  resume_url?: string;
  transcript_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  x_url?: string;
  skills: {
    name: string;
    proficiency?: number;
    years_of_experience?: number;
  }[];
  experiences: {
    company: string;
    job_title: string;
    date_start: string;
    date_end?: string;
    job_description: string;
  }[];
  projects: {
    name: string;
    date_start: string;
    date_end: string;
    languages_used?: string[];
    frameworks_used?: string[];
    technologies_used?: string[];
    description: string;
    github_url?: string;
    demo_url?: string;
  }[];
  education: {
    degree: string;
    majors: string[];
    minors: string[];
    gpa?: string;
    institution: string;
    awards: string[];
    year_start: number;
    year_end?: number;
    courses: {
      name: string;
      grade?: string;
      description?: string;
    }[];
  }[];
};

type ResumeSelectionIds = {
  educationIds?: string[];
  experienceIds?: string[];
  courseIds?: string[];
  projectIds?: string[];
  skillIds?: string[];
};

type ResumeAgentPayload = {
  userId: string;
  userInfo: ResumeUserInfo;
  templateId?: string;
  targetJobs?: string[];
  deliveryMode: "cached" | "transient";
};

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

function filterByIds<T extends { id: string }>(
  items: T[],
  ids?: string[],
): T[] {
  if (ids === undefined) return items;

  const selectedIds = new Set(ids);
  return items.filter((item) => selectedIds.has(item.id));
}

function mapUserInfoForResume(
  userInfo: IUserInfoInternal,
  selections: ResumeSelectionIds = {},
): ResumeUserInfo {
  return {
    email: userInfo.email,
    ...(userInfo.name ? { name: userInfo.name } : {}),
    ...(userInfo.bio ? { bio: userInfo.bio } : {}),
    ...(userInfo.phone_number ? { phone_number: userInfo.phone_number } : {}),
    ...(userInfo.current_address
      ? { current_address: userInfo.current_address }
      : {}),
    ...(userInfo.current_position
      ? { current_position: userInfo.current_position }
      : {}),
    ...(userInfo.current_company
      ? { current_company: userInfo.current_company }
      : {}),
    ...(userInfo.github_url ? { github_url: userInfo.github_url } : {}),
    ...(userInfo.linkedin_url ? { linkedin_url: userInfo.linkedin_url } : {}),
    ...(userInfo.portrait_url ? { portrait_url: userInfo.portrait_url } : {}),
    ...(userInfo.resume_url ? { resume_url: userInfo.resume_url } : {}),
    ...(userInfo.transcript_url
      ? { transcript_url: userInfo.transcript_url }
      : {}),
    ...(userInfo.facebook_url ? { facebook_url: userInfo.facebook_url } : {}),
    ...(userInfo.instagram_url
      ? { instagram_url: userInfo.instagram_url }
      : {}),
    ...(userInfo.x_url ? { x_url: userInfo.x_url } : {}),

    skills: filterByIds(userInfo.skills, selections.skillIds).map((skill) => ({
      name: skill.name,
      ...(skill.proficiency !== null ? { proficiency: skill.proficiency } : {}),
      ...(skill.years_of_experience !== null
        ? { years_of_experience: skill.years_of_experience }
        : {}),
    })),

    experiences: filterByIds(
      userInfo.experiences,
      selections.experienceIds,
    ).map((experience) => ({
      company: experience.company,
      job_title: experience.job_title,
      date_start: experience.date_start ?? "",
      ...(experience.date_end ? { date_end: experience.date_end } : {}),
      job_description: experience.job_description ?? "",
    })),

    projects: filterByIds(userInfo.projects, selections.projectIds).map(
      (project) => ({
        name: project.name,
        date_start: project.date_start,
        date_end: project.date_end,
        ...(project.languages_used
          ? { languages_used: project.languages_used }
          : {}),
        ...(project.frameworks_used
          ? { frameworks_used: project.frameworks_used }
          : {}),
        ...(project.technologies_used
          ? { technologies_used: project.technologies_used }
          : {}),
        description: project.description,
        ...(project.github_url ? { github_url: project.github_url } : {}),
        ...(project.demo_url ? { demo_url: project.demo_url } : {}),
      }),
    ),

    education: filterByIds(userInfo.education, selections.educationIds).map(
      (education) => ({
        degree: education.degree,
        majors: education.majors,
        minors: education.minors,
        ...(education.gpa !== null ? { gpa: String(education.gpa) } : {}),
        institution: education.institution,
        awards: education.awards,
        year_start: education.year_start ?? 0,
        ...(education.year_end !== null
          ? { year_end: education.year_end }
          : {}),
        courses: filterByIds(education.courses, selections.courseIds).map(
          (course) => ({
            name: course.name,
            ...(course.grade ? { grade: course.grade } : {}),
            ...(course.description ? { description: course.description } : {}),
          }),
        ),
      }),
    ),
  };
}

/**
 * GET: list all cached resumes (metadata only)
 * Cached resumes should only be available to premium users - one shot generations should not be saved
 */
export async function GET(_req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  const gate = await requireTier(user.id, "developer");
  if (!gate.ok) return gate.response;

  try {
    const admin = createAdminClient();

    // retrieve all user's generated resumes from cache
    const { data, error } = await admin
      .from("cached_resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
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
  const { user, supabase, response } = await getAuthenticatedUser();
  if (!user) return response;
  const emailGate = requireVerifiedEmailForAi(user);
  if (emailGate) return emailGate;

  let charge: AiGenerationCharge | null = null;
  let cacheReservationId: string | null = null;

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

    const body = rawBody as RequestBody;
    const isPremium = (await getUserSubscriptionTier(user.id)) !== "free";

    const { data: internalUserInfo, error: userInfoError } = await supabase.rpc(
      "get_user_info_internal",
      {
        p_user_id: user.id,
      },
    );

    if (userInfoError) {
      console.error("User info RPC failed:", userInfoError);
      return NextResponse.json(
        { error: "Unable to retrieve user information." },
        { status: 500 },
      );
    }

    if (!internalUserInfo) {
      return NextResponse.json(
        { error: "User information was not found." },
        { status: 404 },
      );
    }

    const userInfo = internalUserInfo as IUserInfoInternal;
    let payload: ResumeAgentPayload;

    if (generationType === "generate") {
      const generateBody = body as GenerateResumeBody;
      payload = {
        userId: user.id,
        userInfo: mapUserInfoForResume(userInfo, generateBody),
        ...(generateBody.templateId
          ? { templateId: generateBody.templateId }
          : {}),
        deliveryMode: isPremium ? "cached" : "transient",
      };
    } else {
      const generateAiBody = body as GenerateResumeWithAiBody;
      payload = {
        userId: user.id,
        userInfo: mapUserInfoForResume(userInfo),
        ...(generateAiBody.templateId
          ? { templateId: generateAiBody.templateId }
          : {}),
        ...(generateAiBody.targetJobs
          ? { targetJobs: generateAiBody.targetJobs }
          : {}),
        deliveryMode: isPremium ? "cached" : "transient",
      };
    }

    const operation: AiAgentOperation =
      generationType === "generateAi"
        ? "resume_generate_ai"
        : "resume_generate";
    const requestId = getAiRequestId(req);
    const rateLimit = await consumeAiRateLimit({
      operation,
      requestId,
      userId: user.id,
    });

    if (!rateLimit.allowed) {
      return createAiRateLimitResponse(operation, rateLimit);
    }

    const budget = await reserveGlobalAiBudget({ operation });
    logGlobalAiBudgetUsage(budget, operation);
    if (!budget.allowed) {
      return NextResponse.json(
        {
          code: "AI_GLOBAL_DAILY_BUDGET_EXCEEDED",
          error: "AI generation is temporarily unavailable.",
        },
        { status: 503 },
      );
    }

    charge = await chargeAiGeneration(
      req,
      user.id,
      `resume_${generationType}`,
      AI_CREDIT_COSTS.resume[generationType],
    );
    if (isPremium) {
      cacheReservationId = await reserveAiCacheSlot(user.id);
    }

    const agentRes = await invokeAiAgent({
      baseUrl: AGENT_BASE,
      path: generationType,
      body: payload,
      operation,
      requestId,
      userId: user.id,
    });

    const data = await agentRes.json().catch(() => null);
    const url: string | null = data?.resumeUrl ?? null;
    const transientPdfBase64: string | null = data?.pdfBase64 ?? null;

    if (!agentRes.ok || !data || data?.success === false || (!url && !transientPdfBase64)) {
      throw new AiGenerationRequestError(
        data?.error ?? "Resume generation failed",
        502,
      );
    }

    let cachedResumeId: string | null = null;

    if (isPremium && url) {
      const admin = createAdminClient();
      if (!cacheReservationId) throw new Error("Missing AI cache reservation");
      cachedResumeId = randomUUID();
      const cachedResumePayload = {
        id: cachedResumeId,
        user_id: user.id,
        url,
      };

      const { error } = await admin
        .from("cached_resumes")
        .insert(cachedResumePayload);
      if (error) {
        const object = parseURL(url);
        if (object) {
          await admin.storage.from(object.parsedBucket)
            .remove([object.parsedFilename]);
          await admin.from("storage_quota_ledger").delete()
            .eq("bucket", object.parsedBucket)
            .eq("object_path", object.parsedFilename);
        }
        throw new Error(`Resume cache insert failed: ${error.message}`);
      }
      try {
        await finalizeAiCacheSlot(cacheReservationId);
      } catch (finalizeError) {
        await admin.from("cached_resumes").delete()
          .eq("id", cachedResumeId).eq("user_id", user.id);
        const object = parseURL(url);
        if (object) {
          await admin.storage.from(object.parsedBucket).remove([object.parsedFilename]);
          await admin.from("storage_quota_ledger").delete()
            .eq("bucket", object.parsedBucket).eq("object_path", object.parsedFilename);
        }
        throw finalizeError;
      }
      cacheReservationId = null;
    }

    return NextResponse.json({
      url: url ?? `data:${data.contentType ?? "application/pdf"};base64,${transientPdfBase64}`,
      id: cachedResumeId,
    }, { status: 200 });
  } catch (error) {
    if (charge) {
      try {
        await refundAiGeneration(user.id, charge);
      } catch (refundError) {
        console.error("Resume credit refund failed:", refundError);
      }
    }

    if (error instanceof InsufficientAiCreditsError) {
      return NextResponse.json(
        { error: error.message, code: "INSUFFICIENT_AI_CREDITS" },
        { status: 402 },
      );
    }

    if (error instanceof DuplicateAiGenerationError) {
      return NextResponse.json(
        { error: error.message, code: "DUPLICATE_AI_GENERATION" },
        { status: 409 },
      );
    }

    if (error instanceof AiGenerationRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    if (
      error instanceof AiRateLimitServiceError ||
      error instanceof GlobalAiBudgetServiceError ||
      error instanceof AgentAwsConfigurationError
    ) {
      console.error("AI agent security configuration error:", error);
      return NextResponse.json(
        { error: "AI generation is temporarily unavailable." },
        { status: 503 },
      );
    }

    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    if (cacheReservationId) {
      try {
        await releaseAiCacheSlot(cacheReservationId, user.id);
      } catch (error) {
        console.error("Resume cache reservation cleanup failed:", error);
      }
    }
  }
}
