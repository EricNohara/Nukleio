import { NextRequest, NextResponse } from "next/server";

import {
  ICachedCoverLetter,
  ISkillsMatchScore,
} from "@/app/interfaces/ICachedCoverLetter";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { requireTier } from "@/utils/auth/requireTier";
import { generateCoverLetterPdf } from "@/utils/coverLetter/generateCoverLetterPdf";
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
 * - ?conversationId=... -> fetch all drafts for that conversation (full rows)
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
    const conversationId = searchParams.get("conversationId");

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
    if (conversationId) {
      const { data, error } = await supabase.rpc(
        "get_cached_cover_letters_by_conversation",
        { p_conversation_id: conversationId },
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
    const conversationId: string = data?.conversationId ?? "";
    const skillsMatchScore: ISkillsMatchScore = data?.skillsMatchScore;

    const supabase = await createClient();

    if (draft && conversationId && skillsMatchScore) {
      const payload: ICachedCoverLetter = {
        user_id: user.id,
        job_title: body.jobTitle,
        company_name: body.companyName,
        draft_name: `First Draft: ${getNowFormatted()}`,
        conversation_id: conversationId,
        education_score: skillsMatchScore.education,
        skills_score: skillsMatchScore.skills,
        location_score: skillsMatchScore.location,
        projects_score: skillsMatchScore.projects,
        experience_score: skillsMatchScore.experience,
        overall_score: skillsMatchScore.overall,
        draft: draft,
      };

      const { error } = await supabase
        .from("cached_cover_letters")
        .insert(payload);

      if (error) throw new Error(`DB insert failed: ${error.message}`);
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

    const data = await agentRes.json().catch(() => null);

    if (!agentRes.ok) {
      return NextResponse.json(
        { error: data?.error ?? "Cover letter generation failed" },
        { status: 502 },
      );
    }

    const revisedDraft: string = data.revisedDraft;
    const draftName: string = data.draftName;

    if (!revisedDraft.trim() || !draftName.trim()) {
      return NextResponse.json(
        { error: "An error occurred while revising the draft" },
        { status: 500 },
      );
    }

    const pdfBuffer = await generateCoverLetterPdf(revisedDraft);

    // insert into cached_cover_letters table
    const supabase = await createClient();

    if (revisedDraft && draftName) {
      // retrieve ANY draft from cache
      const { data: existing, error: fetchErr } = await supabase
        .from("cached_cover_letters")
        .select(
          "education_score,skills_score,experience_score,projects_score,location_score,overall_score,job_title,company_name",
        )
        .eq("user_id", user.id)
        .eq("conversation_id", body.conversationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        throw new Error(`DB fetch failed: ${fetchErr.message}`);
      }

      if (!existing) {
        // This means they revised without ever generating the first draft row
        throw new Error(
          "No cached cover letter found for this job; generate first draft before revising.",
        );
      }

      const payload: ICachedCoverLetter = {
        user_id: user.id,
        job_title: existing.job_title,
        company_name: existing.company_name,
        draft_name: `${draftName}: ${getNowFormatted()}`,
        conversation_id: body.conversationId,
        education_score: existing.education_score,
        skills_score: existing.skills_score,
        location_score: existing.location_score,
        projects_score: existing.projects_score,
        experience_score: existing.experience_score,
        overall_score: existing.overall_score,
        draft: revisedDraft,
      };

      const { error } = await supabase
        .from("cached_cover_letters")
        .insert(payload);
      if (error) throw new Error(`DB insert failed: ${error.message}`);
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
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
