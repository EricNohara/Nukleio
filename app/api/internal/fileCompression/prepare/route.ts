import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { prepareFileCompression, type CompressionMediaKind } from "@/utils/fileCompression/client";
import { AiRateLimitServiceError, requireUploadRateLimit } from "@/utils/file-upload/rateLimit";

export const runtime = "nodejs";

const MEDIA_KINDS: CompressionMediaKind[] = ["portrait", "project-thumbnail", "resume", "transcript"];

export async function POST(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;
  try {
    const rateLimit = await requireUploadRateLimit(request, user.id);
    if (rateLimit) return rateLimit;
    const body = await request.json() as { contentType?: unknown; mediaKind?: unknown };
    if (
      typeof body.contentType !== "string" ||
      typeof body.mediaKind !== "string" ||
      !MEDIA_KINDS.includes(body.mediaKind as CompressionMediaKind)
    ) {
      return NextResponse.json({ message: "Invalid compression request" }, { status: 400 });
    }
    const result = await prepareFileCompression({
      contentType: body.contentType,
      mediaKind: body.mediaKind as CompressionMediaKind,
    });
    const data = await result.json();
    return NextResponse.json(data, { status: result.status });
  } catch (error) {
    if (error instanceof AiRateLimitServiceError) {
      return NextResponse.json({ message: "Upload protection is temporarily unavailable." }, { status: 503 });
    }
    console.error("Unable to prepare file compression", error);
    return NextResponse.json({ message: "Unable to prepare file compression" }, { status: 500 });
  }
}
