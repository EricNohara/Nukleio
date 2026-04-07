import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { requireTier } from "@/utils/auth/requireTier";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const AGENT_BASE = process.env.PROFESSIONAL_HEADSHOT_AGENT_BASE_URL;

// types
type HeadshotLayout = "1024x1024" | "1536x1024" | "1024x1536" | "auto";

type GenerateProfessionalHeadshotBody = {
  referenceUrl: string;
  backgroundDescription: string | null;
  backgroundUrl?: string;
  layout: HeadshotLayout;
};

type ReviseProfessionalHeadshotBody = {
  headshotUrl: string;
  feedback: string;
  layout: HeadshotLayout;
};

// type check functions
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isHeadshotLayout(value: unknown): value is HeadshotLayout {
  return (
    value === "1024x1024" ||
    value === "1536x1024" ||
    value === "1024x1536" ||
    value === "auto"
  );
}

function hasOnlyAllowedKeys(
  obj: Record<string, unknown>,
  allowedKeys: string[],
): boolean {
  return Object.keys(obj).every((key) => allowedKeys.includes(key));
}

function isGenerateProfessionalHeadshotBody(
  body: unknown,
): body is GenerateProfessionalHeadshotBody {
  if (!body || typeof body !== "object") return false;

  const obj = body as Record<string, unknown>;

  if (
    !hasOnlyAllowedKeys(obj, [
      "referenceUrl",
      "backgroundDescription",
      "backgroundUrl",
      "layout",
    ])
  ) {
    return false;
  }

  if (!isString(obj.referenceUrl)) return false;
  if (!isNullableString(obj.backgroundDescription)) return false;
  if (obj.backgroundUrl !== undefined && !isString(obj.backgroundUrl)) {
    return false;
  }
  if (!isHeadshotLayout(obj.layout)) return false;

  return true;
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

export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  // gate this feature
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

    if (!isGenerateProfessionalHeadshotBody(body)) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const agentRes = await fetch(`${AGENT_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await agentRes.json().catch(() => null);
    const url: string | null = data?.publicUrl ?? null;
    const validation = data?.validation ?? null;

    if (!agentRes.ok || !data || !data.success || !url || !validation) {
      return NextResponse.json(
        { error: data?.error ?? "Professional headshot generation failed" },
        { status: 502 },
      );
    }

    // insert into cached_professional_headshots table
    const supabase = await createClient();
    const cachedProfessionalHeadshotId = randomUUID();

    const cachePayload = {
      id: cachedProfessionalHeadshotId,
      user_id: user.id,
      url,
      validation,
    };

    const { error } = await supabase
      .from("cached_professional_headshots")
      .insert(cachePayload);
    if (error) {
      throw new Error(`Cache insert failed: ${error.message}`);
    }

    return NextResponse.json(
      { id: cachedProfessionalHeadshotId, validation, url },
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

  // gate this feature
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
    const url: string | null = data?.publicUrl ?? null;
    const validation = data?.validation ?? null;

    if (!agentRes.ok || !data || !data.success || !url || !validation) {
      return NextResponse.json(
        { error: data?.error ?? "Professional headshot revision failed" },
        { status: 502 },
      );
    }

    // insert into cached_professional_headshots table
    const supabase = await createClient();
    const cacheId = randomUUID();
    const cachePayload = {
      id: cacheId,
      user_id: user.id,
      url,
      validation,
    };

    const { error } = await supabase
      .from("cached_professional_headshots")
      .insert(cachePayload);
    if (error) {
      throw new Error(`Revision caching failed: ${error?.message}`);
    }

    return NextResponse.json({ id: cacheId, url, validation }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
