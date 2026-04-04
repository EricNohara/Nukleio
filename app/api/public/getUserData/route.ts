/* eslint-disable @typescript-eslint/no-unused-vars */
import { after, NextRequest, NextResponse } from "next/server";

import { parseApiKey, signApiKeySecret } from "@/utils/auth/apiKeys";
import { createServiceRoleClient } from "@/utils/supabase/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, User-Email, Content-Type, Accept, X-Target-User-Id",
};

type PublicCachedUserInfoRow = {
  user_id: string;
  key_description: string;
  user_info: unknown;
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  // create fields for log
  const requestedAt = new Date().toISOString();
  let userId: string | null = null;
  let keyDescription: string | null = null;
  let statusCode: number = 500;
  let apiKey: string | undefined;
  let keyId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createServiceRoleClient>> | null =
    null;

  try {
    supabase = await createServiceRoleClient();

    // get the api key from the authorization header
    apiKey = req.headers.get("Authorization")?.split(" ")[1];
    if (!apiKey) {
      statusCode = 401;
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: statusCode, headers: CORS_HEADERS },
      );
    }

    // parse the key data
    const parsed = parseApiKey(apiKey);
    if (!parsed) {
      statusCode = 401;
      return NextResponse.json(
        { message: "Invalid API key format" },
        { status: statusCode, headers: CORS_HEADERS },
      );
    }

    keyId = parsed.keyId;
    const hashedKey = signApiKeySecret(parsed.secret);

    const targetUserId = req.headers.get("X-Target-User-Id");
    const { data, error } = await supabase.rpc("get_public_cached_user_info", {
      p_key_id: keyId,
      p_hashed_key: hashedKey,
      p_target_user_id: targetUserId,
    });
    if (error) throw error;

    const row = (
      Array.isArray(data) ? data[0] : data
    ) as PublicCachedUserInfoRow | null;

    if (!row) {
      statusCode = 401;
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: statusCode, headers: CORS_HEADERS },
      );
    }

    userId = row.user_id;
    keyDescription = row.key_description;

    statusCode = 200;

    if (
      row.key_description &&
      row.key_description !== "Nukleio Super Key" &&
      row.user_id
    ) {
      after(async () => {
        try {
          if (!supabase) {
            supabase = createServiceRoleClient();
          }
          const respondedAt = new Date().toISOString();
          const userAgent = req.headers.get("user-agent") || "unknown";

          await supabase.rpc("log_public_api_request", {
            p_user_id: row.user_id,
            p_requested_at: requestedAt,
            p_responded_at: respondedAt,
            p_status_code: statusCode,
            p_key_description: row.key_description,
            p_user_agent: userAgent,
            p_key_id: keyId,
          });
        } catch (logErr) {
          console.error("Failed to insert API log:", (logErr as Error).message);
        }
      });
    }
    return NextResponse.json(
      { userInfo: row.user_info },
      {
        status: statusCode,
        headers: CORS_HEADERS,
      },
    );
  } catch (err) {
    const error = err as Error;
    console.error(error.message);

    statusCode = 500;
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: statusCode,
        headers: CORS_HEADERS,
      },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
