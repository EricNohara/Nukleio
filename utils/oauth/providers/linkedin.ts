// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleLinkedinSignup(identityData: any) {
  const username =
    identityData.name ?? identityData.given_name ?? identityData.family_name;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    name: username,
    portrait_url: identityData.picture,
  };

  return updates;
}
