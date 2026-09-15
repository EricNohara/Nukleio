import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { isAccountActive } from "@/utils/accountDeletion/status";
import { AgentAwsConfigurationError } from "@/utils/aiAgents/awsConfig";
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
import {
  createAdminClient,
  createClient,
} from "@/utils/supabase/server";

export const runtime = "nodejs";

const AGENT_BASE = process.env.PROFESSIONAL_HEADSHOT_AGENT_BASE_URL;
const STORAGE_BUCKET = "professional_headshots";
const MAX_HEADSHOT_INPUT_BYTES = 1024 * 1024;

type HeadshotLayout = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
type HeadshotAttire =
  | "auto"
  | "business"
  | "businessCasual"
  | "smartCasual"
  | "casual"
  | "techProfessional"
  | "academic";

type GenerateProfessionalHeadshotBody = {
  userId: string;
  referenceUrl: string;
  backgroundDescription: string | null;
  backgroundUrl?: string;
  attire: HeadshotAttire;
  layout: HeadshotLayout;
  deliveryMode: "cached" | "transient";
};

type ReviseProfessionalHeadshotRequestBody = {
  headshotUrl: string;
  feedback: string;
  layout: HeadshotLayout;
};

type ReviseProfessionalHeadshotAgentBody =
  ReviseProfessionalHeadshotRequestBody & {
    userId: string;
    deliveryMode: "cached" | "transient";
  };

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isHeadshotLayout(value: unknown): value is HeadshotLayout {
  return (
    value === "1024x1024" ||
    value === "1536x1024" ||
    value === "1024x1536" ||
    value === "auto"
  );
}

function isHeadshotAttire(value: unknown): value is HeadshotAttire {
  return (
    value === "auto" ||
    value === "business" ||
    value === "businessCasual" ||
    value === "smartCasual" ||
    value === "casual" ||
    value === "techProfessional" ||
    value === "academic"
  );
}

function hasOnlyAllowedKeys(
  obj: Record<string, unknown>,
  allowedKeys: string[]
): boolean {
  return Object.keys(obj).every((key) => allowedKeys.includes(key));
}

function isReviseProfessionalHeadshotBody(
  body: unknown
): body is ReviseProfessionalHeadshotRequestBody {
  if (!body || typeof body !== "object") return false;

  const obj = body as Record<string, unknown>;

  if (!hasOnlyAllowedKeys(obj, ["headshotUrl", "feedback", "layout"])) {
    return false;
  }

  if (!isString(obj.headshotUrl)) return false;
  if (!isString(obj.feedback)) return false;
  if (!isHeadshotLayout(obj.layout)) return false;

  return true;
}

function getImageExtension(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) {
    return ext === "jpeg" ? "jpg" : ext;
  }

  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "png";
}

/**
 * GET:
 * - list all cached professional headshots for a user
 * - Cached professional headshots only available to premium users
 */
export async function GET(_req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("cached_professional_headshots")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST:
 * - accepts multipart/form-data
 * - uploads user input image to Supabase Storage
 * - sends public input image URL to professional headshot agent
 * - caches generated result in DB
 */
export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;
  const emailGate = requireVerifiedEmailForAi(user);
  if (emailGate) return emailGate;

  let charge: AiGenerationCharge | null = null;

  try {
    if (!AGENT_BASE) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: missing PROFESSIONAL_HEADSHOT_AGENT_BASE_URL",
        },
        { status: 500 }
      );
    }

    const formData = await req.formData();

    const referenceImage = formData.get("referenceImage");
    const backgroundImage = formData.get("backgroundImage");
    const backgroundDescriptionRaw = formData.get("backgroundDescription");
    const attireRaw = formData.get("attire");
    const layoutRaw = formData.get("layout") ?? "1024x1024";

    if (!(referenceImage instanceof File)) {
      return NextResponse.json(
        { error: "Missing reference image." },
        { status: 400 }
      );
    }

    if (referenceImage.size > MAX_HEADSHOT_INPUT_BYTES) {
      return NextResponse.json(
        { error: "Reference images must be 1 MB or smaller." },
        { status: 413 },
      );
    }

    if (!referenceImage.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Reference file must be an image." },
        { status: 400 }
      );
    }

    if (backgroundImage !== null && !(backgroundImage instanceof File)) {
      return NextResponse.json(
        { error: "Background image must be a file." },
        { status: 400 }
      );
    }

    if (
      backgroundImage instanceof File &&
      !backgroundImage.type.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "Background file must be an image." },
        { status: 400 }
      );
    }

    if (backgroundImage instanceof File && backgroundImage.size > MAX_HEADSHOT_INPUT_BYTES) {
      return NextResponse.json(
        { error: "Background images must be 1 MB or smaller." },
        { status: 413 },
      );
    }

    if (
      backgroundDescriptionRaw !== null &&
      typeof backgroundDescriptionRaw !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid background description." },
        { status: 400 }
      );
    }

    if (!isHeadshotLayout(layoutRaw)) {
      return NextResponse.json({ error: "Invalid layout." }, { status: 400 });
    }

    if (!isHeadshotAttire(attireRaw)) {
      return NextResponse.json({ error: "Invalid attire." }, { status: 400 });
    }

    const backgroundDescription =
      typeof backgroundDescriptionRaw === "string" &&
      backgroundDescriptionRaw.trim().length > 0
        ? backgroundDescriptionRaw.trim()
        : null;

    const isPremium = (await getUserSubscriptionTier(user.id)) === "premium";

    const operation: AiAgentOperation = "headshot_generate";
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
      "headshot_generate",
      AI_CREDIT_COSTS.headshot.generate,
    );

    const supabase = await createClient();
    const storageAdmin = createAdminClient();

    const referenceImageId = randomUUID();
    const referenceExtension = getImageExtension(referenceImage);
    const referenceStoragePath = `inputs/${user.id}/reference-${referenceImageId}.${referenceExtension}`;

    const { error: referenceUploadError } = await storageAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(referenceStoragePath, referenceImage, {
        contentType: referenceImage.type,
        upsert: false,
      });

    if (referenceUploadError) {
      throw new Error(
        `Reference image upload failed: ${referenceUploadError.message}`
      );
    }

    const { data: referencePublicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(referenceStoragePath);

    const referenceUrl = referencePublicUrlData.publicUrl;

    let backgroundUrl: string | undefined;
    const uploadedInputPaths = [referenceStoragePath];

    if (backgroundImage instanceof File) {
      const backgroundImageId = randomUUID();
      const backgroundExtension = getImageExtension(backgroundImage);
      const backgroundStoragePath = `inputs/${user.id}/background-${backgroundImageId}.${backgroundExtension}`;

      const { error: backgroundUploadError } = await storageAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(backgroundStoragePath, backgroundImage, {
          contentType: backgroundImage.type,
          upsert: false,
        });

      if (backgroundUploadError) {
        await storageAdmin.storage
          .from(STORAGE_BUCKET)
          .remove(uploadedInputPaths);
        throw new Error(
          `Background image upload failed: ${backgroundUploadError.message}`
        );
      }

      uploadedInputPaths.push(backgroundStoragePath);

      const { data: backgroundPublicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(backgroundStoragePath);

      backgroundUrl = backgroundPublicUrlData.publicUrl;
    }

    // Close the race where this request authenticated just before deletion
    // acquired its lock, then finished its service-role uploads afterward.
    if (!await isAccountActive(user.id)) {
      await storageAdmin.storage
        .from(STORAGE_BUCKET)
        .remove(uploadedInputPaths);
      throw new AiGenerationRequestError(
        "Account deletion is in progress.",
        423,
      );
    }

    const agentPayload: GenerateProfessionalHeadshotBody = {
      userId: user.id,
      referenceUrl,
      backgroundDescription,
      backgroundUrl,
      attire: attireRaw,
      layout: layoutRaw,
      deliveryMode: isPremium ? "cached" : "transient",
    };

    const agentRes = await invokeAiAgent({
      baseUrl: AGENT_BASE,
      path: "generate",
      body: agentPayload,
      operation,
      requestId,
      userId: user.id,
    });

    const data = await agentRes.json().catch(() => null);

    const generatedUrl: string | null = data?.publicUrl ?? null;
    const transientImageBase64: string | null = data?.imageBase64 ?? null;
    const validation = data?.validation ?? null;

    if (
      !agentRes.ok ||
      !data ||
      !data.success ||
      (!generatedUrl && !transientImageBase64) ||
      !validation
    ) {
      throw new AiGenerationRequestError(
        data?.error ?? "Professional headshot generation failed",
        502,
      );
    }

    let cachedProfessionalHeadshotId: string | null = null;

    if (isPremium && generatedUrl) {
      cachedProfessionalHeadshotId = randomUUID();
      const cachePayload = {
        id: cachedProfessionalHeadshotId,
        user_id: user.id,
        generated_url: generatedUrl,
        reference_url: referenceUrl,
        background_url: backgroundUrl ?? null,
        background_description: backgroundDescription,
        attire: attireRaw,
        layout: layoutRaw,
        validation,
      };

      const { error: cacheError } = await storageAdmin
        .from("cached_professional_headshots")
        .insert(cachePayload);

      if (cacheError) {
        throw new Error(`Cache insert failed: ${cacheError.message}`);
      }
    }

    if (!isPremium) {
      await storageAdmin.storage.from(STORAGE_BUCKET).remove(uploadedInputPaths);
    }

    return NextResponse.json(
      isPremium
        ? {
            id: cachedProfessionalHeadshotId,
            url: generatedUrl,
            referenceUrl,
            backgroundUrl: backgroundUrl ?? null,
            validation,
          }
        : {
            url: `data:${data.contentType ?? "image/jpeg"};base64,${transientImageBase64}`,
          },
      { status: 200 }
    );
  } catch (error) {
    if (charge) {
      try {
        await refundAiGeneration(user.id, charge);
      } catch (refundError) {
        console.error("Headshot credit refund failed:", refundError);
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
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;
  const emailGate = requireVerifiedEmailForAi(user);
  if (emailGate) return emailGate;

  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  let charge: AiGenerationCharge | null = null;

  try {
    if (!AGENT_BASE) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: missing PROFESSIONAL_HEADSHOT_AGENT_BASE_URL",
        },
        { status: 500 }
      );
    }

    const body: unknown = await req.json();

    if (!isReviseProfessionalHeadshotBody(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const operation: AiAgentOperation = "headshot_revise";
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
      "headshot_revise",
      AI_CREDIT_COSTS.headshot.revise,
    );

    const agentPayload: ReviseProfessionalHeadshotAgentBody = {
      ...body,
      userId: user.id,
      deliveryMode: "cached",
    };

    const agentRes = await invokeAiAgent({
      baseUrl: AGENT_BASE,
      path: "revise",
      body: agentPayload,
      operation,
      requestId,
      userId: user.id,
    });

    const data = await agentRes.json().catch(() => null);

    const generatedUrl: string | null = data?.publicUrl ?? null;
    const validation = data?.validation ?? null;

    if (
      !agentRes.ok ||
      !data ||
      !data.success ||
      !generatedUrl ||
      !validation
    ) {
      throw new AiGenerationRequestError(
        data?.error ?? "Professional headshot revision failed",
        502,
      );
    }

    const admin = createAdminClient();
    const cacheId = randomUUID();

    const cachePayload = {
      id: cacheId,
      user_id: user.id,
      generated_url: generatedUrl,
      validation,
    };

    const { error } = await admin
      .from("cached_professional_headshots")
      .insert(cachePayload);

    if (error) {
      throw new Error(`Revision caching failed: ${error.message}`);
    }

    return NextResponse.json(
      { id: cacheId, url: generatedUrl, validation },
      { status: 200 }
    );
  } catch (error) {
    if (charge) {
      try {
        await refundAiGeneration(user.id, charge);
      } catch (refundError) {
        console.error("Headshot revision credit refund failed:", refundError);
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
      { status: 500 }
    );
  }
}
