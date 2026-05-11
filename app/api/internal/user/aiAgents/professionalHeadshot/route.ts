import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { requireTier } from "@/utils/auth/requireTier";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const AGENT_BASE = process.env.PROFESSIONAL_HEADSHOT_AGENT_BASE_URL;
const STORAGE_BUCKET = "professional_headshots";

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
  referenceUrl: string;
  backgroundDescription: string | null;
  backgroundUrl?: string;
  attire: HeadshotAttire;
  layout: HeadshotLayout;
};

type ReviseProfessionalHeadshotBody = {
  headshotUrl: string;
  feedback: string;
  layout: HeadshotLayout;
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
  allowedKeys: string[],
): boolean {
  return Object.keys(obj).every((key) => allowedKeys.includes(key));
}

function isReviseProfessionalHeadshotBody(
  body: unknown,
): body is ReviseProfessionalHeadshotBody {
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
    const supabase = await createClient();

    const { data, error } = await supabase.rpc(
      "get_latest_cached_professional_headshots",
      { p_user_id: user.id },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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

  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    if (!AGENT_BASE) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: missing PROFESSIONAL_HEADSHOT_AGENT_BASE_URL",
        },
        { status: 500 },
      );
    }

    const formData = await req.formData();

    const referenceImage = formData.get("referenceImage");
    const backgroundImage = formData.get("backgroundImage");
    const backgroundDescriptionRaw = formData.get("backgroundDescription");
    const attireRaw = formData.get("attire");
    const layoutRaw = formData.get("layout");

    if (!(referenceImage instanceof File)) {
      return NextResponse.json(
        { error: "Missing reference image." },
        { status: 400 },
      );
    }

    if (!referenceImage.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Reference file must be an image." },
        { status: 400 },
      );
    }

    if (backgroundImage !== null && !(backgroundImage instanceof File)) {
      return NextResponse.json(
        { error: "Background image must be a file." },
        { status: 400 },
      );
    }

    if (
      backgroundImage instanceof File &&
      !backgroundImage.type.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "Background file must be an image." },
        { status: 400 },
      );
    }

    if (
      backgroundDescriptionRaw !== null &&
      typeof backgroundDescriptionRaw !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid background description." },
        { status: 400 },
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

    const supabase = await createClient();

    const referenceImageId = randomUUID();
    const referenceExtension = getImageExtension(referenceImage);
    const referenceStoragePath = `inputs/${user.id}/reference-${referenceImageId}.${referenceExtension}`;

    const { error: referenceUploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(referenceStoragePath, referenceImage, {
        contentType: referenceImage.type,
        upsert: false,
      });

    if (referenceUploadError) {
      throw new Error(
        `Reference image upload failed: ${referenceUploadError.message}`,
      );
    }

    const { data: referencePublicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(referenceStoragePath);

    const referenceUrl = referencePublicUrlData.publicUrl;

    let backgroundUrl: string | undefined;

    if (backgroundImage instanceof File) {
      const backgroundImageId = randomUUID();
      const backgroundExtension = getImageExtension(backgroundImage);
      const backgroundStoragePath = `inputs/${user.id}/background-${backgroundImageId}.${backgroundExtension}`;

      const { error: backgroundUploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(backgroundStoragePath, backgroundImage, {
          contentType: backgroundImage.type,
          upsert: false,
        });

      if (backgroundUploadError) {
        throw new Error(
          `Background image upload failed: ${backgroundUploadError.message}`,
        );
      }

      const { data: backgroundPublicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(backgroundStoragePath);

      backgroundUrl = backgroundPublicUrlData.publicUrl;
    }

    const agentPayload: GenerateProfessionalHeadshotBody = {
      referenceUrl,
      backgroundDescription,
      backgroundUrl,
      attire: attireRaw,
      layout: layoutRaw,
    };

    const agentRes = await fetch(`${AGENT_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentPayload),
    });

    const data = await agentRes.json().catch(() => null);

    const generatedUrl: string | null = data?.publicUrl ?? null;
    const validation = data?.validation ?? null;

    console.log(data);

    // look here
    if (
      !agentRes.ok ||
      !data ||
      !data.success ||
      !generatedUrl ||
      !validation
    ) {
      return NextResponse.json(
        { error: data?.error ?? "Professional headshot generation failed" },
        { status: 502 },
      );
    }

    const cachedProfessionalHeadshotId = randomUUID();

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

    const { error: cacheError } = await supabase
      .from("cached_professional_headshots")
      .insert(cachePayload);

    if (cacheError) {
      throw new Error(`Cache insert failed: ${cacheError.message}`);
    }

    return NextResponse.json(
      {
        id: cachedProfessionalHeadshotId,
        url: generatedUrl,
        referenceUrl,
        backgroundUrl: backgroundUrl ?? null,
        validation,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    if (!AGENT_BASE) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: missing PROFESSIONAL_HEADSHOT_AGENT_BASE_URL",
        },
        { status: 500 },
      );
    }

    const body: unknown = await req.json();

    if (!isReviseProfessionalHeadshotBody(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const agentRes = await fetch(`${AGENT_BASE}/revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
      return NextResponse.json(
        { error: data?.error ?? "Professional headshot revision failed" },
        { status: 502 },
      );
    }

    const supabase = await createClient();
    const cacheId = randomUUID();

    const cachePayload = {
      id: cacheId,
      user_id: user.id,
      generated_url: generatedUrl,
      validation,
    };

    const { error } = await supabase
      .from("cached_professional_headshots")
      .insert(cachePayload);

    if (error) {
      throw new Error(`Revision caching failed: ${error.message}`);
    }

    return NextResponse.json(
      { id: cacheId, url: generatedUrl, validation },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
