// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGoogleSignup(identityData: any) {
  const username = identityData.full_name ?? identityData.name;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    name: username,
    portrait_url: identityData.avatar_url ?? identityData.picture,
  };

  return updates;
}
