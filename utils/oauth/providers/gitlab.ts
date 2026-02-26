// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGitlabSignup(identityData: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    name: identityData.full_name ?? identityData.name,
    portrait_url: identityData.avatar_url ?? identityData.picture,
  };

  return updates;
}
