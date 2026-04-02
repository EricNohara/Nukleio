/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from "next/server";

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
  } finally {
    // add a log and update last used field for api key if we know the user id
    if (keyDescription && keyDescription !== "Nukleio Super Key" && userId) {
      try {
        // create the log
        const respondedAt = new Date().toISOString();
        const userAgent = req.headers.get("user-agent") || "unknown";

        // insert the log and update the last used field for the key
        if (!supabase) {
          supabase = await createServiceRoleClient();
        }
        await supabase.rpc("log_public_api_request", {
          p_user_id: userId,
          p_requested_at: requestedAt,
          p_responded_at: respondedAt,
          p_status_code: statusCode,
          p_key_description: keyDescription,
          p_user_agent: userAgent,
          p_key_id: keyId,
        });
      } catch (logErr) {
        console.error("Failed to insert API log:", (logErr as Error).message);
      }
    }
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
