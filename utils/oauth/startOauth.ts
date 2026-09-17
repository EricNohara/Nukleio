"use client";

import { createClient } from "@/utils/supabase/client";

export type OAuthProvider = "azure" | "github" | "gitlab" | "google" | "linkedin_oidc";

export type OAuthButtonProps = {
  captchaToken: string | null;
  onCaptchaConsumed: () => void;
};

export async function startOauth(provider: OAuthProvider, captchaToken: string): Promise<void> {
  const preflight = await fetch("/api/internal/auth/oauth/preflight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, captchaToken }),
  });
  const preflightBody = await preflight.json().catch(() => null) as { message?: string } | null;
  if (!preflight.ok) throw new Error(preflightBody?.message ?? "Unable to start OAuth sign-in.");

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = `${base}/api/internal/auth/callback?provider=${provider}&next=${encodeURIComponent("/user")}`;
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: provider === "azure" ? { redirectTo, scopes: "email" } : { redirectTo },
  });
  if (error) throw error;
}
