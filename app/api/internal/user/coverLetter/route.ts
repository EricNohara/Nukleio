import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { requireTier } from "@/utils/auth/requireTier";

export const runtime = "nodejs";

const AGENT_BASE = process.env.COVER_LETTER_AGENT_BASE_URL;

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
        { error: "Server misconfigured: missing COVER_LETTER_AGENT_BASE_URL" },
        { status: 500 },
      );
    }

    const body = await req.json();

    // Never trust client-provided userId
    const payload = {
      ...body,
      userId: user.id,
    };

    const agentRes = await fetch(`${AGENT_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Try to return meaningful error messages
    const data = await agentRes.json().catch(() => null);

    if (!agentRes.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Cover letter generation failed" },
        { status: 502 },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * PUT -> calls agent /revise -> returns PDF bytes
 */
export async function PUT(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  // gate this feature
  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    if (!AGENT_BASE) {
      return NextResponse.json(
        { error: "Server misconfigured: missing COVER_LETTER_AGENT_BASE_URL" },
        { status: 500 },
      );
    }

    const body = await req.json();

    const agentRes = await fetch(`${AGENT_BASE}/revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!agentRes.ok) {
      const text = await agentRes.text().catch(() => "");
      return NextResponse.json(
        { error: "Cover letter revision failed", details: text },
        { status: 502 },
      );
    }

    const pdfArrayBuffer = await agentRes.arrayBuffer();

    return new NextResponse(pdfArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="cover_letter.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
