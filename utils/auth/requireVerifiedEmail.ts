import { NextResponse } from "next/server";

import type { User } from "@supabase/supabase-js";

export function requireVerifiedEmailForAi(user: User): NextResponse | null {
  // Supabase sets this trusted field for confirmed email/password accounts and
  // provider-verified OAuth identities. Do not rely on client metadata.
  if (user.email_confirmed_at) return null;

  return NextResponse.json(
    {
      code: "EMAIL_VERIFICATION_REQUIRED",
      error: "Verify your email address before using AI features.",
    },
    { status: 403 },
  );
}
