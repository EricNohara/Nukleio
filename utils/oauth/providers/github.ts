export type UserGithubPublicData = {
  company: string | null;
  location: string | null;
  bio: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGithubSignup(identityData: any) {
  const username = identityData.user_name ?? identityData.preferred_username;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    name: username,
    portrait_url: identityData.avatar_url,
  };

  if (username) {
    const publicData = await getUserGithubPublicData(username);
    if (publicData) {
      updates.current_company = publicData.company;
      updates.current_address = publicData.location;
      updates.bio = publicData.bio;
    }
  }

  return updates;
}

// EXTERNAL API CALLS
async function getUserGithubPublicData(username: string) {
  if (!username) return;

  try {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`GitHub API error: ${res.status}`);
      return;
    }

    return (await res.json()) as UserGithubPublicData;
  } catch (error) {
    console.error("GitHub fetch failed:", error);
    return;
  }
}
