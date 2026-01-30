import { NextResponse } from "next/server";

// The client you created from the Server-Side Auth instructions
import { handleOauthSignup } from "@/utils/oauth/handleOauthSignup";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const providerParam = searchParams.get("provider");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const identity = providerParam
        ? user?.identities?.find((i) => i.provider === providerParam)
        : user?.identities?.[0];

      if (user && identity && providerParam) {
        // TODO: autofill information for the user table
        console.log(providerParam, identity);

        handleOauthSignup(providerParam, supabase, user, identity);
      }

      // redirect back to the app from oauth flow
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}

// async function handleOauthSignup(
//   provider: string,
//   supabase: SupabaseClient<any, "public", any>,
//   user: User,
//   identity: UserIdentity,
// ) {
//   // get the user identity data
//   const identityData = identity.identity_data;
//   if (!identityData) return;

//   // check if user requires onboarding
//   const { data: userRow, error: userRowError } = await supabase
//     .from("users")
//     .select("requires_oauth_signup")
//     .eq("id", user.id)
//     .single();

//   if (userRowError) {
//     console.error(userRowError);
//     return;
//   }

//   // exit if not a new account
//   if (!userRow?.requires_oauth_signup) return;

//   // build update object
//   const updates: Record<string, any> = {
//     requires_oauth_signup: false,
//   };

//   switch (provider) {
//     case "github":
//       updates.name = identityData.user_name ?? identityData.preferred_username;
//       updates.portrait_url = identityData.avatar_url;

//       // get public information
//       const userGithubPublicData = await getUserGithubPublicData(updates.name);
//       if (userGithubPublicData) {
//         updates.current_company = userGithubPublicData.company;
//         updates.current_address = userGithubPublicData.location;
//         updates.bio = userGithubPublicData.bio;
//       }

//       break;

//     case "gitlab":
//       break;

//     case "linkedin_oidc":
//       break;

//     case "google":
//       updates.name = identityData.full_name ?? identityData.name;
//       updates.portrait_url = identityData.avatar_url ?? identityData.picture;
//       break;

//     case "azure":
//       // no useful data exposed
//       break;

//     default:
//       break;
//   }

//   // update user oauth data fields
//   const { error } = await supabase
//     .from("users")
//     .update(updates)
//     .eq("id", user.id);

//   if (error) {
//     console.error("OAuth onboarding update failed:", error);
//     throw error;
//   }
// }

// type UserGithubPublicData = {
//   company: string | null;
//   location: string | null;
//   bio: string | null;
// };

// // helper function to handle GitHub API
// async function getUserGithubPublicData(username: string) {
//   if (!username) return;

//   try {
//     const res = await fetch(`https://api.github.com/users/${username}`, {
//       headers: {
//         Accept: "application/vnd.github+json",
//         "X-GitHub-Api-Version": "2022-11-28",
//       },
//       cache: "no-store",
//     });

//     if (!res.ok) {
//       console.error(`GitHub API error: ${res.status}`);
//       return;
//     }

//     return (await res.json()) as UserGithubPublicData;
//   } catch (error) {
//     console.error("GitHub fetch failed:", error);
//     return;
//   }
// }

// helper function to handle GitHub Repo API call
