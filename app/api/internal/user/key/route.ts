import { NextRequest, NextResponse } from "next/server";

import { IApiKeyInternal } from "@/app/interfaces/IApiKey";
import {
  buildApiKey,
  generateApiKeyId,
  generateApiKeySecret,
  signApiKeySecret,
} from "@/utils/auth/apiKeys";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { data, error } = await supabase
      .from("api_keys")
      .select("id, created, expires, description, last_used")
      .eq("user_id", user.id)
      .order("created", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ keys: data }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    // validate the request body
    const result = await validateKeyRequestBody(req);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { description, expires } = result;

    const keyId = generateApiKeyId();
    const secret = generateApiKeySecret();
    const hashedKey = signApiKeySecret(secret); // store this in the db

    const createdAt = new Date().toISOString();

    // upload key data to supabase (not the real key though)
    const { error } = await supabase.from("api_keys").insert({
      id: keyId,
      user_id: user.id,
      hashed_key: hashedKey,
      description,
      expires,
      created: createdAt,
      last_used: null,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You already have an API key with that description." },
          { status: 409 },
        );
      }
      throw error;
    }

    // return the REAL key
    const newKey: IApiKeyInternal = {
      id: keyId,
      description,
      expires,
      created: createdAt,
      last_used: null,
    };

    // build the full api key using the key id and secret
    const apiKey = buildApiKey(keyId, secret);

    return NextResponse.json(
      {
        key: newKey,
        apiKey,
      },
      { status: 201 },
    );
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const result = await validateKeyRequestBody(req);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { description, expires } = result;

    const { error: deleteError } = await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", user.id)
      .eq("description", description);

    if (deleteError) throw deleteError;

    const keyId = generateApiKeyId();
    const secret = generateApiKeySecret();
    const hashedKey = signApiKeySecret(secret);

    const createdAt = new Date().toISOString();

    const { error: insertError } = await supabase.from("api_keys").insert({
      id: keyId,
      user_id: user.id,
      hashed_key: hashedKey,
      description,
      expires,
      created: createdAt,
      last_used: null,
    });

    if (insertError) throw insertError;

    const updatedKey: IApiKeyInternal = {
      id: keyId,
      description,
      expires,
      created: createdAt,
      last_used: null,
    };
    const apiKey = buildApiKey(keyId, secret);

    return NextResponse.json(
      {
        key: updatedKey,
        apiKey,
      },
      { status: 201 },
    );
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// delete by id - users can only delete their own keys
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { searchParams } = new URL(req.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return NextResponse.json(
        { error: "Missing required parameter" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("id", keyId)
      .eq("user_id", user.id);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// helper functions
type KeyRequestValidation =
  | { valid: true; description: string; expires: string | null }
  | { valid: false; error: string };

async function validateKeyRequestBody(
  req: NextRequest,
): Promise<KeyRequestValidation> {
  const body = await req.json();
  const { description, expires } = body;

  if (
    !description ||
    typeof description !== "string" ||
    description.trim() === ""
  ) {
    return {
      valid: false,
      error: "Description is required and must be a non-empty string.",
    };
  }

  let expiresAt: string | null = null;

  if (expires !== null && expires !== undefined) {
    if (typeof expires !== "string" || isNaN(Date.parse(expires))) {
      return {
        valid: false,
        error: "Expires must be a valid timestamp string or null.",
      };
    }

    const parsedDate = new Date(expires);
    const now = new Date();

    if (parsedDate <= now) {
      return {
        valid: false,
        error: "Expires must be a timestamp in the future.",
      };
    }

    expiresAt = parsedDate.toISOString();
  }

  return { valid: true, description: description.trim(), expires: expiresAt };
}
