import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";
import { compressStagedFile, type CompressionMediaKind } from "@/utils/fileCompression/client";

export const runtime = "nodejs";

const MEDIA_KINDS: CompressionMediaKind[] = ["portrait", "project-thumbnail", "resume", "transcript"];

export async function POST(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser();
  if (!user) return response;
  try {
    const body = await request.json() as { contentType?: unknown; jobId?: unknown; mediaKind?: unknown };
    if (
      typeof body.contentType !== "string" ||
      typeof body.jobId !== "string" ||
      typeof body.mediaKind !== "string" ||
      !MEDIA_KINDS.includes(body.mediaKind as CompressionMediaKind)
    ) {
      return NextResponse.json({ message: "Invalid compression request" }, { status: 400 });
    }
    const result = await compressStagedFile({
      contentType: body.contentType,
      jobId: body.jobId,
      mediaKind: body.mediaKind as CompressionMediaKind,
    });
    if (!result.ok) {
      const data = await result.json().catch(() => null);
      return NextResponse.json(
        { message: data?.detail ?? data?.error ?? "File compression failed" },
        { status: result.status },
      );
    }
    return new NextResponse(result.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": result.headers.get("content-type") ?? "application/octet-stream",
        "X-Nukleio-Original-Bytes": result.headers.get("x-nukleio-original-bytes") ?? "",
        "X-Nukleio-Output-Bytes": result.headers.get("x-nukleio-output-bytes") ?? "",
      },
    });
  } catch (error) {
    console.error("Unable to compress file", error);
    return NextResponse.json({ message: "Unable to compress file" }, { status: 500 });
  }
}
