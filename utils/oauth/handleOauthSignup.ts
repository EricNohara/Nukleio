import { SupabaseClient, User, UserIdentity } from "@supabase/supabase-js";

import { handleGithubSignup } from "./providers/github";
import { handleGoogleSignup } from "./providers/google";

export async function handleOauthSignup(
  provider: string,
  supabase: SupabaseClient,
  user: User,
  identity: UserIdentity,
) {
  // get the user identity
  const identityData = identity.identity_data;
  if (!identityData) return;

  //   check if the user requires signup onboarding
  const { data: userRow } = await supabase
    .from("users")
    .select("requires_oauth_signup")
    .eq("id", user.id)
    .single();

  // exit if not new account
  if (!userRow?.requires_oauth_signup) return;

  // build update object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updates: Record<string, any> = {
    requires_oauth_signup: false,
  };

  //   handle different providers
  switch (provider) {
    case "github":
      updates = {
        ...updates,
        ...(await handleGithubSignup(identityData)),
      };
      break;

    case "google":
      updates = {
        ...updates,
        ...(await handleGoogleSignup(identityData)),
      };
      break;

    case "gitlab":
      break;

    case "linkedin_oidc":
      break;

    case "azure":
      // no useful data exposed
      break;

    default:
      break;
  }

  //   update the user with their provider information
  await supabase.from("users").update(updates).eq("id", user.id);
}
