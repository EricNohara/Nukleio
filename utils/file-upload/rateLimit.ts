import { NextRequest, NextResponse } from "next/server";

import { AiRateLimitServiceError, consumeAiRateLimit } from "@/utils/aiAgents/rateLimit";
import { getAiRequestId } from "@/utils/aiAgents/requestId";

const UPLOAD_LIMIT = 10;
const UPLOAD_WINDOW_SECONDS = 60;

export async function requireUploadRateLimit(request: NextRequest, userId: string): Promise<NextResponse | null> {
  const result = await consumeAiRateLimit({
    operation: "storage_upload",
    requestId: getAiRequestId(request),
    userId,
    limit: UPLOAD_LIMIT,
    windowSeconds: UPLOAD_WINDOW_SECONDS,
  });
  if (result.allowed) return null;
  return NextResponse.json({ message: "You have reached the limit of 10 upload starts per minute. Please try again shortly." }, {
    status: 429,
    headers: { "Retry-After": String(result.retryAfterSeconds) },
  });
}

export { AiRateLimitServiceError };
