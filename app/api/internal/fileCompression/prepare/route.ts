import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { prepareFileCompression, type CompressionMediaKind } from "@/utils/fileCompression/client";

export const runtime = "nodejs";

const MEDIA_KINDS: CompressionMediaKind[] = ["portrait", "project-thumbnail", "resume", "transcript"];

export async function POST(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;
  try {
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
    console.error("Unable to prepare file compression", error);
    return NextResponse.json({ message: "Unable to prepare file compression" }, { status: 500 });
  }
}
