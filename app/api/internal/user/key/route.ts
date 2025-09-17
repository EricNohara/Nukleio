import { NextRequest, NextResponse } from "next/server";

import { IApiKeyInternal } from "@/app/interfaces/IApiKey";
import { generateAndStoreKey } from "@/utils/auth/generateAndStoreKey";
import { getAuthenticatedUser } from "@/utils/auth/getAuthenticatedUser";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    const { data, error } = await supabase
      .from("api_keys")
      .select("created, expires, description, last_used")
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ keys: data }, { status: 200 });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    // parse body
    const result = await validateKeyRequestBody(req);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { description, expires } = result;

    // get user email
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id);

    if (error) throw error;

    const email = data[0].email;

    // generate and store new key
    const { key } = await generateAndStoreKey(
      supabase,
      user.id,
      email,
      description,
      expires
    );

    const newKey: IApiKeyInternal = {
      description: key.description,
      expires: key.expires,
      created: key.created,
      last_used: null,
    };

    return NextResponse.json({ key: newKey }, { status: 201 });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    // parse body
    const result = await validateKeyRequestBody(req);
    if (!result.valid) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const { description, expires } = result;

    // deleting old key if it exists
    await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", user.id)
      .eq("description", description);

    // generating the new key
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("id", user.id);

    if (error) throw error;

    const email = data[0].email;

    // generate and store new key
    const { key } = await generateAndStoreKey(
      supabase,
      user.id,
      email,
      description,
      expires
    );

    const updatedKey: IApiKeyInternal = {
      description: key.description,
      expires: key.expires,
      created: key.created,
      last_used: null,
    };

    return NextResponse.json({ key: updatedKey }, { status: 201 });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const { user, supabase, response } = await getAuthenticatedUser();
    if (!user) return response;

    // parse body
    const { searchParams } = new URL(req.url);
    const description = searchParams.get("description");

    if (!description) {
      return NextResponse.json(
        { error: "Missing required parameter" },
        { status: 400 }
      );
    }

    // deleting old key if it exists
    await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", user.id)
      .eq("description", description);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const error = err as Error;
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// validation helper function
type KeyRequestValidation =
  | { valid: true; description: string; expires: string | null }
  | { valid: false; error: string };

async function validateKeyRequestBody(
  req: NextRequest
): Promise<KeyRequestValidation> {
  const body = await req.json();
  const { description, expires } = body;

  // description must not be null or empty
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

  // validate expires to be either null or a timestamp in the future
  let expiresAt: string | null = null;
  if (expires !== null) {
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
        error: "expires must be a timestamp in the future.",
      };
    }

    expiresAt = new Date(expires).toISOString();
  }

  return { valid: true, description: description.trim(), expires: expiresAt };
}
