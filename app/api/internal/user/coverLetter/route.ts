import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";

import { ICachedCoverLetter } from "@/app/interfaces/ICachedCoverLetter";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { requireTier } from "@/utils/auth/requireTier";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const AGENT_BASE = process.env.COVER_LETTER_AGENT_BASE_URL;

function getNowFormatted() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * GET:
 * - ?mode=list  -> list all cached cover letters (metadata only)
 * - ?sessionId=... -> fetch all drafts for that session (full rows)
 * - Cached cover letters should only be available to premium users - one shot generations should not be saved
 */
export async function GET(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("mode");
    const sessionId = searchParams.get("sessionId");

    // Case 1: list view (latest draft per conversation)
    if (mode === "list") {
      const { data, error } = await supabase.rpc(
        "get_latest_cached_cover_letters",
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Ensure newest-first globally (RPC returns grouped order; this makes UI nice)
      const items = (data ?? []).sort(
        // eslint-disable-next-line
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return NextResponse.json({ items }, { status: 200 });
    }

    // Case 2: fetch all drafts for a conversation (full rows)
    if (sessionId) {
      const { data, error } = await supabase.rpc(
        "get_cached_cover_letters_by_session",
        { p_session_id: sessionId },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ items: data ?? [] }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid query params." },
      { status: 400 },
    );
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
        { error: "Server misconfigured: missing COVER_LETTER_AGENT_BASE_URL" },
        { status: 500 },
      );
    }

    const body = await req.json();

    const payload = {
      ...body,
      userId: user.id,
    };

    const agentRes = await fetch(`${AGENT_BASE}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await agentRes.json().catch(() => null);

    if (!agentRes.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Cover letter generation failed" },
        { status: 502 },
      );
    }

    // insert into cached_cover_letters table
    const draft: string = data?.currentDraft ?? "";
    const jobData = data?.jobData ?? null;
    const writingAnalysis = data?.writingAnalysis ?? null;
    const writingSample = data?.writingSample ?? null;
    const skillsMatchScore = data?.skillsMatchScore ?? null;

    const supabase = await createClient();
    let sessionId: string | null = null;

    // store the generation as a session
    if (draft && jobData) {
      sessionId = randomUUID();
      const sessionPayload = {
        id: sessionId,
        user_id: user.id,
        job_data: jobData,
        current_draft: draft,
        writing_analysis: writingAnalysis,
        writing_sample: writingSample?.trim() ? writingSample : null,
      };

      const { error } = await supabase
        .from("cover_letter_sessions")
        .insert(sessionPayload);

      if (error) throw new Error(`Session insert failed: ${error.message}`);
    }

    // cache the cover letter generation only if a session insert occurred
    if (sessionId && skillsMatchScore) {
      const payload: ICachedCoverLetter = {
        user_id: user.id,
        job_title: body.jobTitle,
        company_name: body.companyName,
        session_id: sessionId,
        draft_name: `First Draft: ${getNowFormatted()}`,
        education_score: skillsMatchScore.education,
        experience_score: skillsMatchScore.experience,
        skills_score: skillsMatchScore.skills,
        projects_score: skillsMatchScore.projects,
        location_score: skillsMatchScore.location,
        overall_score: skillsMatchScore.overall,
        education_score_exp: skillsMatchScore.explanations.education,
        experience_score_exp: skillsMatchScore.explanations.experience,
        skills_score_exp: skillsMatchScore.explanations.skills,
        projects_score_exp: skillsMatchScore.explanations.projects,
        location_score_exp: skillsMatchScore.explanations.location,
        draft,
      };

      const { error } = await supabase
        .from("cached_cover_letters")
        .insert(payload);

      if (error) throw new Error(`DB insert failed: ${error.message}`);
    }

    // return the session id and all the cover letter data
    return NextResponse.json({ ...data, sessionId }, { status: 200 });
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

    const sessionId: string = body?.sessionId ?? "";
    if (!sessionId.trim()) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    const feedback: string = body?.feedback ?? "";
    if (!feedback.trim()) {
      return NextResponse.json({ error: "Missing feedback" }, { status: 400 });
    }

    const agentRes = await fetch(`${AGENT_BASE}/revise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, sessionId, feedback }),
    });

    const data = await agentRes.json().catch(() => null);

    if (!agentRes.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Cover letter generation failed" },
        { status: 502 },
      );
    }

    const revisedDraft: string = data?.revisedDraft ?? "";
    const draftName: string = data?.draftName ?? "";

    if (!revisedDraft.trim() || !draftName.trim()) {
      return NextResponse.json(
        { error: "An error occurred while revising the draft" },
        { status: 500 },
      );
    }

    // insert into cached_cover_letters table
    const supabase = await createClient();

    const { data: savedRow, error: rpcError } = await supabase.rpc(
      "save_cover_letter_revision",
      {
        p_session_id: sessionId,
        p_draft_name: `${draftName}: ${getNowFormatted()}`,
        p_revised_draft: revisedDraft,
      },
    );

    if (rpcError) {
      throw new Error(`Revision save failed: ${rpcError.message}`);
    }

    return NextResponse.json(
      {
        revisedDraft,
        draftName,
        sessionId,
        cachedCoverLetter: savedRow,
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
