import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { requireTier } from "@/utils/auth/requireTier";
import { generateCoverLetterPdf } from "@/utils/coverLetter/generateCoverLetterPdf";

/**
 * PUT -> calls agent /revise -> returns PDF bytes
 */
export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;

  // gate this feature
  const gate = await requireTier(user.id, "premium");
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json().catch(() => null);
    const draft = body?.draft;

    if (typeof draft !== "string" || draft.trim().length === 0) {
      return NextResponse.json(
        { error: "No draft provided to generate PDF from." },
        { status: 400 },
      );
    }

    const pdfBuffer = await generateCoverLetterPdf(draft);

    // return the pdf buffer
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
